# Workout Push Server

Tiny single-user push backend for the workout app.

## Purpose
- register one or more browser/PWA push subscriptions
- schedule rest-finished push notifications
- send due notifications from a small polling loop
- clean up old sent / failed jobs automatically

## Required env vars

- `WORKOUT_PUSH_SECRET` — shared secret pasted into the app
- `VAPID_PUBLIC_KEY` — Web Push VAPID public key
- `VAPID_PRIVATE_KEY` — Web Push VAPID private key
- `VAPID_SUBJECT` — usually `mailto:you@example.com`

## Optional env vars

- `PORT` — defaults to `8787`
- `PUSH_DB_PATH` — defaults to `server/push.sqlite`
- `CORS_ORIGIN` — defaults to `*`

## Generate VAPID keys

Run:

```bash
npx web-push generate-vapid-keys
```

## Run locally

```bash
npm install
WORKOUT_PUSH_SECRET='YOUR_SECRET' \
VAPID_PUBLIC_KEY='YOUR_PUBLIC_KEY' \
VAPID_PRIVATE_KEY='YOUR_PRIVATE_KEY' \
VAPID_SUBJECT='mailto:zkirby16@gmail.com' \
npm run push-server
```

## Frontend values to paste into the app

- Shared secret → `WORKOUT_PUSH_SECRET`
- Push backend URL → your server URL, e.g. `https://push.example.com`

## Cleanup behavior

- sent notifications older than 7 days are deleted
- failed notifications older than 2 days are deleted
- dead subscriptions older than 7 days are deleted
