import type { ExerciseCategory, Program } from '../types';

const exercise = (
  id: string,
  name: string,
  equipment: string,
  unit = 'kg',
  category: ExerciseCategory,
  swimDescription: string,
  guideCues: string[],
): Program['exercises'][number] => ({
  id,
  name,
  equipment,
  unit,
  category,
  swimDescription,
  guideCues,
  videoUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} ${equipment} proper form`)}`,
});

export const defaultPrograms: Program[] = [
  {
    id: 'program-a',
    name: 'Program A',
    description: 'Pull, legs, core',
    exercises: [
      exercise('assisted-chin-up', 'Assisted chin-up', 'assisted chin-up machine', 'kg', 'pull', 'Builds the vertical pulling strength used in freestyle and butterfly catches, especially when you need to hold water through the front of the pull.', [
        'Start from a long-arm hang',
        'Pull elbows down toward ribs',
        'Lower slowly under control',
      ]),
      exercise('chest-supported-row', 'Chest-supported row', 'seated row machine', 'kg', 'row', 'Strengthens mid-back retraction for freestyle and backstroke, helping you finish the pull without shrugging or overusing the neck.', [
        'Chest stays planted on pad',
        'Pull handles toward lower ribs',
        'Pause before returning forward',
      ]),
      exercise('straight-arm-pulldown', 'Straight-arm pulldown', 'cable machine', 'kg', 'pull', 'Closely matches the freestyle and butterfly catch-to-press motion, teaching the lats to press water back while the core stays still.', [
        'Soft elbows, arms mostly straight',
        'Sweep bar to thighs',
        'Keep ribs down and torso still',
      ]),
      exercise('rear-delt-fly', 'Rear delt fly', 'rear delt / fly machine', 'kg', 'shoulders', 'Supports shoulder balance for freestyle and backstroke recovery so the front of the shoulder is not doing all the work.', [
        'Lead with elbows, not hands',
        'Open wide to shoulder height',
        'Control the return',
      ]),
      exercise('leg-press', 'Leg press', 'leg press machine', 'kg', 'legs', 'Builds leg drive for starts, turns, and push-offs across every stroke, with the biggest transfer to wall speed and streamline distance.', [
        'Feet about shoulder width',
        'Lower until knees bend comfortably',
        'Drive through mid-foot, no knee lockout',
      ]),
      exercise('dumbbell-romanian-deadlift', 'Dumbbell Romanian deadlift', 'dumbbells', 'kg', 'legs', 'Strengthens hamstrings and glutes for dolphin kick and freestyle kick rhythm, while also protecting the lower back during starts and turns.', [
        'Push hips back first',
        'Dumbbells track close to legs',
        'Stand tall by squeezing glutes',
      ]),
      exercise('dumbbell-external-rotation', 'Dumbbell external rotation', 'dumbbell', 'kg', 'shoulders', 'Builds rotator cuff control for freestyle and butterfly recovery, helping keep the shoulder centred through repeated overhead strokes.', [
        'Elbow stays fixed by side',
        'Rotate forearm outward slowly',
        'Use light load and strict control',
      ]),
      exercise('weighted-dead-bug-hollow-hold', 'Weighted dead bug / hollow hold', 'dumbbell or bodyweight', 'seconds', 'core', 'Improves body-line control for streamline, freestyle rotation, and butterfly undulation without the hips or ribs leaking position.', [
        'Low back stays pressed down',
        'Reach long through arms and legs',
        'Stop before form breaks',
      ]),
      exercise('farmers-carry', "Farmer's carry", 'dumbbells or kettlebells', 'seconds', 'power', 'Builds grip, trunk stiffness, and shoulder packing that carry over to freestyle and backstroke pull stability late in a set.', [
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
      exercise('lat-pulldown', 'Lat pulldown', 'lat pulldown machine', 'kg', 'pull', 'Builds the main pulling muscles for freestyle and butterfly, especially the strong early catch and acceleration under the body.', [
        'Grip just outside shoulders',
        'Pull bar toward upper chest',
        'Keep shoulders down away from ears',
      ]),
      exercise('single-arm-dumbbell-row', 'Single-arm dumbbell row', 'dumbbell', 'kg', 'row', 'Trains one-side pulling strength and trunk control for freestyle rotation, helping each arm connect to the lat without twisting loose.', [
        'Brace with flat back',
        'Pull elbow toward hip',
        'Lower until shoulder blade reaches forward',
      ]),
      exercise('dumbbell-pullover', 'Dumbbell pullover', 'dumbbell', 'kg', 'pull', 'Works shoulder extension and lat length for freestyle and butterfly, useful for feeling a long catch without collapsing the ribs.', [
        'Ribs stay down on bench',
        'Move dumbbell in a smooth arc',
        'Stop when shoulders feel stretched',
      ]),
      exercise('face-pull', 'Face pull', 'cable machine with rope', 'kg', 'shoulders', 'Keeps the upper back and external rotators strong for freestyle, backstroke, and butterfly recovery positions.', [
        'Pull rope toward eye level',
        'Elbows high and wide',
        'Finish with hands beside ears',
      ]),
      exercise('triceps-pressdown', 'Triceps pressdown', 'cable machine', 'kg', 'arms', 'Strengthens the final push phase of freestyle and butterfly, helping finish each stroke past the hip instead of slipping early.', [
        'Elbows pinned by sides',
        'Press rope or bar to thighs',
        'Control back to bent elbows',
      ]),
      exercise('goblet-squat', 'Goblet squat', 'kettlebell or dumbbell', 'kg', 'legs', 'Builds leg strength and hip mobility for breaststroke kick, starts, and turns while keeping the torso upright and controlled.', [
        'Hold weight close to chest',
        'Sit between knees',
        'Stand tall through whole foot',
      ]),
      exercise('hamstring-curl', 'Hamstring curl', 'hamstring curl machine', 'kg', 'legs', 'Targets knee flexion for breaststroke recovery and supports hamstring durability for starts, turns, and dolphin kick.', [
        'Hips stay heavy on pad',
        'Curl heels toward glutes',
        'Lower slowly to full control',
      ]),
      exercise('kettlebell-swing', 'Kettlebell swing', 'kettlebell', 'kg', 'power', 'Develops hip snap for starts, turns, and butterfly dolphin kick power, with the strongest transfer to explosive wall push-offs.', [
        'Hinge, do not squat',
        'Snap hips forward',
        'Let arms guide, not lift',
      ]),
      exercise('medicine-ball-slam', 'Medicine ball slam', 'medicine ball', 'kg', 'power', 'Builds whole-body power for butterfly and freestyle sprinting, linking the overhead position to a fast core-driven pull down.', [
        'Reach tall overhead',
        'Brace and slam through the floor',
        'Reset before the next rep',
      ]),
      exercise('low-twist-high-twist', 'Low twist or high twist', 'cable machine', 'kg', 'core', 'Trains rotation for freestyle and backstroke so the hips, ribs, and pull connect instead of the arm working alone.', [
        'Stand tall with cable to one side',
        'Rotate through trunk and hips',
        'Control back to start position',
      ]),
    ],
  },
  {
    id: 'flexibility',
    name: 'Flexibility',
    description: '10-15 minute land mobility routine',
    trainingNote:
      "Aim for 10-15 minutes total. Best after a shower, after a walk, or in the evening. For a stiff morning back, keep it gentle and don't force the toe-touch first thing.",
    exercises: [
      exercise('cat-camel', 'Cat-camel', 'mat or floor', 'reps', 'mobility', 'Gently moves the spine through flexion and extension, useful for loosening the back before land training and improving body awareness for all strokes.', [
        'Move slowly from tailbone to neck',
        'Use smooth breathing',
        'Stop before any pinching',
      ]),
      exercise('childs-pose', "Child's pose", 'mat or floor', 'seconds', 'mobility', 'Opens the lats, shoulders, and lower back after swim training, helping freestyle and butterfly overhead reach feel less restricted.', [
        'Reach hands forward',
        'Let hips settle back',
        'Breathe into the back ribs',
      ]),
      exercise('lower-back-rotations', 'Knees side-to-side / lower back rotations', 'mat or floor', 'reps each side', 'mobility', 'Restores gentle trunk rotation for freestyle and backstroke while reducing lower-back stiffness from kicking, sitting, or gym work.', [
        'Keep shoulders relaxed on the floor',
        'Let knees move side to side',
        'Keep the range easy and controlled',
      ]),
      exercise('knee-to-chest-stretch', 'Knee-to-chest stretch', 'mat or floor', 'seconds each side', 'mobility', 'Relieves lower-back and glute tightness so streamline, turns, and body position feel easier across all strokes.', [
        'Pull one knee toward chest',
        'Keep the other leg relaxed',
        'Breathe and avoid yanking',
      ]),
      exercise('hip-flexor-stretch', 'Hip flexor stretch', 'mat or floor', 'seconds each side', 'mobility', 'Opens the front of the hips for better streamline, flutter kick, dolphin kick, and breaststroke body position.', [
        'Tuck pelvis slightly under',
        'Keep ribs stacked over hips',
        'Shift forward gently',
      ]),
      exercise('figure-four-stretch', 'Glute / figure-four stretch', 'mat, floor, or chair', 'seconds each side', 'mobility', 'Improves hip rotation and glute comfort for starts, turns, and breaststroke kick setup without forcing the lower back.', [
        'Cross ankle over opposite knee',
        'Keep the stretch in the glute',
        'Relax the shoulders and jaw',
      ]),
      exercise('chair-hamstring-stretch', 'Hamstring stretch on chair', 'chair', 'seconds each side', 'mobility', 'Improves posterior-chain flexibility for starts, turns, and a cleaner streamline line without aggressively forcing a toe touch.', [
        'Place heel on chair',
        'Keep knee softly straight',
        'Hinge forward with a long back',
      ]),
      exercise('wall-calf-stretch', 'Calf stretch against wall', 'wall', 'seconds each side', 'mobility', 'Targets straight-knee and bent-knee calf mobility for stronger push-offs, better ankle position, and more relaxed flutter and dolphin kick.', [
        'Do straight knee each side',
        'Then repeat with bent knee',
        'Keep heel heavy toward the floor',
      ]),
      exercise('bent-knee-forward-fold', 'Standing forward fold with bent knees', 'bodyweight', 'seconds', 'mobility', 'Lets the back and hamstrings relax gently, supporting starts, turns, and everyday recovery without forcing morning stiffness.', [
        'Bend knees and let back relax',
        'Slowly straighten legs a little',
        "Don't force the range",
      ]),
      exercise('open-book-thoracic-rotations', 'Open-book thoracic rotations', 'mat or floor', 'reps each side', 'mobility', 'Improves upper-back rotation for freestyle and backstroke, helping the shoulder move from a better rib-cage position.', [
        'Stack knees and hips',
        'Open the top arm slowly',
        'Follow the hand with your eyes',
      ]),
    ],
  },
];
