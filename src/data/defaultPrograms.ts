import type { ExerciseCategory, Program } from '../types';

const exercise = (
  id: string,
  name: string,
  equipment: string,
  unit = 'kg',
  category: ExerciseCategory,
  guideCues: string[],
): Program['exercises'][number] => ({
  id,
  name,
  equipment,
  unit,
  category,
  guideCues,
  videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${equipment} proper form`)}`,
});

export const defaultPrograms: Program[] = [
  {
    id: 'program-a',
    name: 'Program A',
    description: 'Pull, legs, core',
    exercises: [
      exercise('assisted-chin-up', 'Assisted chin-up', 'assisted chin-up machine', 'kg', 'pull', [
        'Start from a long-arm hang',
        'Pull elbows down toward ribs',
        'Lower slowly under control',
      ]),
      exercise('chest-supported-row', 'Chest-supported row', 'seated row machine', 'kg', 'row', [
        'Chest stays planted on pad',
        'Pull handles toward lower ribs',
        'Pause before returning forward',
      ]),
      exercise('straight-arm-pulldown', 'Straight-arm pulldown', 'cable machine', 'kg', 'pull', [
        'Soft elbows, arms mostly straight',
        'Sweep bar to thighs',
        'Keep ribs down and torso still',
      ]),
      exercise('rear-delt-fly', 'Rear delt fly', 'rear delt / fly machine', 'kg', 'shoulders', [
        'Lead with elbows, not hands',
        'Open wide to shoulder height',
        'Control the return',
      ]),
      exercise('leg-press', 'Leg press', 'leg press machine', 'kg', 'legs', [
        'Feet about shoulder width',
        'Lower until knees bend comfortably',
        'Drive through mid-foot, no knee lockout',
      ]),
      exercise('dumbbell-romanian-deadlift', 'Dumbbell Romanian deadlift', 'dumbbells', 'kg', 'legs', [
        'Push hips back first',
        'Dumbbells track close to legs',
        'Stand tall by squeezing glutes',
      ]),
      exercise('dumbbell-external-rotation', 'Dumbbell external rotation', 'dumbbell', 'kg', 'shoulders', [
        'Elbow stays fixed by side',
        'Rotate forearm outward slowly',
        'Use light load and strict control',
      ]),
      exercise('weighted-dead-bug-hollow-hold', 'Weighted dead bug / hollow hold', 'dumbbell or bodyweight', 'seconds', 'core', [
        'Low back stays pressed down',
        'Reach long through arms and legs',
        'Stop before form breaks',
      ]),
      exercise('farmers-carry', "Farmer's carry", 'dumbbells or kettlebells', 'seconds', 'power', [
        'Stand tall with shoulders packed',
        'Walk slowly without leaning',
        'Keep grip tight and ribs down',
      ]),
    ],
  },
  {
    id: 'program-b',
    name: 'Program B',
    description: 'Swim power, back, hips, shoulders',
    exercises: [
      exercise('lat-pulldown', 'Lat pulldown', 'lat pulldown machine', 'kg', 'pull', [
        'Grip just outside shoulders',
        'Pull bar toward upper chest',
        'Keep shoulders down away from ears',
      ]),
      exercise('single-arm-dumbbell-row', 'Single-arm dumbbell row', 'dumbbell', 'kg', 'row', [
        'Brace with flat back',
        'Pull elbow toward hip',
        'Lower until shoulder blade reaches forward',
      ]),
      exercise('dumbbell-pullover', 'Dumbbell pullover', 'dumbbell', 'kg', 'pull', [
        'Ribs stay down on bench',
        'Move dumbbell in a smooth arc',
        'Stop when shoulders feel stretched',
      ]),
      exercise('face-pull', 'Face pull', 'cable machine with rope', 'kg', 'shoulders', [
        'Pull rope toward eye level',
        'Elbows high and wide',
        'Finish with hands beside ears',
      ]),
      exercise('triceps-pressdown', 'Triceps pressdown', 'cable machine', 'kg', 'arms', [
        'Elbows pinned by sides',
        'Press rope or bar to thighs',
        'Control back to bent elbows',
      ]),
      exercise('goblet-squat', 'Goblet squat', 'kettlebell or dumbbell', 'kg', 'legs', [
        'Hold weight close to chest',
        'Sit between knees',
        'Stand tall through whole foot',
      ]),
      exercise('hamstring-curl', 'Hamstring curl', 'hamstring curl machine', 'kg', 'legs', [
        'Hips stay heavy on pad',
        'Curl heels toward glutes',
        'Lower slowly to full control',
      ]),
      exercise('kettlebell-swing', 'Kettlebell swing', 'kettlebell', 'kg', 'power', [
        'Hinge, do not squat',
        'Snap hips forward',
        'Let arms guide, not lift',
      ]),
      exercise('medicine-ball-slam', 'Medicine ball slam', 'medicine ball', 'kg', 'power', [
        'Reach tall overhead',
        'Brace and slam through the floor',
        'Reset before the next rep',
      ]),
      exercise('low-twist-high-twist', 'Low twist or high twist', 'cable machine', 'kg', 'core', [
        'Stand tall with cable to one side',
        'Rotate through trunk and hips',
        'Control back to start position',
      ]),
    ],
  },
];
