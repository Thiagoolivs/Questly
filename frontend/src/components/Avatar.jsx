import Icon from './Icon.jsx'

const MONO_COLORS = ['#5e6ad2', '#3fb27f', '#d6a23e', '#e5749a', '#4aa3d6', '#a06ad2', '#d2795e']

function colorFor(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return MONO_COLORS[h % MONO_COLORS.length]
}

export default function Avatar({ src, photo, avatar, name = '', size = 32, round = true }) {
  const radius = round ? '50%' : 8
  const photoUrl = src || photo
  if (photoUrl) {
    return <img src={photoUrl} alt="" className="avatar-photo" style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover' }} />
  }
  
  if (avatar && avatar.length > 0) {
    // Check if it's still a legacy emoji or string name
    const isLegacyEmoji = /\p{Extended_Pictographic}/u.test(avatar)
    
    if (isLegacyEmoji) {
      return (
        <span style={{ 
          width: size, height: size, borderRadius: radius, 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--surface-sunken)', fontSize: size * 0.5 
        }}>
          {avatar}
        </span>
      )
    }

    return (
      <span style={{ 
        width: size, height: size, borderRadius: radius, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--blue-glow)', color: '#fff' 
      }}>
        <Icon name={avatar} size={size * 0.6} />
      </span>
    )
  }

  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className="avatar-mono"
      style={{ width: size, height: size, borderRadius: radius, background: colorFor(name), fontSize: size * 0.42, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}
    >
      {initial}
    </span>
  )
}
