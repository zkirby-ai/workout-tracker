export type ExerciseGuide = {
  setup: string[];
  cues: string[];
  mistakes?: string[];
  feel?: string;
};

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

export const exerciseSubstitutions: Record<string, Exercise[]> = {
  'flat-bench': [
    { id: 'flat-db-bench', name: 'Flat Dumbbell Bench', sets: 3, reps: '6-10', restSeconds: 90, severity: 'Heavy' },
    { id: 'smith-flat-bench', name: 'Smith Flat Bench', sets: 3, reps: '6-10', restSeconds: 90, severity: 'Heavy' },
    { id: 'machine-chest-press', name: 'Machine Chest Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'incline-db': [
    { id: 'smith-incline-alt', name: 'Smith Incline Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'incline-machine', name: 'Incline Machine Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'low-incline-barbell', name: 'Low Incline Barbell Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'lateral-raise': [
    { id: 'cable-lateral-raise', name: 'Cable Lateral Raise', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
    { id: 'machine-lateral-raise', name: 'Machine Lateral Raise', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' }
  ],
  'rope-pushdown': [
    { id: 'straight-bar-pushdown', name: 'Straight Bar Pushdown', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'single-arm-pushdown', name: 'Single Arm Cable Pushdown', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'dip-machine', name: 'Dip Machine', sets: 3, reps: '8-12', restSeconds: 60, severity: 'Moderate' }
  ],
  'weighted-pullup': [
    { id: 'assisted-pullup', name: 'Assisted Pull-Up', sets: 3, reps: '6-10', restSeconds: 90, severity: 'Heavy' },
    { id: 'heavy-lat-pulldown', name: 'Heavy Lat Pulldown', sets: 3, reps: '6-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'close-grip-pulldown', name: 'Close Grip Pulldown', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'chest-row': [
    { id: 'machine-row', name: 'Machine Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'cable-row', name: 'Seated Cable Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'db-row', name: 'One-Arm DB Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'lat-pulldown': [
    { id: 'wide-pulldown', name: 'Wide Grip Pulldown', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' },
    { id: 'single-arm-pulldown', name: 'Single Arm Lat Pulldown', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' }
  ],
  'ez-curl': [
    { id: 'db-curl', name: 'DB Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'cable-curl', name: 'Cable Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'preacher-curl', name: 'Preacher Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
  ],
  'smith-incline': [
    { id: 'incline-db-alt', name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'incline-machine-alt', name: 'Incline Machine Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'shoulder-press': [
    { id: 'machine-shoulder-press', name: 'Machine Shoulder Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'smith-shoulder-press', name: 'Smith Shoulder Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'arnold-press', name: 'Arnold Press', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'cable-fly': [
    { id: 'pec-deck', name: 'Pec Deck', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
    { id: 'db-fly', name: 'DB Fly', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' }
  ],
  'overhead-ext': [
    { id: 'skullcrusher', name: 'EZ Bar Skullcrusher', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'single-arm-overhead-ext', name: 'Single Arm Overhead Cable Extension', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
  ],
  tbar: [
    { id: 'barbell-row', name: 'Barbell Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'machine-tbar', name: 'Machine T-Bar Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' },
    { id: 'chest-supported-tbar', name: 'Chest Supported T-Bar Row', sets: 3, reps: '8-10', restSeconds: 75, severity: 'Moderate' }
  ],
  'single-arm-row': [
    { id: 'single-arm-db-row-alt', name: 'Single Arm DB Row', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' },
    { id: 'machine-single-arm-row', name: 'Single Arm Machine Row', sets: 3, reps: '10-12', restSeconds: 60, severity: 'Moderate' }
  ],
  pullover: [
    { id: 'machine-pullover', name: 'Machine Pullover', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' },
    { id: 'rope-pulldown', name: 'Rope Straight Arm Pulldown', sets: 3, reps: '12-15', restSeconds: 45, severity: 'Light' }
  ],
  'hammer-curl': [
    { id: 'rope-hammer-curl', name: 'Rope Hammer Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' },
    { id: 'cross-body-hammer-curl', name: 'Cross Body Hammer Curl', sets: 3, reps: '10-12', restSeconds: 45, severity: 'Light' }
  ]
};

export const exerciseGuides: Record<string, ExerciseGuide> = {
  'flat-bench': {
    setup: ['Feet planted hard.', 'Upper back tight on bench.', 'Wrists stacked over forearms.'],
    cues: ['Lower to lower chest.', 'Press up and slightly back.', 'Keep shoulder blades pinned.'],
    mistakes: ['Elbows flared too hard.', 'Butt coming off bench.', 'Bouncing the bar.'],
    feel: 'Chest, front delts, triceps.'
  },
  'incline-db': {
    setup: ['Low incline bench.', 'Feet planted.', 'DBs start over upper chest.'],
    cues: ['Lower with control.', 'Keep elbows slightly tucked.', 'Press up without smashing DBs together.'],
    mistakes: ['Bench too upright.', 'Shrugging shoulders forward.'],
    feel: 'Upper chest, front delts, triceps.'
  },
  'lateral-raise': {
    setup: ['Soft elbows.', 'Slight torso lean.', 'DBs start by sides.'],
    cues: ['Lead with elbows.', 'Raise to shoulder height.', 'Control the lowering.'],
    mistakes: ['Swinging from hips.', 'Turning it into a shrug.'],
    feel: 'Side delts.'
  },
  'rope-pushdown': {
    setup: ['Elbows pinned by sides.', 'Chest tall.', 'Small forward lean okay.'],
    cues: ['Drive rope down.', 'Spread rope at bottom.', 'Keep upper arm still.'],
    mistakes: ['Elbows drifting forward.', 'Using bodyweight to slam reps.'],
    feel: 'Triceps.'
  },
  'weighted-pullup': {
    setup: ['Start from dead hang.', 'Brace abs and glutes.', 'Hands just outside shoulder width.'],
    cues: ['Pull elbows to ribs.', 'Chest up toward bar.', 'Lower under control.'],
    mistakes: ['Half reps.', 'Kipping.', 'Neck craning for the bar.'],
    feel: 'Lats, upper back, biceps.'
  },
  'chest-row': {
    setup: ['Chest glued to pad.', 'Neutral spine.', 'Arms fully extended at bottom.'],
    cues: ['Pull elbows back.', 'Pause the squeeze.', 'Lower without losing chest contact.'],
    mistakes: ['Shrugging.', 'Neck jutting forward.', 'Short ROM.'],
    feel: 'Mid back, lats, rear delts.'
  },
  'lat-pulldown': {
    setup: ['Lock knees in.', 'Slight lean back.', 'Chest up.'],
    cues: ['Pull bar to upper chest.', 'Drive elbows down.', 'Let lats stretch at top.'],
    mistakes: ['Turning it into a row.', 'Yanking with momentum.'],
    feel: 'Lats and upper back.'
  },
  'ez-curl': {
    setup: ['Elbows tucked.', 'Chest tall.', 'Grip where wrists feel natural.'],
    cues: ['Curl without swinging.', 'Squeeze at top.', 'Lower slow.'],
    mistakes: ['Leaning back.', 'Elbows drifting forward every rep.'],
    feel: 'Biceps.'
  },
  'smith-incline': {
    setup: ['Bench low incline.', 'Eyes under bar path.', 'Upper back tight.'],
    cues: ['Lower to upper chest.', 'Press smoothly.', 'Keep shoulders down and back.'],
    mistakes: ['Bench too steep.', 'Bouncing off chest.'],
    feel: 'Upper chest, front delts, triceps.'
  },
  'shoulder-press': {
    setup: ['Seat upright but not vertical.', 'Feet planted.', 'DBs at ear level.'],
    cues: ['Press up and slightly in.', 'Keep ribs down.', 'Lower to a stable bottom.'],
    mistakes: ['Overarching low back.', 'Starting too low and losing tension.'],
    feel: 'Front/side delts, triceps.'
  },
  'cable-fly': {
    setup: ['Split stance.', 'Slight bend in elbows.', 'Chest up.'],
    cues: ['Bring hands together in an arc.', 'Squeeze chest in front.', 'Return with control.'],
    mistakes: ['Turning it into a press.', 'Shoulders rolling forward hard.'],
    feel: 'Chest.'
  },
  'overhead-ext': {
    setup: ['Elbows high and close.', 'Brace abs.', 'Stagger stance if needed.'],
    cues: ['Stretch behind head.', 'Extend without flaring elbows.', 'Control return.'],
    mistakes: ['Elbows splaying wide.', 'Using torso swing.'],
    feel: 'Long head of triceps.'
  },
  tbar: {
    setup: ['Hips back.', 'Soft knees.', 'Neutral spine.'],
    cues: ['Lock torso angle.', 'Pull elbows back toward lower chest/upper stomach.', 'Pause then lower slow.'],
    mistakes: ['Standing up every rep.', 'Jerking with hips.', 'Shrugging hard at top.'],
    feel: 'Mid back, lats, rear delts.'
  },
  'single-arm-row': {
    setup: ['Square hips/torso.', 'Chest tall.', 'Reach fully at start.'],
    cues: ['Drive elbow back.', 'Pause the squeeze.', 'Control the stretch.'],
    mistakes: ['Twisting body to finish reps.', 'Yanking with biceps.'],
    feel: 'Lats and mid back.'
  },
  pullover: {
    setup: ['Soft elbows.', 'Chest slightly lifted.', 'Hinge just enough for line of pull.'],
    cues: ['Sweep bar down with straight-ish arms.', 'Think armpits to hips.', 'Control the stretch up top.'],
    mistakes: ['Bending elbows into a pressdown.', 'Using torso swing.'],
    feel: 'Lats.'
  },
  'hammer-curl': {
    setup: ['Neutral grip.', 'Elbows tucked.', 'Chest tall.'],
    cues: ['Curl without swinging.', 'Keep palms facing in.', 'Lower slow.'],
    mistakes: ['Leaning back.', 'Turning it into a cheat curl.'],
    feel: 'Brachialis, biceps, forearms.'
  },
  'barbell-row': {
    setup: ['Hip hinge first.', 'Brace hard.', 'Bar hangs under shoulders.'],
    cues: ['Keep torso mostly fixed.', 'Row to lower ribs/upper stomach.', 'Control the negative.'],
    mistakes: ['Standing up each rep.', 'Too much body English.', 'Rounding low back.'],
    feel: 'Mid back, lats, posterior chain support.'
  }
};

export function formatRest(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}
