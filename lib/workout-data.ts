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
    focus: 'Chest · Front Delts · Triceps · ~45 min cap',
    exercises: [
      { id: 'flat-bench', name: 'Flat Barbell Bench', sets: 3, reps: '5-8', restSeconds: 105, severity: 'Heavy' },
      { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
      { id: 'lateral-raise', name: 'Lateral Raise', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
      { id: 'rope-pushdown', name: 'Rope Pushdown', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
    ]
  },
  {
    id: 'day-2',
    name: 'Day 2',
    theme: 'Tai-Lord Pull Strength',
    focus: 'Lats · Upper Back · Biceps · ~45 min cap',
    exercises: [
      { id: 'weighted-pullup', name: 'Weighted Pull-Up', sets: 3, reps: '5-8', restSeconds: 105, severity: 'Heavy' },
      { id: 'chest-row', name: 'Chest Supported Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
      { id: 'lat-pulldown', name: 'Neutral Grip Lat Pulldown', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' },
      { id: 'ez-curl', name: 'EZ Bar Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
    ]
  },
  {
    id: 'day-3',
    name: 'Day 3',
    theme: 'Tai-Lord Push Volume',
    focus: 'Delts · Upper Chest · Triceps · ~45 min cap',
    exercises: [
      { id: 'smith-incline', name: 'Smith Incline Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
      { id: 'shoulder-press', name: 'Seated DB Shoulder Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
      { id: 'cable-fly', name: 'Cable Fly', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
      { id: 'overhead-ext', name: 'Overhead Cable Extension', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
    ]
  },
  {
    id: 'day-4',
    name: 'Day 4',
    theme: 'Tai-Lord Pull Pump',
    focus: 'Mid Back · Lats · Arms · ~45 min cap',
    exercises: [
      { id: 'tbar', name: 'T-Bar Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
      { id: 'single-arm-row', name: 'Single Arm Cable Row', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' },
      { id: 'pullover', name: 'Straight Arm Pulldown', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
      { id: 'hammer-curl', name: 'Hammer Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
    ]
  }
];

export function formatRest(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
