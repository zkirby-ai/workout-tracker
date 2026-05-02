'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { exerciseSubstitutions, formatRest, type Exercise, workoutDays } from '../lib/workout-data';

type SetLog = {
  weight: string;
  reps: string;
  completed: boolean;
};

function getMaxRepValue(repRange: string) {
  const match = repRange.match(/(\d+)\s*-\s*(\d+)/);
  if (match) return match[2];
  const single = repRange.match(/(\d+)/);
  return single ? single[1] : '';
}

type HistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  dayName: string;
  maxWeight: number;
  topSetReps?: number | null;
  completedSets?: number;
  timestamp: string;
};

type TrendSummary = {
  latest: number;
  previous: number | null;
  first: number | null;
  maxEver: number;
  deltaFromPrevious: number | null;
  deltaFromFirst: number | null;
};

function getTrendSummary(entries: HistoryEntry[]): TrendSummary {
  const latest = entries[entries.length - 1]?.maxWeight ?? 0;
  const previous = entries.length > 1 ? entries[entries.length - 2].maxWeight : null;
  const first = entries[0]?.maxWeight ?? null;
  const maxEver = Math.max(...entries.map((e) => e.maxWeight));
  return {
    latest,
    previous,
    first,
    maxEver,
    deltaFromPrevious: previous === null ? null : latest - previous,
    deltaFromFirst: first === null ? null : latest - first
  };
}

function formatDelta(d: number | null, unit = 'lb') {
  if (d === null || Number.isNaN(d)) return 'New';
  if (d === 0) return `Even ${unit}`;
  const sign = d > 0 ? '+' : '−';
  return `${sign}${Math.abs(d)} ${unit}`;
}

function formatSessionDate(ts: string) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

type Screen = 'now' | 'plan' | 'progress' | 'settings';

type TimerState = {
  endsAt: number | null;
  durationSeconds: number;
};

type PushSetup = {
  appSecret: string;
  apiBase: string;
  endpoint: string | null;
  enabled: boolean;
};

type WorkoutSessionState = {
  dayId: string;
  screen: Screen;
  setState: Record<string, SetLog[]>;
  activeLabel: string;
  substitutions: Record<string, Exercise>;
};

const DEFAULT_PUSH_SECRET = '3598509926:ZzdnQ1mpJk_hmlzz_Pdbb3j8Ubud4IhP039';
const DEFAULT_PUSH_API_BASE = 'https://push.zkirby.com';
const DEFAULT_ACTIVE_LABEL = 'Starts after each set';
const KEY_LIFTS = ['flat-bench', 'weighted-pullup', 'tbar', 'smith-incline', 'shoulder-press'];

function makeInitialState(dayId: string) {
  const day = workoutDays.find((x) => x.id === dayId) ?? workoutDays[0];
  return Object.fromEntries(
    day.exercises.map((e) => [
      e.id,
      Array.from({ length: e.sets }, () => ({ weight: '', reps: '', completed: false }))
    ])
  ) as Record<string, SetLog[]>;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem('workout-history');
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function loadTimerState(): TimerState {
  if (typeof window === 'undefined') return { endsAt: null, durationSeconds: 0 };
  try {
    const raw = window.localStorage.getItem('workout-timer-state');
    return raw ? (JSON.parse(raw) as TimerState) : { endsAt: null, durationSeconds: 0 };
  } catch {
    return { endsAt: null, durationSeconds: 0 };
  }
}

function loadPushSetup(): PushSetup {
  const defaults = { appSecret: DEFAULT_PUSH_SECRET, apiBase: DEFAULT_PUSH_API_BASE, endpoint: null, enabled: false };
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem('workout-push-setup');
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as PushSetup;
    return { ...defaults, ...parsed, apiBase: DEFAULT_PUSH_API_BASE };
  } catch {
    return defaults;
  }
}

function loadWorkoutSessionState() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('workout-session-state');
    return raw ? (JSON.parse(raw) as WorkoutSessionState) : null;
  } catch {
    return null;
  }
}

