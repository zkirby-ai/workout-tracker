'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatRest, workoutDays } from '../lib/workout-data';

type SetLog = {
  weight: string;
  reps: string;
  completed: boolean;
};

type HistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  dayName: string;
  maxWeight: number;
  timestamp: string;
};

type Screen = 'now' | 'plan' | 'progress';

function makeInitialState(dayId: string) {
  const day = workoutDays.find((item) => item.id === dayId) ?? workoutDays[0];
  return Object.fromEntries(
    day.exercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '', completed: false }))
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

export function WorkoutTracker() {
  const [screen, setScreen] = useState<Screen>('now');
  const [dayId, setDayId] = useState(workoutDays[0].id);
  const currentDay = useMemo(() => workoutDays.find((day) => day.id === dayId) ?? workoutDays[0], [dayId]);
  const [setState, setSetState] = useState<Record<string, SetLog[]>>(() => makeInitialState(dayId));
  const [timer, setTimer] = useState(0);
  const [activeLabel, setActiveLabel] = useState('Starts after set completion');
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setSetState(makeInitialState(dayId));
    setTimer(0);
    setActiveLabel('Starts after set completion');
  }, [dayId]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = window.setInterval(() => {
      setTimer((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timer]);

  const totalCompleted = currentDay.exercises.reduce((acc, exercise) => {
    return acc + (setState[exercise.id]?.filter((set) => set.completed).length ?? 0);
  }, 0);
  const totalSets = currentDay.exercises.reduce((acc, exercise) => acc + exercise.sets, 0);

  const exerciseIndex = currentDay.exercises.findIndex((exercise) => {
    const sets = setState[exercise.id] ?? [];
    return sets.some((set) => !set.completed);
  });

  const currentExercise = exerciseIndex >= 0 ? currentDay.exercises[exerciseIndex] : currentDay.exercises[currentDay.exercises.length - 1];
  const currentSets = setState[currentExercise.id] ?? [];
  const currentSetIndex = Math.max(0, currentSets.findIndex((set) => !set.completed));
  const activeSet = currentSets[currentSetIndex] ?? currentSets[currentSets.length - 1];
  const dayDone = totalCompleted === totalSets;

  const progressByExercise = useMemo(() => {
    const grouped = new Map<string, HistoryEntry[]>();
    for (const entry of history) {
      const existing = grouped.get(entry.exerciseId) ?? [];
      existing.push(entry);
      grouped.set(entry.exerciseId, existing.sort((a, b) => a.timestamp.localeCompare(b.timestamp)));
    }
    return grouped;
  }, [history]);

  const latestTopWeight = progressByExercise.get(currentExercise.id)?.slice(-1)[0]?.maxWeight ?? null;

  function persistHistory(nextHistory: HistoryEntry[]) {
    setHistory(nextHistory);
    window.localStorage.setItem('workout-history', JSON.stringify(nextHistory));
  }

  function updateField(exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) {
    setSetState((current) => ({
      ...current,
      [exerciseId]: current[exerciseId].map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set
      )
    }));
  }

  function recordExerciseMax(exerciseId: string) {
    const exercise = currentDay.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    const maxWeight = Math.max(
      0,
      ...(setState[exerciseId] ?? []).map((set) => Number.parseFloat(set.weight) || 0)
    );
    if (!maxWeight) return;

    const entry: HistoryEntry = {
      exerciseId,
      exerciseName: exercise.name,
      dayName: currentDay.name,
      maxWeight,
      timestamp: new Date().toISOString()
    };
    persistHistory([...history, entry]);
  }

  function completeSet(exerciseId: string, setIndex: number, restSeconds: number, exerciseName: string) {
    const nextState = {
      ...setState,
      [exerciseId]: setState[exerciseId].map((set, index) =>
        index === setIndex ? { ...set, completed: true } : set
      )
    };
    setSetState(nextState);
    setTimer(restSeconds);
    setActiveLabel(`${exerciseName} · Set ${setIndex + 1}`);

    const allDoneForExercise = nextState[exerciseId].every((set) => set.completed);
    if (allDoneForExercise) {
      const exercise = currentDay.exercises.find((item) => item.id === exerciseId);
      const maxWeight = Math.max(0, ...nextState[exerciseId].map((set) => Number.parseFloat(set.weight) || 0));
      if (exercise && maxWeight > 0) {
        const entry: HistoryEntry = {
          exerciseId,
          exerciseName: exercise.name,
          dayName: currentDay.name,
          maxWeight,
          timestamp: new Date().toISOString()
        };
        persistHistory([...history, entry]);
      }
    }
  }

  function nextExercise() {
    if (exerciseIndex >= 0 && exerciseIndex < currentDay.exercises.length - 1) {
      const next = currentDay.exercises[exerciseIndex + 1];
      setActiveLabel(`Up next · ${next.name}`);
    }
  }

  return (
    <main className="shell">
      <nav className="topTabs" aria-label="App screens">
        <button className={screen === 'now' ? 'topTab active' : 'topTab'} onClick={() => setScreen('now')}>Now</button>
        <button className={screen === 'plan' ? 'topTab active' : 'topTab'} onClick={() => setScreen('plan')}>Plan</button>
        <button className={screen === 'progress' ? 'topTab active' : 'topTab'} onClick={() => setScreen('progress')}>Progress</button>
      </nav>

      <section className="dayScroller" aria-label="Workout days">
        {workoutDays.map((day) => (
          <button
            key={day.id}
            className={day.id === dayId ? 'dayPill active' : 'dayPill'}
            onClick={() => setDayId(day.id)}
          >
            <span>{day.name}</span>
            <strong>{day.theme.replace('Tai-Lord ', '')}</strong>
          </button>
        ))}
      </section>

      {screen === 'now' && (
        <section className="nowScreen card">
          <div className="nowHeader">
            <div>
              <p className="eyebrow">current block</p>
              <h1>{currentDay.theme}</h1>
              <p className="lede">{currentDay.focus}</p>
            </div>
            <div className="miniProgress">
              <span>Progress</span>
              <strong>{totalCompleted}/{totalSets}</strong>
            </div>
          </div>

          <div className="timerCard bigTimer">
            <span>Rest Timer</span>
            <strong>{formatRest(timer)}</strong>
            <small>{activeLabel}</small>
            <div className="timerActions">
              <button onClick={() => setTimer((value) => value + 30)}>+30s</button>
              <button onClick={() => setTimer(0)}>Skip</button>
            </div>
          </div>

          {!dayDone ? (
            <>
              <article className="currentExerciseCard">
                <p className="eyebrow">do this now</p>
                <h2>{currentExercise.name}</h2>
                <div className="currentMeta">
                  <span>{currentExercise.severity}</span>
                  <span>{currentExercise.reps}</span>
                  <span>Rest {formatRest(currentExercise.restSeconds)}</span>
                  {latestTopWeight !== null && <span>Last top {latestTopWeight}</span>}
                </div>

                <div className="setFocusCard">
                  <div className="setFocusTop">
                    <div>
                      <span className="mutedLabel">Current set</span>
                      <strong>Set {currentSetIndex + 1} / {currentExercise.sets}</strong>
                    </div>
                    <button className="secondaryButton" onClick={nextExercise}>Next exercise</button>
                  </div>

                  <div className="focusInputs">
                    <input
                      value={activeSet?.weight ?? ''}
                      onChange={(event) => updateField(currentExercise.id, currentSetIndex, 'weight', event.target.value)}
                      placeholder="Max weight"
                    />
                    <input
                      value={activeSet?.reps ?? ''}
                      onChange={(event) => updateField(currentExercise.id, currentSetIndex, 'reps', event.target.value)}
                      placeholder="Reps"
                    />
                  </div>

                  <button
                    className="primaryAction"
                    onClick={() => completeSet(currentExercise.id, currentSetIndex, currentExercise.restSeconds, currentExercise.name)}
                    disabled={activeSet?.completed}
                  >
                    {activeSet?.completed ? 'Set completed' : 'Complete set'}
                  </button>
                </div>
              </article>
            </>
          ) : (
            <section className="doneCard">
              <p className="eyebrow">done</p>
              <h2>Workout complete</h2>
              <p className="lede">You finished {currentDay.theme}. Flip to Progress to see your top weights over time.</p>
            </section>
          )}
        </section>
      )}

      {screen === 'plan' && (
        <section className="exerciseList">
          {currentDay.exercises.map((exercise) => {
            const sets = setState[exercise.id] ?? [];
            const completed = sets.filter((set) => set.completed).length;

            return (
              <article className="card exerciseCard" key={exercise.id}>
                <div className="exerciseHeader">
                  <div>
                    <p className="eyebrow">{exercise.severity}</p>
                    <h2>{exercise.name}</h2>
                  </div>
                  <span className="restBadge">{formatRest(exercise.restSeconds)}</span>
                </div>

                <div className="metaRow">
                  <div><span>Sets</span><strong>{exercise.sets}</strong></div>
                  <div><span>Reps</span><strong>{exercise.reps}</strong></div>
                  <div><span>Done</span><strong>{completed}/{exercise.sets}</strong></div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {screen === 'progress' && (
        <section className="progressScreen">
          {[...progressByExercise.entries()].map(([exerciseId, entries]) => {
            const latest = entries[entries.length - 1];
            const maxEver = Math.max(...entries.map((entry) => entry.maxWeight));
            return (
              <article className="card progressCard" key={exerciseId}>
                <div className="exerciseHeader">
                  <div>
                    <p className="eyebrow">max weight over time</p>
                    <h2>{latest.exerciseName}</h2>
                  </div>
                  <span className="restBadge">PR {maxEver}</span>
                </div>
                <div className="progressHistory">
                  {entries.slice(-6).reverse().map((entry) => (
                    <div className="historyRow" key={`${entry.exerciseId}-${entry.timestamp}`}>
                      <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                      <strong>{entry.maxWeight}</strong>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}

          {progressByExercise.size === 0 && (
            <section className="doneCard">
              <p className="eyebrow">progress</p>
              <h2>No max weights yet</h2>
              <p className="lede">Finish an exercise with a logged weight and I’ll start building your history automatically.</p>
            </section>
          )}
        </section>
      )}
    </main>
  );
}
