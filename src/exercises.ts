// Curated list of lightweight daily exercises with simple inline SVG illustrations.
// No external API required. The exercise of the day is selected by date modulo the list length.

export interface Exercise {
  id: string
  name: string
  description: string
  tips?: string
  svg: string // inline SVG markup
  duration: string // e.g., '30 sec x 3 sets'
  gifUrl?: string // optional animated GIF (licensed) displayed instead of svg when present
  attribution?: string // plain-text attribution
  license?: string // short license label
}

export const EXERCISES: Exercise[] = [
  {
    id: 'plank',
    name: 'Plank Hold',
    description: 'Engage core by maintaining a straight line from head to heels.',
    tips: 'Avoid letting hips sag. Breathe steadily.',
    duration: '30–45 sec x 3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="40" width="80" height="8" rx="4" fill="#ffe9b3" />
      <circle cx="20" cy="30" r="6" fill="#ffb347" />
      <rect x="18" y="28" width="50" height="8" rx="4" fill="#ffce66" />
      <rect x="50" y="34" width="22" height="6" rx="3" fill="#ffc24d" />
    </svg>`
  },
  {
    id: 'bodyweight-squat',
    name: 'Bodyweight Squat',
    description: 'Lower hips back and down, keeping knees tracking over toes.',
    tips: 'Chest up, weight in mid-foot / heels.',
    duration: '12 reps x 3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="45" cy="18" r="6" fill="#7bd389" />
      <rect x="42" y="24" width="6" height="14" rx="3" fill="#92e09b" />
      <rect x="36" y="38" width="18" height="8" rx="4" fill="#6bcf80" />
      <rect x="34" y="46" width="10" height="6" rx="3" fill="#5fb872" />
      <rect x="46" y="46" width="10" height="6" rx="3" fill="#5fb872" />
    </svg>`
  },
  {
    id: 'pushup-incline',
    name: 'Incline Push-Up',
    description: 'Hands elevated on sturdy surface; lower chest toward platform.',
    tips: 'Keep core braced; elbows ~45° angle.',
    duration: '10 reps x 3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="50" height="8" rx="4" fill="#9fd3ff" />
      <rect x="50" y="30" width="25" height="10" rx="5" fill="#7cc6ff" />
      <circle cx="24" cy="36" r="6" fill="#4da9ff" />
      <rect x="24" y="34" width="36" height="6" rx="3" fill="#66b9ff" />
    </svg>`
  },
  {
    id: 'glute-bridge',
    name: 'Glute Bridge',
    description: 'Drive hips upward by squeezing glutes, forming a straight line shoulders to knees.',
    tips: 'Do not hyperextend lower back.',
    duration: '12 reps x 3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="42" width="80" height="8" rx="4" fill="#ffe1d6" />
      <rect x="20" y="34" width="35" height="8" rx="4" fill="#ffb19d" />
      <circle cx="56" cy="38" r="6" fill="#ff977c" />
      <rect x="40" y="30" width="14" height="6" rx="3" fill="#ffcab9" />
    </svg>`
  },
  {
    id: 'bird-dog',
    name: 'Bird Dog',
    description: 'From quadruped, extend opposite arm and leg; keep hips level and core engaged.',
    tips: 'Reach long rather than high.',
    duration: '8 reps/side x 2–3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="40" width="70" height="8" rx="4" fill="#e3d7ff" />
      <rect x="18" y="34" width="30" height="8" rx="4" fill="#bfa8ff" />
      <circle cx="50" cy="38" r="6" fill="#9d85ff" />
      <rect x="28" y="30" width="14" height="6" rx="3" fill="#d2c4ff" />
      <rect x="34" y="26" width="18" height="4" rx="2" fill="#c5b4ff" />
    </svg>`
  },
  {
    id: 'burpee',
    name: 'Burpee',
    description: 'Full-body movement combining squat, plank, and jump to elevate heart rate.',
    tips: 'Land softly; keep core tight when kicking feet back.',
    duration: '6–10 reps x 3 sets',
    svg: `<svg width="90" height="60" viewBox="0 0 90 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="42" width="80" height="8" rx="4" fill="#ffe9b3" />
      <circle cx="24" cy="22" r="6" fill="#ff6b6b" />
      <rect x="22" y="28" width="10" height="14" rx="3" fill="#ff8d8d" />
      <rect x="18" y="42" width="18" height="6" rx="3" fill="#ffb1b1" />
    </svg>`,
    gifUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/df/Burpee.gif',
    attribution: 'Burpee.gif by Taco Fleur / Jahobr (Wikimedia Commons)',
    license: 'CC BY-SA 4.0'
  }
]

export function getExerciseOfDay(date: Date = new Date()): Exercise {
  const idx = date.getFullYear() * 372 + date.getMonth() * 31 + date.getDate() // pseudo-unique rolling index
  return EXERCISES[idx % EXERCISES.length]
}
