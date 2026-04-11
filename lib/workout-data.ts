export type Exercise = {
  id: string;
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  severity: 'Light' | 'Moderate' | 'Heavy';
};

export type WorkoutDay = {
  id: string;
  name: string;
  theme: string;
  focus: string;
  exercises: Exercise[];
};

export const workoutDays: WorkoutDay[] = [
  {
    id: 'day-1',
    name: 'Day 1',
    theme: 'Tai-Lord Push Power',
    focus: 'Chest · Front Delts · Triceps',
    exercises: [
      { id: 'flat-bench', name: 'Flat Barbell Bench', sets: 4, reps: '5-8', restSeconds: 180, severity: 'Heavy' },
      { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'machine-press', name: 'Machine Chest Press', sets: 3, reps: '10-12', restSeconds: 90, severity: 'Moderate' },
      { id: 'lateral-raise', name: 'Lateral Raise', sets: 4, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'rope-pushdown', name: 'Rope Pushdown', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' }
    ]
  },
  {
    id: 'day-2',
    name: 'Day 2',
    theme: 'Tai-Lord Pull Strength',
    focus: 'Lats · Upper Back · Biceps',
    exercises: [
      { id: 'weighted-pullup', name: 'Weighted Pull-Up', sets: 4, reps: '5-8', restSeconds: 180, severity: 'Heavy' },
      { id: 'chest-row', name: 'Chest Supported Row', sets: 3, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'lat-pulldown', name: 'Neutral Grip Lat Pulldown', sets: 3, reps: '10-12', restSeconds: 90, severity: 'Moderate' },
      { id: 'rear-delt-fly', name: 'Rear Delt Fly', sets: 3, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'ez-curl', name: 'EZ Bar Curl', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' }
    ]
  },
  {
    id: 'day-3',
    name: 'Day 3',
    theme: 'Tai-Lord Legs',
    focus: 'Quads · Hamstrings · Glutes · Calves',
    exercises: [
      { id: 'hack-squat', name: 'Hack Squat', sets: 4, reps: '6-10', restSeconds: 180, severity: 'Heavy' },
      { id: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '6-8', restSeconds: 180, severity: 'Heavy' },
      { id: 'leg-press', name: 'Leg Press', sets: 3, reps: '10-12', restSeconds: 120, severity: 'Moderate' },
      { id: 'leg-curl', name: 'Seated Leg Curl', sets: 3, reps: '10-12', restSeconds: 75, severity: 'Moderate' },
      { id: 'calf-raise', name: 'Standing Calf Raise', sets: 4, reps: '12-15', restSeconds: 60, severity: 'Light' }
    ]
  },
  {
    id: 'day-4',
    name: 'Day 4',
    theme: 'Tai-Lord Push Volume',
    focus: 'Delts · Upper Chest · Triceps',
    exercises: [
      { id: 'smith-incline', name: 'Smith Incline Press', sets: 4, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'shoulder-press', name: 'Seated DB Shoulder Press', sets: 3, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'cable-fly', name: 'Cable Fly', sets: 3, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'lateral-partials', name: 'Lateral Raise Partials', sets: 3, reps: '15-20', restSeconds: 60, severity: 'Light' },
      { id: 'overhead-ext', name: 'Overhead Cable Extension', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' }
    ]
  },
  {
    id: 'day-5',
    name: 'Day 5',
    theme: 'Tai-Lord Pull Pump',
    focus: 'Mid Back · Lats · Arms',
    exercises: [
      { id: 'tbar', name: 'T-Bar Row', sets: 4, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'single-arm-row', name: 'Single Arm Cable Row', sets: 3, reps: '10-12', restSeconds: 90, severity: 'Moderate' },
      { id: 'pullover', name: 'Straight Arm Pulldown', sets: 3, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'hammer-curl', name: 'Hammer Curl', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' },
      { id: 'preacher-curl', name: 'Preacher Curl', sets: 3, reps: '12-15', restSeconds: 60, severity: 'Light' }
    ]
  }
];

export function formatRest(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
