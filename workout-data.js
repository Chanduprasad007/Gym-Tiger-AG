// Gym Tiger 6-Day Hypertrophy & Strength Program Data

const focusTags = [
  { label: "Tiger Width (Lats)", tone: "cyan" },
  { label: "Shoulder Caps", tone: "violet" },
  { label: "Heavy Push Strength", tone: "orange" },
  { label: "Core & Hinge Power", tone: "lime" }
];

const coachingRules = [
  {
    title: "V-Taper Overload",
    copy: "Focus on strict lat pull-downs, pullovers, and lateral raises. Build impressive shoulder cap width and wide-lats posture."
  },
  {
    title: "Hinge and Hips",
    copy: "Clean deadlifts, RDLs, and good mornings. Drive with the glutes and hamstrings. Keep the spine neutral and brace."
  },
  {
    title: "Abs Hypertrophy",
    copy: "Train abdominal muscles four times a week: progressive overload via weighted planks, cable crunches, and wheel rollouts."
  },
  {
    title: "The Overload Law",
    copy: "When you hit the top of the rep range for all sets of a movement with strict form, add 2.5 kg for upper body or 5 kg for lower body next time."
  }
];

const program = [
  {
    day: "Day A",
    letter: "A",
    title: "Chest + Triceps + Abs",
    accent: "orange",
    intent: "Heavy pressing power, upper-chest focus, and progressive core flexion.",
    exercises: [
      ex("Barbell Bench Press", "4", "5-8", "180s", "KEY", "Retract scapulae, pack shoulders, lower bar to sternum, drive feet hard.", [
        "Dumbbell Bench Press",
        "Smith Machine Bench Press",
        "Machine Chest Press"
      ]),
      ex("Incline Dumbbell Press", "3", "8-10", "90s", "KEY", "Set bench to 30 degrees, keep elbows slightly tucked, full range of motion.", [
        "Incline Smith Press",
        "Incline Machine Press",
        "Low-Incline Barbell Press"
      ]),
      ex("Cable Chest Fly", "3", "12-15", "60s", "CHEST", "Soft bend in elbows, stretch deep, hug a wide barrel, squeeze at center.", [
        "Pec Deck Fly",
        "Incline Cable Fly",
        "Dumbbell Fly"
      ]),
      ex("Weighted Dips", "3", "8-12", "90s", "KEY", "Lean torso forward to isolate lower chest. Keep shoulders stable.", [
        "Assisted Dip Machine",
        "Decline Dumbbell Press",
        "Close-Grip Push-Up"
      ]),
      ex("Overhead Cable Triceps Extension", "3", "10-12", "60s", "TRI", "Face away from cable tower, stretch elbows fully overhead, control the path.", [
        "EZ-Bar Skull Crusher",
        "Dumbbell Overhead Extension",
        "Rope Pushdown"
      ]),
      ex("Rope Triceps Pushdown", "3", "12-15", "60s", "TRI", "Separate rope at lockout, flare elbows out slightly, 1-second pause.", [
        "Straight-Bar Pushdown",
        "Cable Kickback",
        "Machine Dip"
      ]),
      ex("Hanging Leg Raise", "3", "10-15", "45s", "ABS", "Tilt pelvis backward at peak, avoid momentum, control eccentric drop.", [
        "Captain's Chair Knee Raise",
        "Bench Reverse Crunch",
        "Lying Leg Raise"
      ]),
      ex("Cable Crunch", "3", "12-15", "45s", "ABS", "Kneel down, round the thoracic spine, pull elbows toward knees using abs.", [
        "Machine Crunch",
        "Decline Weighted Sit-Up",
        "Stability Ball Crunch"
      ])
    ]
  },
  {
    day: "Day B",
    letter: "B",
    title: "Back + Biceps (V-Taper)",
    accent: "cyan",
    intent: "Lat width priority, horizontal rows, erector spine builder.",
    exercises: [
      ex("Deadlift", "3", "3-5", "180s", "KEY", "Tighten lats, pack shoulders, hinge deep, pull the slack, drive floors away.", [
        "Trap Bar Deadlift",
        "Rack Pull",
        "Romanian Deadlift"
      ]),
      ex("Wide-Grip Lat Pulldown", "4", "8-12", "90s", "WIDTH", "Pull bar toward collarbones, elbows down and back, squeeze mid-back.", [
        "Assisted Wide-Grip Pull-Up",
        "Neutral-Grip Pulldown",
        "Machine High Row"
      ]),
      ex("Chest-Supported Row", "3", "8-12", "90s", "BACK", "Brace sternum on pad, pull elbows down toward hip pocket, retract shoulder blades.", [
        "Seated Cable Row",
        "T-Bar Row",
        "One-Arm Dumbbell Row"
      ]),
      ex("Straight-Arm Pulldown", "3", "12-15", "60s", "WIDTH", "Hands shoulder-width, sweep bar down to thighs, stretch lats at the top.", [
        "Dumbbell Pullover",
        "Cable Pullover",
        "Machine Pullover"
      ]),
      ex("45-Degree Back Extension", "3", "12-15", "60s", "LOW BACK", "Hinge at the waist, keep neutral spine, squeeze glutes at peak lockout.", [
        "Reverse Hyperextension",
        "Good Morning",
        "Bird Dog"
      ]),
      ex("EZ-Bar Curl", "3", "8-12", "60s", "BICEPS", "Keep elbows fixed against ribs, control descent, avoid torso sway.", [
        "Barbell Curl",
        "Cable Curl",
        "Preacher Curl"
      ]),
      ex("Incline Dumbbell Curl", "2", "10-12", "60s", "BICEPS", "Sit back on 45-degree bench, arm fully extended, supinate wrist at peak.", [
        "Bayesian Cable Curl",
        "Hammer Curl",
        "Concentration Curl"
      ]),
      ex("Pallof Press", "3", "12s hold/side", "45s", "ABS", "Anchor cable, press straight out, resist torso rotation, lock core.", [
        "Cable Woodchop",
        "Dead Bug",
        "Side Plank"
      ])
    ]
  },
  {
    day: "Day C",
    letter: "C",
    title: "Legs + Shoulder Width",
    accent: "violet",
    intent: "Heavy knee flexion, posterior chain hinging, and capped side delts.",
    exercises: [
      ex("Front Squat", "4", "5-8", "150s", "KEY", "High clean rack position, deep thoracic extension, full depth squat, brace core.", [
        "Back Squat",
        "Hack Squat",
        "Leg Press"
      ]),
      ex("Romanian Deadlift", "3", "8-10", "120s", "LOW BACK", "Soft knee bend, push hips back till hamstring stretch, lock back, squeeze glutes.", [
        "Dumbbell RDL",
        "Good Morning",
        "Seated Leg Curl"
      ]),
      ex("Leg Press", "3", "10-12", "90s", "LEGS", "Feet hip-width, lower till 90 degrees knee bend, do not lock out knees.", [
        "Hack Squat",
        "Smith Machine Squat",
        "Bulgarian Split Squat"
      ]),
      ex("Seated Dumbbell Shoulder Press", "4", "6-10", "120s", "KEY", "Press weights in slight front-to-back arc, keep core braced, no neck strain.", [
        "Machine Shoulder Press",
        "Barbell Overhead Press",
        "Arnold Press"
      ]),
      ex("Cable Lateral Raise", "4", "12-20", "45s", "WIDTH", "Lean away slightly, pull elbow outward, lead with pinkies, keep constant tension.", [
        "Dumbbell Lateral Raise",
        "Machine Lateral Raise",
        "Lean-Away Cable Raise"
      ]),
      ex("Face Pull", "3", "15-20", "45s", "REAR DELT", "Pull rope toward bridge of nose, flare elbows, squeeze rear delts and traps.", [
        "Reverse Pec Deck",
        "Cable Rear Delt Fly",
        "Band Pull-Apart"
      ]),
      ex("Standing Calf Raise", "4", "12-20", "45s", "LEGS", "Pause at deep stretch, drive up to tip-toes, pause 1-sec at lockout.", [
        "Seated Calf Raise",
        "Leg Press Calf Raise",
        "Single-Leg Calf Raise"
      ]),
      ex("Ab Wheel Rollout", "3", "6-12", "60s", "ABS", "Hinge from knees, posteriorly tilt hips, roll forward, roll back using abs.", [
        "Stability Ball Rollout",
        "TRX Fallout",
        "Body Saw Plank"
      ])
    ]
  },
  {
    day: "Day D",
    letter: "D",
    title: "Chest + Triceps V2",
    accent: "orange",
    intent: "Volume pressing, progressive triceps, and heavy static core.",
    exercises: [
      ex("Dumbbell Bench Press", "4", "8-10", "120s", "KEY", "Pack shoulders, descend slowly, press inward in a slight horizontal arc.", [
        "Machine Chest Press",
        "Barbell Bench Press",
        "Smith Bench Press"
      ]),
      ex("Incline Cable Fly", "3", "12-15", "60s", "CHEST", "Low-to-high sweep, squeeze upper pectorals, control the stretch.", [
        "Incline Dumbbell Fly",
        "Pec Deck",
        "Low Cable Fly"
      ]),
      ex("Decline Bench Press", "3", "8-10", "90s", "CHEST", "Bar to lower sternum, maintain retracted shoulders, push upwards.", [
        "Weighted Dip",
        "Decline Machine Press",
        "Flat Dumbbell Press"
      ]),
      ex("Pec Deck Fly", "3", "12-15", "60s", "CHEST", "Chest out, pull handles together, 1s hard squeeze at peak, 3s negative.", [
        "Cable Crossover",
        "Dumbbell Fly",
        "Push-Up"
      ]),
      ex("Close-Grip Bench Press", "3", "6-10", "120s", "KEY", "Hands shoulder-width apart, elbows brush ribcage, push with triceps.", [
        "Smith Close-Grip Press",
        "Machine Dip",
        "Weighted Push-Up"
      ]),
      ex("EZ-Bar Skull Crusher", "3", "10-12", "60s", "TRI", "Lower bar slightly behind head to keep triceps under load, lock elbows.", [
        "Cable Skull Crusher",
        "Overhead Dumbbell Extension",
        "Rope Pushdown"
      ]),
      ex("Weighted Plank", "3", "40-60s", "45s", "ABS", "Place weight plate on lower back, vacuum abs, squeeze glutes and thighs.", [
        "RKC Plank",
        "Body Saw",
        "Dead Bug"
      ]),
      ex("Decline Sit-Up", "3", "12-15", "45s", "ABS", "Strict vertebral flexion, curl torso upwards, avoid pulling with hip flexors.", [
        "Cable Crunch",
        "Machine Crunch",
        "Weighted Crunch"
      ])
    ]
  },
  {
    day: "Day E",
    letter: "E",
    title: "Back + Biceps V2",
    accent: "cyan",
    intent: "Vertical pulls for maximum width, heavy T-Bar rows, stretch biceps.",
    exercises: [
      ex("Pull-Up", "4", "6-10", "120s", "WIDTH", "Hang fully, pack scapulae, pull chin over bar, keep chest up, control drop.", [
        "Assisted Pull-Up",
        "Wide-Grip Pulldown",
        "Neutral-Grip Pulldown"
      ]),
      ex("T-Bar Row", "4", "6-10", "120s", "KEY", "Hinge 45 degrees, chest up, row handle to belt line, squeeze shoulder blades.", [
        "Chest-Supported Row",
        "Barbell Row",
        "Machine Row"
      ]),
      ex("Single-Arm Cable Row", "3", "10-12", "75s", "BACK", "Step back, pull single handle to hip, twist slightly for lat contraction.", [
        "One-Arm Dumbbell Row",
        "Iso-Lateral Row Machine",
        "Seated Cable Row"
      ]),
      ex("Dumbbell Pullover", "3", "10-12", "75s", "WIDTH", "Lie across bench, lower dumbbell behind head with lats, keep core stable.", [
        "Straight-Arm Pulldown",
        "Machine Pullover",
        "Cable Pullover"
      ]),
      ex("Good Morning", "3", "8-10", "90s", "LOW BACK", "Bar on upper traps, hinge at hips, minimal knee bend, keep neutral spine.", [
        "Back Extension",
        "Romanian Deadlift",
        "Hip Thrust"
      ]),
      ex("Preacher Curl", "3", "10-12", "60s", "BICEPS", "Rest arms flat on pad, fully extend at bottom, curl EZ-bar to nose level.", [
        "Cable Preacher Curl",
        "EZ-Bar Curl",
        "Machine Curl"
      ]),
      ex("Hammer Curl", "3", "10-12", "60s", "BICEPS", "Neutral grip dumbbells, squeeze brachialis/forearms at peak.", [
        "Rope Hammer Curl",
        "Cross-Body Hammer Curl",
        "Reverse Curl"
      ]),
      ex("Cable Woodchop", "3", "10-12", "45s", "ABS", "High-to-low diagonal pull, pivot trailing foot, rotate torso with obliques.", [
        "Pallof Press",
        "Russian Twist",
        "Side Plank Rotation"
      ])
    ]
  },
  {
    day: "Day F",
    letter: "F",
    title: "Shoulders + Legs + Core",
    accent: "violet",
    intent: "Military press mass, capped lateral delts, heavy knee flexion, core brace.",
    exercises: [
      ex("Seated Barbell Military Press", "4", "5-8", "150s", "KEY", "Unrack at collarbones, press straight overhead, pull face back to clear bar.", [
        "Dumbbell Shoulder Press",
        "Machine Shoulder Press",
        "Standing Overhead Press"
      ]),
      ex("Arnold Press", "3", "8-10", "90s", "SHOULDER", "Rotate palms in at bottom, rotate palms out at top lockout, smooth tempo.", [
        "Dumbbell Shoulder Press",
        "Machine Press",
        "Landmine Press"
      ]),
      ex("Machine Lateral Raise", "4", "12-20", "45s", "WIDTH", "Sit straight, lead with elbows, slow control on eccentrics.", [
        "Cable Lateral Raise",
        "Dumbbell Lateral Raise",
        "Lean-Away Lateral Raise"
      ]),
      ex("Reverse Pec Deck", "3", "15-20", "45s", "REAR DELT", "Fly hands back wide, squeeze rear delts, keep chest firm against pad.", [
        "Face Pull",
        "Cable Rear Delt Fly",
        "Incline Rear Delt Raise"
      ]),
      ex("Heavy Barbell Shrug", "3", "8-12", "90s", "TRAPS", "Stand tall, shrug shoulders directly to ears, hold 1s at peak.", [
        "Dumbbell Shrug",
        "Smith Machine Shrug",
        "Trap Bar Shrug"
      ]),
      ex("Back Squat", "4", "6-10", "150s", "KEY", "Bar on upper traps, deep breath, brace core, break at hips, squat below parallel.", [
        "Hack Squat",
        "Leg Press",
        "Smith Machine Squat"
      ]),
      ex("Lying Leg Curl", "3", "10-15", "60s", "LEGS", "Hips flat on pad, pull heels to glutes, control return to full extension.", [
        "Seated Leg Curl",
        "Romanian Deadlift",
        "Nordic Curl"
      ]),
      ex("Farmer's Carry", "4", "40m", "75s", "CORE", "Hold heavy handles, stand tall, walk in a straight line with braced core.", [
        "Suitcase Carry",
        "Trap Bar Carry",
        "Dumbbell Hold"
      ]),
      ex("Bird Dog", "2", "10/side", "30s", "LOW BACK", "All fours, extend opposite arm and leg, hold 2s, keep hips perfectly level.", [
        "Dead Bug",
        "McGill Curl-Up",
        "Side Plank"
      ])
    ]
  }
];

function ex(name, sets, reps, rest, tag, cue, alternatives) {
  return { name, sets, reps, rest, tag, cue, alternatives };
}

export { coachingRules, focusTags, program };
