'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatRest, workoutDays } from '../lib/workout-data';

type SetLog = {
  weight: string;
  reps: string;
  completed: boolean;
};

function makeInitialState(dayId: string) {
  const day = workoutDays.find((item) => item.id === dayId) ?? workoutDays[0];
  return Object.fromEntries(
    day.exercises.map((exercise) => [
      exercise.id,
      Array.from({ length: exercise.sets }, () => ({ weight: '', reps: '', completed: false }))
    ])
  ) as Record<string, SetLog[]>;
}

export function WorkoutTracker() {
  const [dayId, setDayId] = useState(workoutDays[0].id);
  const currentDay = useMemo(() => workoutDays.find((day) => day.id === dayId) ?? workoutDays[0], [dayId]);
  const [setState, setSetState] = useState<Record<string, SetLog[]>>(() => makeInitialState(dayId));
  const [timer, setTimer] = useState(0);
  const [activeLabel, setActiveLabel] = useState('Starts after set completion');

  useEffect(() => {
    setSetState(makeInitialState(dayId));
    setTimer(0);
    setActiveLabel('Starts after set completion');
  }, [dayId]);

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

  function updateField(exerciseId: string, setIndex: number, field: 'weight' | 'reps', value: string) {
    setSetState((current) => ({
      ...current,
      [exerciseId]: current[exerciseId].map((set, index) =>
        index === setIndex ? { ...set, [field]: value } : set
      )
    }));
  }

  function completeSet(exerciseId: string, setIndex: number, restSeconds: number, exerciseName: string) {
    setSetState((current) => ({
      ...current,
      [exerciseId]: current[exerciseId].map((set, index) =>
        index === setIndex ? { ...set, completed: true } : set
      )
    }));
    setTimer(restSeconds);
    setActiveLabel(`${exerciseName} · Set ${setIndex + 1}`);
  }

  return (
    <main className="shell">
      <section className="hero card">
        <div className="heroCopy">
          <p className="eyebrow">tai-lord block</p>
          <h1>{currentDay.theme}</h1>
          <p className="lede">{currentDay.focus}</p>
        </div>
        <div className="timerCard">
          <span>Rest Timer</span>
          <strong>{formatRest(timer)}</strong>
          <small>{activeLabel}</small>
          <div className="timerActions">
            <button onClick={() => setTimer((value) => value + 30)}>+30s</button>
            <button onClick={() => setTimer(0)}>Skip</button>
          </div>
        </div>
      </section>

      <section className="card splitBar">
        <div className="programLabel">
          <p className="eyebrow">program</p>
          <strong>5-day Tai-Lord split</strong>
        </div>
        <div className="progressStat">
          <span>Progress</span>
          <strong>{totalCompleted}/{totalSets}</strong>
        </div>
      </section>

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

              <div className="setTable">
                {sets.map((set, index) => (
                  <div className={set.completed ? 'setRow done' : 'setRow'} key={`${exercise.id}-${index}`}>
                    <div className="setTopline">
                      <div className="setNumber">Set {index + 1}</div>
                      <button
                        className="completeButton"
                        disabled={set.completed}
                        onClick={() => completeSet(exercise.id, index, exercise.restSeconds, exercise.name)}
                      >
                        {set.completed ? 'Done' : 'Complete'}
                      </button>
                    </div>
                    <input
                      value={set.weight}
                      onChange={(event) => updateField(exercise.id, index, 'weight', event.target.value)}
                      placeholder="Weight"
                    />
                    <input
                      value={set.reps}
                      onChange={(event) => updateField(exercise.id, index, 'reps', event.target.value)}
                      placeholder="Reps"
                    />
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