function loadStickySubstitutions() {
  if (typeof window === 'undefined') return {} as Record<string, Exercise>;
  try {
    const raw = window.localStorage.getItem('workout-sticky-substitutions');
    return raw ? (JSON.parse(raw) as Record<string, Exercise>) : {};
  } catch {
    return {} as Record<string, Exercise>;
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

/* ---------- Icons ---------- */

const Icon = {
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  chev: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
};

export function WorkoutTracker() {
  const initialSession = useMemo(() => loadWorkoutSessionState(), []);
  const [screen, setScreen] = useState<Screen>(initialSession?.screen ?? 'now');
  const [dayId, setDayId] = useState(initialSession?.dayId ?? workoutDays[0].id);
  const currentDay = useMemo(() => workoutDays.find((d) => d.id === dayId) ?? workoutDays[0], [dayId]);
  const [setState, setSetState] = useState<Record<string, SetLog[]>>(
    () => initialSession?.setState ?? makeInitialState(initialSession?.dayId ?? workoutDays[0].id)
  );
  const [timerState, setTimerState] = useState<TimerState>({ endsAt: null, durationSeconds: 0 });
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [activeLabel, setActiveLabel] = useState(initialSession?.activeLabel ?? DEFAULT_ACTIVE_LABEL);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported');
  const [notificationHint, setNotificationHint] = useState('');
  const [pushSetup, setPushSetup] = useState<PushSetup>({ appSecret: '', apiBase: '', endpoint: null, enabled: false });
  const [pushStatus, setPushStatus] = useState('');
  const [dayPickerOpen, setDayPickerOpen] = useState(false);
  const [substitutionPickerOpen, setSubstitutionPickerOpen] = useState(false);
  const [substitutions, setSubstitutions] = useState<Record<string, Exercise>>(() => {
    const sticky = loadStickySubstitutions();
    return Object.keys(sticky).length ? sticky : (initialSession?.substitutions ?? {});
  });
  const previousDayIdRef = useRef(dayId);

  useEffect(() => {
    if (previousDayIdRef.current === dayId) return;
    previousDayIdRef.current = dayId;
    setSetState(makeInitialState(dayId));
    setTimerState({ endsAt: null, durationSeconds: 0 });
    setActiveLabel(DEFAULT_ACTIVE_LABEL);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('workout-timer-state');
    }
  }, [dayId]);

  useEffect(() => {
    setHistory(loadHistory());
    setTimerState(loadTimerState());
    setPushSetup(loadPushSetup());

    if (typeof window === 'undefined') return;
    const savedSession = loadWorkoutSessionState();
    if (savedSession?.dayId === dayId) {
      previousDayIdRef.current = savedSession.dayId;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator && 'standalone' in window.navigator && (window.navigator as Navigator & { standalone?: boolean }).standalone);
    const isIPhone = /iPhone|iPad|iPod/i.test(window.navigator.userAgent);

    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission !== 'granted' && isIPhone && !isStandalone) {
        setNotificationHint('On iPhone, add this app to Home Screen, then reopen to enable notifications.');
      }
    } else {
      setNotificationPermission('unsupported');
      if (isIPhone && !isStandalone) {
        setNotificationHint('On iPhone, add this app to your Home Screen to unlock web notifications.');
      } else {
        setNotificationHint('Notifications are not available in this browser context.');
      }
    }
  }, [dayId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      'workout-session-state',
      JSON.stringify({ dayId, screen, setState, activeLabel, substitutions } satisfies WorkoutSessionState)
    );
  }, [activeLabel, dayId, screen, setState, substitutions]);

  const secondsLeft = timerState.endsAt ? Math.max(0, Math.ceil((timerState.endsAt - nowMs) / 1000)) : 0;

  useEffect(() => {
    if (timerState.endsAt && secondsLeft <= 0) {
      setTimerState({ endsAt: null, durationSeconds: 0 });
      window.localStorage.removeItem('workout-timer-state');
      setActiveLabel('Rest complete');
      if (typeof window !== 'undefined') {
        if ('vibrate' in navigator) navigator.vibrate?.([200, 120, 200]);
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Rest complete', { body: 'Time for your next set.', silent: false });
        }
      }
    }
  }, [secondsLeft, timerState.endsAt]);

  const exercisesForDay = useMemo(
    () => currentDay.exercises.map((exercise) => substitutions[exercise.id] ?? exercise),
    [currentDay.exercises, substitutions]
  );

  const totalCompleted = exercisesForDay.reduce(
    (acc, e) => acc + (setState[e.id]?.filter((s) => s.completed).length ?? 0),
    0
  );
  const totalSets = exercisesForDay.reduce((acc, e) => acc + e.sets, 0);

  const exerciseIndex = exercisesForDay.findIndex((e) => {
    const sets = setState[e.id] ?? [];
    return sets.some((s) => !s.completed);
  });
  const currentExercise = exerciseIndex >= 0 ? exercisesForDay[exerciseIndex] : exercisesForDay[exercisesForDay.length - 1];
  const currentSets = setState[currentExercise.id] ?? [];
  const pendingSetIndex = currentSets.findIndex((s) => !s.completed);
  const currentSetIndex = pendingSetIndex >= 0 ? pendingSetIndex : Math.max(0, currentSets.length - 1);
  const activeSet = currentSets[currentSetIndex] ?? currentSets[currentSets.length - 1];
  const dayDone = totalCompleted === totalSets;

  const progressByExercise = useMemo(() => {
    const grouped = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const list = grouped.get(entry.exerciseId) ?? [];
      list.push(entry);
      grouped.set(entry.exerciseId, list.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    }
    return grouped;
  }, [history]);

  const currentExerciseHistory = progressByExercise.get(currentExercise.id) ?? [];
  const previousSession = currentExerciseHistory.slice(-1)[0] ?? null;
  const previousSessionTrend = currentExerciseHistory.length > 0 ? getTrendSummary(currentExerciseHistory) : null;

  const sortedProgressEntries = useMemo(() =>
    [...progressByExercise.entries()].sort((a, b) => {
      const ai = KEY_LIFTS.indexOf(a[0]);
      const bi = KEY_LIFTS.indexOf(b[0]);
      if (ai === -1 && bi === -1) return a[1][a[1].length - 1].exerciseName.localeCompare(b[1][b[1].length - 1].exerciseName);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    })
  , [progressByExercise]);

  const keyLiftProgress = sortedProgressEntries.filter(([id]) => KEY_LIFTS.includes(id));
  const secondaryProgress = sortedProgressEntries.filter(([id]) => !KEY_LIFTS.includes(id));

  function persistHistory(next: HistoryEntry[]) {
    setHistory(next);
    window.localStorage.setItem('workout-history', JSON.stringify(next));
  }

  function persistTimer(next: TimerState) {
    setTimerState(next);
    if (next.endsAt) {
      window.localStorage.setItem('workout-timer-state', JSON.stringify(next));
    } else {
      window.localStorage.removeItem('workout-timer-state');
    }
  }

  function persistPushSetup(next: PushSetup) {
    setPushSetup(next);
    window.localStorage.setItem('workout-push-setup', JSON.stringify(next));
  }

  function persistStickySubstitutions(next: Record<string, Exercise>) {
    setSubstitutions(next);
    window.localStorage.setItem('workout-sticky-substitutions', JSON.stringify(next));
  }

  function updateField(exId: string, idx: number, field: 'weight' | 'reps', value: string) {
    setSetState((cur) => ({
      ...cur,
      [exId]: cur[exId].map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    }));
  }

  async function schedulePushNotification(name: string, durationSeconds: number) {
    if (!pushSetup.enabled || !pushSetup.endpoint || !pushSetup.apiBase || !pushSetup.appSecret) return;
    try {
      await fetch(`${pushSetup.apiBase}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': pushSetup.appSecret,
          'bypass-tunnel-reminder': '1'
        },
        body: JSON.stringify({
          endpoint: pushSetup.endpoint,
          title: 'Rest complete',
          body: `Time for your next set: ${name}`,
          sendAt: new Date(Date.now() + durationSeconds * 1000).toISOString()
        })
      });
    } catch {
      setPushStatus('Could not schedule background push notification.');
    }
  }

  function startTimer(durationSeconds: number, name?: string) {
    const next = { endsAt: Date.now() + durationSeconds * 1000, durationSeconds };
    persistTimer(next);
    setNowMs(Date.now());
    if (name) void schedulePushNotification(name, durationSeconds);
  }

  function completeSet(exId: string, idx: number, restSeconds: number, name: string) {
    const next = {
      ...setState,
      [exId]: setState[exId].map((s, i) => (i === idx ? { ...s, completed: true } : s))
    };
    setSetState(next);
    startTimer(restSeconds, name);
    setActiveLabel(`${name} · Set ${idx + 1}`);

    const allDone = next[exId].every((s) => s.completed);
    if (allDone) {
      const ex = exercisesForDay.find((x) => x.id === exId);
      const parsed = next[exId].map((s) => ({
        weight: Number.parseFloat(s.weight) || 0,
        reps: Number.parseInt(s.reps, 10) || 0
      }));
      const maxWeight = Math.max(0, ...parsed.map((s) => s.weight));
      const top = parsed.reduce((best, s) => (s.weight > best.weight ? s : best), { weight: 0, reps: 0 });
      if (ex && maxWeight > 0) {
        const entry: HistoryEntry = {
          exerciseId: exId,
          exerciseName: ex.name,
          dayName: currentDay.name,
          maxWeight,
          topSetReps: top.reps || null,
          completedSets: next[exId].filter((s) => s.completed).length,
          timestamp: new Date().toISOString()
        };
        persistHistory([...history, entry]);
      }
    }
  }

  function adjustTimer(delta: number) {
    if (!timerState.endsAt) return;
    startTimer(Math.max(0, secondsLeft + delta), currentExercise.name);
  }

  function stopTimer() {
    persistTimer({ endsAt: null, durationSeconds: 0 });
    setActiveLabel('Rest skipped');
  }

  async function enableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setNotificationPermission('unsupported');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
  }

  async function enableBackgroundPush() {
    try {
      if (!pushSetup.appSecret || !pushSetup.apiBase) {
        setPushStatus('Enter your shared secret first.');
        return;
      }
      if (!('serviceWorker' in navigator)) {
        setPushStatus('Service workers unavailable.');
        return;
      }
      if (!('PushManager' in window)) {
        setPushStatus('PushManager unavailable.');
        return;
      }
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        setPushStatus('Notification permission was not granted.');
        return;
      }
      const registration = await navigator.serviceWorker.register('/sw.js');
      const keyResponse = await fetch(`${pushSetup.apiBase}/vapid-public-key`, {
        headers: { 'x-app-secret': pushSetup.appSecret, 'bypass-tunnel-reminder': '1' }
      });
      const { publicKey } = await keyResponse.json();
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      await fetch(`${pushSetup.apiBase}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': pushSetup.appSecret,
          'bypass-tunnel-reminder': '1'
        },
        body: JSON.stringify({ subscription })
      });
      const next = { ...pushSetup, endpoint: subscription.endpoint, enabled: true };
      persistPushSetup(next);
      setPushStatus('Background push enabled for this device.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown push setup failure';
      setPushStatus(`Push setup failed: ${message}`);
    }
  }

  function skipSet() {
    const ex = currentExercise;
    completeSet(ex.id, currentSetIndex, ex.restSeconds, ex.name);
  }

  function applySubstitution(baseExerciseId: string, exercise: Exercise) {
    setSetState((cur) => {
      if (cur[exercise.id]) return cur;
      return {
        ...cur,
        [exercise.id]: Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '', completed: false }))
      };
    });
    persistStickySubstitutions({ ...substitutions, [baseExerciseId]: exercise });
    setSubstitutionPickerOpen(false);
    setActiveLabel(`Sticky swap: ${exercise.name}`);
  }

  function clearSubstitution(baseExerciseId: string) {
    const next = { ...substitutions };
    delete next[baseExerciseId];
    persistStickySubstitutions(next);
    setSubstitutionPickerOpen(false);
    setActiveLabel('Back to programmed exercise');
  }

  /* ---------- Derived ---------- */

  const timerProgress =
    timerState.durationSeconds > 0 && timerState.endsAt
      ? Math.max(0, Math.min(100, (secondsLeft / timerState.durationSeconds) * 100))
      : 0;
  const timerRunning = !!timerState.endsAt && secondsLeft > 0;

  const todayDateStr = useMemo(
    () => new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase(),
    []
  );

  /* ---------- Render parts ---------- */

  function NowScreen() {
    if (dayDone) {
      return (
        <section className="doneCard">
          <span className="eyebrow">Done</span>
          <h2>Workout complete</h2>
          <p>You finished {currentDay.theme}. Tap Progress to see how today moved your numbers.</p>
        </section>
      );
    }
    const ex = currentExercise;
    const baseExercise = currentDay.exercises[exerciseIndex] ?? currentDay.exercises[currentDay.exercises.length - 1];
    const activeSubstitution = substitutions[baseExercise.id] ?? null;
    const substitutionOptions = exerciseSubstitutions[baseExercise.id] ?? [];
    return (
      <>
        {/* Timer */}
        <section className={`timerCard ${timerRunning ? 'active' : 'idle'}`}>
          {timerRunning ? <div className="timerProgress" style={{ ['--p' as string]: `${timerProgress}%` }} /> : null}
          <div className="timerHead">
            <span className="l">{timerRunning ? 'Resting' : 'Rest timer'}</span>
            <span className="miniProgress">{totalCompleted} / <span className="total">{totalSets} sets</span></span>
          </div>
          <div className={`timerValue ${timerRunning ? 'active' : ''}`}>{formatRest(secondsLeft)}</div>
          <div className="timerSub">{activeLabel}</div>
          <div className="timerActions">
            <button onClick={() => adjustTimer(30)} disabled={!timerRunning}>+30s</button>
            <button onClick={stopTimer} disabled={!timerRunning}>Skip rest</button>
          </div>
        </section>

        {/* Active exercise */}
        <section className="exerciseCard">
          <div className="exerciseHead">
            <div className="row1">
              <span className={`severity ${ex.severity.toLowerCase()}`}>{ex.severity}</span>
              <span className="eyebrow">{exerciseIndex + 1} of {currentDay.exercises.length}</span>
            </div>
            <h2>{ex.name}</h2>
            <div className="exerciseActionsRow">
              <button className="swapBtn" onClick={() => setSubstitutionPickerOpen(true)}>
                Swap exercise
              </button>
              {activeSubstitution ? <span className="swapNote">Subbed in</span> : null}
            </div>
            <div className="metaRow">
              <span className="metaChip"><span className="l">Sets</span>{ex.sets}</span>
              <span className="metaChip"><span className="l">Reps</span>{ex.reps}</span>
              <span className="metaChip"><span className="l">Rest</span>{formatRest(ex.restSeconds)}</span>
            </div>
          </div>

          {previousSession && previousSessionTrend ? (
            <div className="lastSession">
              <div>
                <div className="ll">Last time</div>
                <div className="lv">
                  {previousSession.maxWeight} lb
                  {previousSession.topSetReps ? ` × ${previousSession.topSetReps}` : ''}
                </div>
                <div className="lsub">
                  {formatSessionDate(previousSession.timestamp)} · PR {previousSessionTrend.maxEver} lb
                </div>
              </div>
              <span
                className={`deltaPill ${previousSessionTrend.deltaFromPrevious !== null && previousSessionTrend.deltaFromPrevious > 0 ? 'up' : ''} ${previousSessionTrend.deltaFromPrevious !== null && previousSessionTrend.deltaFromPrevious < 0 ? 'down' : ''}`}
              >
                {previousSessionTrend.deltaFromPrevious === null ? 'First log' : `${formatDelta(previousSessionTrend.deltaFromPrevious)} vs prior`}
              </span>
            </div>
          ) : null}

          <div className="setLogger">
            <div className="setHead">
              <div className="setNum">Set {currentSetIndex + 1}<span className="of">/ {ex.sets}</span></div>
              <button className="skipLink" onClick={skipSet}>Skip set</button>
            </div>

            <div className="setDots" aria-hidden="true">
              {currentSets.map((s, i) => (
                <span key={i} className={`setDot ${s.completed ? 'done' : ''} ${i === currentSetIndex && !s.completed ? 'current' : ''}`} />
              ))}
            </div>

            <div className="inputs">
              <label className="numInput">
                <span>Weight (lb)</span>
                <input
                  inputMode="decimal"
                  value={activeSet?.weight ?? ''}
                  onChange={(e) => updateField(ex.id, currentSetIndex, 'weight', e.target.value)}
                  placeholder={previousSession ? String(previousSession.maxWeight) : '—'}
                />
              </label>
              <label className="numInput">
                <span>Reps</span>
                <input
                  inputMode="numeric"
                  value={activeSet?.reps ?? ''}
                  onChange={(e) => updateField(ex.id, currentSetIndex, 'reps', e.target.value)}
                  placeholder={getMaxRepValue(ex.reps) || '—'}
                />
              </label>
              <button
                type="button"
                className="maxRepBtn"
                onClick={() => updateField(ex.id, currentSetIndex, 'reps', getMaxRepValue(ex.reps))}
              >
                Max
              </button>
            </div>

            <button
              className="completeBtn"
              onClick={() => completeSet(ex.id, currentSetIndex, ex.restSeconds, ex.name)}
              disabled={activeSet?.completed}
            >
              {activeSet?.completed ? 'Set complete' : (
                <>
                  Log set {Icon.check}
                </>
              )}
            </button>
          </div>
        </section>
      </>
    );
  }

  function PlanScreen() {
    return (
      <section className="exerciseList">
        {exercisesForDay.map((ex) => {
          const sets = setState[ex.id] ?? [];
          const completed = sets.filter((s) => s.completed).length;
          return (
            <article className="exerciseCardList" key={ex.id}>
              <div className="ehd">
                <div>
                  <span className={`severity ${ex.severity.toLowerCase()}`}>{ex.severity}</span>
                </div>
                <span className="eyebrow">Rest {formatRest(ex.restSeconds)}</span>
              </div>
              <h3>{ex.name}</h3>
              <div className="stats">
                <div className="stat"><div className="l">Sets</div><div className="v">{ex.sets}</div></div>
                <div className="stat"><div className="l">Reps</div><div className="v">{ex.reps}</div></div>
                <div className="stat"><div className="l">Done</div><div className="v">{completed}/{ex.sets}</div></div>
              </div>
            </article>
          );
        })}
      </section>
    );
  }

  function ProgressScreen() {
    if (progressByExercise.size === 0) {
      return (
        <section className="doneCard">
          <span className="eyebrow">Progress</span>
          <h2>No history yet</h2>
          <p>Finish an exercise with logged weight and your max-weight history starts building automatically.</p>
        </section>
      );
    }
    return (
      <>
        {keyLiftProgress.length > 0 ? (
          <section className="progressIntro">
            <p className="eyebrow">Anchor lifts</p>
            <h2>Key lifts first</h2>
            <p>Bench, pull-up, T-bar, smith incline, and shoulder press stay pinned at the top so progress is always one glance away.</p>
          </section>
        ) : null}

        {[
          { title: 'Key lifts', eyebrow: 'priority', items: keyLiftProgress },
          { title: 'Everything else', eyebrow: 'support work', items: secondaryProgress }
        ].map((section) =>
          section.items.length > 0 ? (
            <Fragment key={section.title}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', margin: '20px 2px 8px' }}>
                <div>
                  <p className="eyebrow">{section.eyebrow}</p>
                  <h2 className="headline" style={{ fontSize: 19 }}>{section.title}</h2>
                </div>
              </div>
              <div className="progressList">
                {section.items.map(([id, entries]) => {
                  const latest = entries[entries.length - 1];
                  const trend = getTrendSummary(entries);
                  const isKey = KEY_LIFTS.includes(id);
                  return (
                    <article className={`progressCard ${isKey ? 'key' : ''}`} key={id}>
                      <div className="pHead">
                        <h3>{latest.exerciseName}</h3>
                        <span className="prBadge">PR {trend.maxEver}</span>
                      </div>
                      <div className="callout">
                        <strong>{trend.deltaFromFirst === null ? 'First log' : `${formatDelta(trend.deltaFromFirst)} since first log`}</strong>
                        <span>
                          {trend.deltaFromPrevious === null
                            ? 'First entry — future sessions compare here.'
                            : trend.deltaFromPrevious > 0
                              ? `Up ${Math.abs(trend.deltaFromPrevious)} lb from last entry.`
                              : trend.deltaFromPrevious < 0
                                ? `Down ${Math.abs(trend.deltaFromPrevious)} lb from last entry — still data.`
                                : 'Matched your last logged top set exactly.'}
                        </span>
                      </div>
                      <Sparkline entries={entries} />
                      <div className="pStats">
                        <div className="stat"><div className="l">Latest</div><div className="v">{trend.latest}</div></div>
                        <div className="stat"><div className="l">Last</div><div className="v">{trend.previous ?? '—'}</div></div>
                        <div className="stat"><div className="l">Logs</div><div className="v">{entries.length}</div></div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </Fragment>
          ) : null
        )}
      </>
    );
  }

  function SettingsScreen() {
    return (
      <div className="settingsList">
        <article className="settingsRow">
          <span className="sLabel">Notifications</span>
          <h3>Background push</h3>
          <p>Sends a push when rest is up — works even if the app is in the background. Needs a one-time secret.</p>
          <input
            className="settingsInput"
            value={pushSetup.appSecret}
            onChange={(e) => persistPushSetup({ ...pushSetup, appSecret: e.target.value })}
            placeholder="Shared secret"
          />
          <button className="btn primary" onClick={enableBackgroundPush}>
            {pushSetup.enabled ? 'Re-enable background push' : 'Enable background push'}
          </button>
          {!pushSetup.enabled && notificationPermission !== 'granted' ? (
            <button className="btn ghost" onClick={enableNotifications}>
              {notificationPermission === 'unsupported' ? 'Set up local notifications' : 'Enable local notifications'}
            </button>
          ) : null}
          {pushStatus ? <p className={pushSetup.enabled ? 'statusOk' : 'statusInfo'}>{pushStatus}</p> : null}
          {!pushStatus && notificationHint ? <p className="statusWarn">{notificationHint}</p> : null}
          {pushSetup.enabled ? <p className="statusOk">Background push is enabled on this device.</p> : null}
        </article>

        <article className="settingsRow">
          <span className="sLabel">Data</span>
          <h3>Local-only</h3>
          <p>All workout history, sets, and timer state live in this device's localStorage. Clear it to reset everything.</p>
          <button
            className="btn ghost"
            onClick={() => {
              if (!confirm('Clear all workout history?')) return;
              window.localStorage.removeItem('workout-history');
              setHistory([]);
            }}
          >
            Clear workout history
          </button>
        </article>
      </div>
    );
  }

  /* ---------- Shell ---------- */

  return (
    <main className="shell">
      <div className="topBar">
        <div className="brand">
          <span className="pulse" />
          <span>Work<em>out</em></span>
        </div>
        <div className="topMeta">
          <span className="strong">{todayDateStr}</span>
        </div>
      </div>

      {/* Day picker (compact) */}
      <button className="dayPicker" onClick={() => setDayPickerOpen(true)} aria-label="Change day">
        <div className="dpInfo">
          <div className="label">Today's session · {currentDay.name}</div>
          <div className="name">{currentDay.theme.replace('Tai-Lord ', '')}</div>
        </div>
        <span className="dpButton">Switch {Icon.chev}</span>
      </button>

      {screen === 'now' && NowScreen()}
      {screen === 'plan' && PlanScreen()}
      {screen === 'progress' && ProgressScreen()}
      {screen === 'settings' && SettingsScreen()}

      <nav className="tabBar" aria-label="Sections">
        <button className={`tab ${screen === 'now' ? 'active' : ''}`} onClick={() => setScreen('now')}>Now</button>
        <button className={`tab ${screen === 'plan' ? 'active' : ''}`} onClick={() => setScreen('plan')}>Plan</button>
        <button className={`tab ${screen === 'progress' ? 'active' : ''}`} onClick={() => setScreen('progress')}>Progress</button>
        <button className={`tab ${screen === 'settings' ? 'active' : ''}`} onClick={() => setScreen('settings')}>Settings</button>
      </nav>

      {substitutionPickerOpen ? (
        <>
          <div className="sheetBackdrop" onClick={() => setSubstitutionPickerOpen(false)} />
          <div className="sheet" role="dialog" aria-label="Swap exercise">
            <span className="grabber" />
            <h2>Swap exercise</h2>
            <p className="sheetHelp">Pick an alternate movement. Your choice will stick for future workouts until you reset it.</p>
            <div className="daySheet">
              {exerciseSubstitutions[(currentDay.exercises[exerciseIndex] ?? currentDay.exercises[currentDay.exercises.length - 1]).id]?.map((option) => (
                <button
                  key={option.id}
                  onClick={() => applySubstitution((currentDay.exercises[exerciseIndex] ?? currentDay.exercises[currentDay.exercises.length - 1]).id, option)}
                >
                  <span className="index">Sticky</span>
                  <span>
                    <span className="ms">{option.name}</span>
                    <span className="mf">{option.sets} sets · {option.reps} · rest {formatRest(option.restSeconds)}</span>
                  </span>
                  <span className="check">{Icon.chev}</span>
                </button>
              )) ?? []}
              {substitutions[(currentDay.exercises[exerciseIndex] ?? currentDay.exercises[currentDay.exercises.length - 1]).id] ? (
                <button onClick={() => clearSubstitution((currentDay.exercises[exerciseIndex] ?? currentDay.exercises[currentDay.exercises.length - 1]).id)}>
                  <span className="index">Reset</span>
                  <span>
                    <span className="ms">Back to programmed exercise</span>
                    <span className="mf">Remove the sticky swap for future workouts</span>
                  </span>
                  <span className="check">{Icon.check}</span>
                </button>
              ) : null}
            </div>
          </div>
        </>
      ) : null}

      {dayPickerOpen ? (
        <>
          <div className="sheetBackdrop" onClick={() => setDayPickerOpen(false)} />
          <div className="sheet" role="dialog" aria-label="Pick a day">
            <span className="grabber" />
            <h2>Switch session</h2>
            <div className="daySheet">
              {workoutDays.map((d) => (
                <button
                  key={d.id}
                  className={d.id === dayId ? 'active' : ''}
                  onClick={() => { setDayId(d.id); setDayPickerOpen(false); }}
                >
                  <span className="index">{d.name.replace('Day ', 'D')}</span>
                  <span>
                    <span className="ms">{d.theme.replace('Tai-Lord ', '')}</span>
                    <span className="mf">{d.focus}</span>
                  </span>
                  <span className="check">{d.id === dayId ? Icon.check : null}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </main>
  );
}

function Sparkline({ entries }: { entries: HistoryEntry[] }) {
  const trim = entries.slice(-8);
  if (trim.length < 2) {
    return (
      <svg viewBox="0 0 280 90" preserveAspectRatio="none">
        <text className="glLabel" x="140" y="48" textAnchor="middle">
          {trim.length === 0 ? 'No data' : `${trim[0].maxWeight} lb logged`}
        </text>
      </svg>
    );
  }
  const w = 280, h = 90, pad = 8;
  const min = Math.min(...trim.map((e) => e.maxWeight));
  const max = Math.max(...trim.map((e) => e.maxWeight));
  const range = Math.max(1, max - min);
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  const pts = trim.map((e, i) => {
    const x = pad + (i / (trim.length - 1)) * innerW;
    const y = pad + innerH - ((e.maxWeight - min) / range) * innerH;
    return { x, y, w: e.maxWeight };
  });

  let d = '';
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    if (i === 0) {
      d += `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    } else {
      const prev = pts[i - 1];
      const cx = (prev.x + p.x) / 2;
      d += ` C ${cx.toFixed(1)} ${prev.y.toFixed(1)}, ${cx.toFixed(1)} ${p.y.toFixed(1)}, ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
    }
  }
  const lastX = pts[pts.length - 1].x;
  const firstX = pts[0].x;
  const area = `${d} L ${lastX.toFixed(1)} ${(pad + innerH).toFixed(1)} L ${firstX.toFixed(1)} ${(pad + innerH).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.32" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => {
        const isPeak = p.w === max;
        return (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={isPeak ? 3.4 : 2.4}
            fill={isPeak ? 'var(--accent-2)' : 'var(--accent)'}
          />
        );
      })}
    </svg>
  );
}
