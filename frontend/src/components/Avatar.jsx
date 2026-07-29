// Avatar do usuário: foto (data URL) > emoji escolhido > monograma (inicial).
const MONO_COLORS = ['#5e6ad2', '#3fb27f', '#d6a23e', '#e5749a', '#4aa3d6', '#a06ad2', '#d2795e']

function colorFor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return MONO_COLORS[h % MONO_COLORS.length]
}

// Um emoji "de verdade" tem code point alto; letras/vazio caem no monograma.
function isEmoji(str) {
  return !!str && /\p{Extended_Pictographic}/u.test(str)
}

export default function Avatar({ photo, avatar, name = '', size = 32, round = true }) {
  const radius = round ? '50%' : 8
  if (photo) {
    return <img src={photo} alt="" className="avatar-photo" style={{ width: size, height: size, borderRadius: radius }} />
  }
  if (isEmoji(avatar)) {
    return <span style={{ fontSize: size * 0.72, lineHeight: 1 }}>{avatar}</span>
  }
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className="avatar-mono"
      style={{ width: size, height: size, borderRadius: radius, background: colorFor(name), fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  )
}
