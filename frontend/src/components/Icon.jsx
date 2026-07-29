// Ícones de linha (SVG inline), estilo sóbrio (Apple/Vercel). currentColor.
const icons = {
  check: <path d="M20 6 9 17l-5-5" />,
  x: <><path d="M18 6 6 18" /><path d="M6 6l12 12" /></>,
  camera: (
    <>
      <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7H7l1.4-2h7.2L17 7h2.5A1.5 1.5 0 0 1 21 8.5V17a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </>
  ),
  plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
  image: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.4" />
      <path d="m21 15-5-5L5 21" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </>
  ),
  users: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </>
  ),
  trophy: (
    <>
      <path d="M6 4h12v5a6 6 0 0 1-12 0z" />
      <path d="M6 4H3v2a3 3 0 0 0 3 3" />
      <path d="M18 4h3v2a3 3 0 0 1-3 3" />
      <path d="M9 15h6M12 15v6M8 21h8" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M3 10h18M8 2v4M16 2v4" />
    </>
  ),
  message: <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />,
  activity: <path d="M3 12h4l3 8 4-16 3 8h4" />,
  flame: <path d="M12 3s5 3.5 5 9a5 5 0 0 1-10 0c0-1.4.5-2.6 1.2-3.6.5 1 .9 1.6 1.8 1.6.8 0 1-.9.5-1.9-.7-1.5-.4-4.1 1.5-5.1z" />,
  star: <path d="m12 3 2.6 5.6 6 .8-4.4 4.2 1.1 6-5.3-3-5.3 3 1.1-6L3.4 9.4l6-.8z" />,
  scale: (
    <>
      <path d="M12 3v18M7 21h10M5 7h14" />
      <path d="M5 7 2 13a3 3 0 0 0 6 0z" />
      <path d="M19 7l-3 6a3 3 0 0 0 6 0z" />
    </>
  ),
  heart: <path d="M12 20s-6.5-4.3-9-8.2C1.4 9 2.8 5.8 6 5.8c2 0 3.1 1.2 4 2.4.9-1.2 2-2.4 4-2.4 3.2 0 4.6 3.2 3 6C18.5 15.7 12 20 12 20z" />,
  dumbbell: (
    <>
      <path d="M2 12h2M20 12h2M7 12h10" />
      <rect x="4" y="9" width="3" height="6" rx="1" />
      <rect x="17" y="9" width="3" height="6" rx="1" />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3a6 6 0 0 0-3.8 10.6c.5.4.8 1 .8 1.7v.2h6v-.2c0-.7.3-1.3.8-1.7A6 6 0 0 0 12 3z" />
      <path d="M9 18h6M10 21h4" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 4l1.7 4.3L18 10l-4.3 1.7L12 16l-1.7-4.3L6 10l4.3-1.7z" />
      <path d="M18 14l.7 1.6L20.5 16l-1.8.4L18 18l-.7-1.6L15.5 16l1.8-.4z" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  leaf: <><path d="M6 18C6 10 12 6 19 6c0 8-6 12-13 12z" /><path d="M9 15c3-1 5-3 6.5-6" /></>,
  zap: <path d="M13 2 4 14h6l-1 8 9-12h-6z" />,
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />,
  // Rostos de humor
  faceGrin: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="0.7" fill="currentColor" stroke="none" /><path d="M8 13.5a5 4 0 0 0 8 0" /></>,
  faceSmile: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><path d="M8.5 14a4 3 0 0 0 7 0" /></>,
  faceNeutral: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><path d="M9 15h6" /></>,
  faceWorried: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><path d="M8.5 15.5c1-1 2-1 3.5 0s2.5 1 3.5 0" /></>,
  faceSad: <><circle cx="12" cy="12" r="9" /><circle cx="9" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="10.5" r="0.7" fill="currentColor" stroke="none" /><path d="M8.5 16a4 3 0 0 1 7 0" /></>,
  faceAngry: <><circle cx="12" cy="12" r="9" /><path d="M8 9.2 10 10M16 9.2 14 10" /><circle cx="9" cy="11" r="0.7" fill="currentColor" stroke="none" /><circle cx="15" cy="11" r="0.7" fill="currentColor" stroke="none" /><path d="M8.5 16a4 3 0 0 1 7 0" /></>,
  faceTired: <><circle cx="12" cy="12" r="9" /><path d="M7.8 9.8 10 10.6M16.2 9.8 14 10.6" /><path d="M8.5 15.5a4 3 0 0 1 7 0" /></>,
  // Extras p/ o seletor de ícones
  droplet: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" />,
  book: <><path d="M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2z" /><path d="M18 19H7" /></>,
  coffee: <><path d="M4 8h13v5a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" /><path d="M17 9h2a2 2 0 0 1 0 4h-2" /><path d="M7 3v2M11 3v2M15 3v2" /></>,
  music: <><circle cx="6.5" cy="18" r="2" /><circle cx="17" cy="16" r="2" /><path d="M8.5 18V6l10.5-2v10" /></>,
  pencil: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M14 6l4 4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M3 12h18" /></>,
  utensils: <><path d="M5 3v7a2 2 0 0 0 4 0V3M7 10v11" /><path d="M17 3c-1.5 0-2.5 2-2.5 5s1 3.5 2 4v9" /></>,
  bed: <><path d="M3 8v11M3 13h16a2 2 0 0 1 2 2v4M3 19h18" /><path d="M7 13v-2a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2" /></>,
  water: <path d="M4 6h16M6 6c0 6 2 12 6 12s6-6 6-12" />,
  run: <><circle cx="15" cy="5" r="2" /><path d="M4 20l3-5 3 1 1-4-4-2 3-3 3 3 3 1" /></>,
}

// Ícone por área (as 5 categorias do desafio).
const CATEGORY_ICON = {
  Física: 'dumbbell',
  Mental: 'bulb',
  Social: 'users',
  Relação: 'heart',
  Espiritual: 'sparkle',
}

export function categoryIconName(cat) {
  return CATEGORY_ICON[cat] || 'activity'
}

// Humor/emoções → ícone de rosto (SVG).
const MOOD_ICON = {
  otimo: 'faceGrin', feliz: 'faceSmile', grato: 'heart', calmo: 'leaf',
  motivado: 'flame', produtivo: 'zap', neutro: 'faceNeutral', cansado: 'moon',
  ansioso: 'faceWorried', estressado: 'faceAngry', triste: 'faceSad', dificil: 'faceTired',
}
export function moodIconName(key) {
  return MOOD_ICON[key] || 'faceNeutral'
}

// Conjunto de ícones oferecidos no seletor (itens personalizáveis).
export const PICKER_ICONS = [
  'target', 'flame', 'star', 'heart', 'dumbbell', 'run', 'bulb', 'book',
  'droplet', 'water', 'utensils', 'coffee', 'bed', 'moon', 'sun', 'leaf',
  'sparkle', 'zap', 'music', 'pencil', 'briefcase', 'users', 'calendar', 'bell',
  'check', 'trophy', 'activity', 'message',
]

export default function Icon({ name, size = 18, strokeWidth = 1.7, className = '' }) {
  const el = icons[name]
  if (!el) return null
  return (
    <svg
      className={'ico' + (className ? ' ' + className : '')}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {el}
    </svg>
  )
}
