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
  split: 'Push' | 'Pull';
  exercises: Exercise[];
};

export const workoutDays: WorkoutDay[] = [
  {
    id: 'push-a',
    name: 'Push A',
    split: 'Push',
    exercises: [
      { id: 'bench', name: 'Bench Press', sets: 4, reps: '6-8', restSeconds: 180, severity: 'Heavy' },
      { id: 'incline-db', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'lateral', name: 'Lateral Raise', sets: 4, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'pushdown', name: 'Triceps Pushdown', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' }
    ]
  },
  {
    id: 'pull-a',
    name: 'Pull A',
    split: 'Pull',
    exercises: [
      { id: 'pullup', name: 'Weighted Pull-Up', sets: 4, reps: '5-8', restSeconds: 180, severity: 'Heavy' },
      { id: 'row', name: 'Chest Supported Row', sets: 3, reps: '8-10', restSeconds: 120, severity: 'Moderate' },
      { id: 'rear-delt', name: 'Rear Delt Fly', sets: 3, reps: '12-15', restSeconds: 60, severity: 'Light' },
      { id: 'curl', name: 'EZ Bar Curl', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Light' }
    ]
  }
];

export function formatRest(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
