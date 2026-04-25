const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const webpush = require('web-push');

const APP_SECRET = process.env.WORKOUT_PUSH_SECRET;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:zkirby16@gmail.com';
const PORT = Number(process.env.PORT || 8787);
const DB_PATH = process.env.PUSH_DB_PATH || path.join(__dirname, 'push.sqlite');
const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
const HOST = process.env.HOST || '127.0.0.1';

if (!APP_SECRET || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing WORKOUT_PUSH_SECRET / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
  process.exit(1);
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disabled_at TEXT
  );

  CREATE TABLE IF NOT EXISTS scheduled_notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subscription_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    send_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at TEXT,
    error TEXT,
    FOREIGN KEY(subscription_id) REFERENCES subscriptions(id)
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_due ON scheduled_notifications(status, send_at);
`);

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const allowedOrigins = CORS_ORIGIN
  ? CORS_ORIGIN.split(',').map((value) => value.trim()).filter(Boolean)
  : [];

const rateBuckets = new Map();
function rateLimit({ windowMs, max }) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= max) {
      return res.status(429).json({ error: 'rate_limited' });
    }
    bucket.count += 1;
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets.entries()) {
    if (now > bucket.resetAt) rateBuckets.delete(key);
  }
}, 10 * 60 * 1000).unref();

const app = express();
app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (!allowedOrigins.length || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '32kb' }));

function authed(req, res, next) {
  const secret = req.header('x-app-secret');
  if (!secret || secret !== APP_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/vapid-public-key', rateLimit({ windowMs: 60 * 1000, max: 30 }), authed, (_req, res) => {
  res.json({ publicKey: VAPID_PUBLIC_KEY });
});

app.post('/register', rateLimit({ windowMs: 10 * 60 * 1000, max: 20 }), authed, (req, res) => {
  const sub = req.body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ error: 'invalid subscription' });
  }

  const stmt = db.prepare(`
    INSERT INTO subscriptions (endpoint, p256dh, auth, updated_at, last_seen_at, disabled_at)
    VALUES (@endpoint, @p256dh, @auth, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
    ON CONFLICT(endpoint) DO UPDATE SET
      p256dh=excluded.p256dh,
      auth=excluded.auth,
      updated_at=CURRENT_TIMESTAMP,
      last_seen_at=CURRENT_TIMESTAMP,
      disabled_at=NULL
  `);

  stmt.run({
    endpoint: sub.endpoint,
    p256dh: sub.keys.p256dh,
    auth: sub.keys.auth
  });

  const row = db.prepare('SELECT id FROM subscriptions WHERE endpoint = ?').get(sub.endpoint);
  res.json({ ok: true, subscriptionId: row.id });
});

app.post('/schedule', rateLimit({ windowMs: 60 * 1000, max: 60 }), authed, (req, res) => {
  const { endpoint, title, body, sendAt } = req.body || {};
  if (!endpoint || !title || !body || !sendAt) {
    return res.status(400).json({ error: 'missing fields' });
  }

  const sub = db.prepare('SELECT id FROM subscriptions WHERE endpoint = ? AND disabled_at IS NULL').get(endpoint);
  if (!sub) {
    return res.status(404).json({ error: 'subscription not found' });
  }

  db.prepare(`DELETE FROM scheduled_notifications WHERE subscription_id = ? AND status = 'pending'`).run(sub.id);
  db.prepare(`
    INSERT INTO scheduled_notifications (subscription_id, title, body, send_at)
    VALUES (?, ?, ?, ?)
  `).run(sub.id, title, body, sendAt);

  res.json({ ok: true });
});

app.post('/cancel', rateLimit({ windowMs: 60 * 1000, max: 60 }), authed, (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) {
    return res.status(400).json({ error: 'missing endpoint' });
  }

  const sub = db.prepare('SELECT id FROM subscriptions WHERE endpoint = ? AND disabled_at IS NULL').get(endpoint);
  if (!sub) {
    return res.json({ ok: true, cancelled: 0 });
  }

  const result = db.prepare(`DELETE FROM scheduled_notifications WHERE subscription_id = ? AND status = 'pending'`).run(sub.id);
  res.json({ ok: true, cancelled: result.changes });
});

app.post('/cleanup', authed, (_req, res) => {
  cleanup();
  res.json({ ok: true });
});

async function sendDueNotifications() {
  const nowIso = new Date().toISOString();
  const rows = db.prepare(`
    SELECT n.id, n.title, n.body, s.endpoint, s.p256dh, s.auth
    FROM scheduled_notifications n
    JOIN subscriptions s ON s.id = n.subscription_id
    WHERE n.status = 'pending' AND n.send_at <= ? AND s.disabled_at IS NULL
    ORDER BY n.send_at ASC
    LIMIT 20
  `).all(nowIso);

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth }
        },
        JSON.stringify({ title: row.title, body: row.body, url: '/' })
      );

      db.prepare(`
        UPDATE scheduled_notifications
        SET status = 'sent', sent_at = CURRENT_TIMESTAMP, error = NULL
        WHERE id = ?
      `).run(row.id);
    } catch (error) {
      const statusCode = error?.statusCode || 0;
      db.prepare(`
        UPDATE scheduled_notifications
        SET status = 'failed', error = ?
        WHERE id = ?
      `).run(String(error?.body || error?.message || 'push failed'), row.id);

      if (statusCode === 404 || statusCode === 410) {
        db.prepare(`UPDATE subscriptions SET disabled_at = CURRENT_TIMESTAMP WHERE endpoint = ?`).run(row.endpoint);
      }
    }
  }
}

function cleanup() {
  db.prepare(`DELETE FROM scheduled_notifications WHERE status = 'sent' AND sent_at < datetime('now', '-7 days')`).run();
  db.prepare(`DELETE FROM scheduled_notifications WHERE status = 'failed' AND created_at < datetime('now', '-2 days')`).run();
  db.prepare(`DELETE FROM subscriptions WHERE disabled_at IS NOT NULL AND disabled_at < datetime('now', '-7 days')`).run();
}

setInterval(() => {
  sendDueNotifications().catch((error) => console.error('send loop error', error));
  cleanup();
}, 15000);

app.listen(PORT, HOST, () => {
  console.log(`Workout push server listening on ${HOST}:${PORT}`);
});
