const todaysWorkout = {
  name: 'Push Day',
  exercises: [
    { name: 'Bench Press', sets: 4, reps: '6-8', rest: '3:00', severity: 'Heavy' },
    { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rest: '2:00', severity: 'Moderate' },
    { name: 'Lateral Raise', sets: 4, reps: '12-15', rest: '1:00', severity: 'Light' },
    { name: 'Triceps Pushdown', sets: 3, reps: '10-12', rest: '1:00', severity: 'Light' }
  ]
};

export default function HomePage() {
  return (
    <main className="shell">
      <section className="hero card">
        <div>
          <p className="eyebrow">today</p>
          <h1>{todaysWorkout.name}</h1>
          <p className="lede">A fast, gym-friendly tracker for logging sets and auto-starting rest timers.</p>
        </div>
        <div className="timerCard">
          <span>Rest Timer</span>
          <strong>01:30</strong>
          <small>Starts after set completion</small>
        </div>
      </section>

      <section className="exerciseList">
        {todaysWorkout.exercises.map((exercise) => (
          <article className="card exerciseCard" key={exercise.name}>
            <div className="exerciseHeader">
              <div>
                <p className="eyebrow">{exercise.severity}</p>
                <h2>{exercise.name}</h2>
              </div>
              <span className="restBadge">Rest {exercise.rest}</span>
            </div>

            <div className="metaRow">
              <div><span>Sets</span><strong>{exercise.sets}</strong></div>
              <div><span>Reps</span><strong>{exercise.reps}</strong></div>
              <div><span>Done</span><strong>0/{exercise.sets}</strong></div>
            </div>

            <div className="setActions">
              <input placeholder="Weight" />
              <input placeholder="Reps" />
              <button>Complete Set</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
