import { NavLink } from 'react-router-dom'

const items = [
  { to: '/', emoji: '🏠', label: 'Início' },
  { to: '/chat', emoji: '💬', label: 'Chat' },
  { to: '/historico', emoji: '📅', label: 'Histórico' },
  { to: '/conquistas', emoji: '🏅', label: 'Conquistas' },
  { to: '/perfil', emoji: '👤', label: 'Perfil' },
  { to: '/config', emoji: '⚙️', label: 'Config' },
]

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === '/'}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <span className="nav-emoji">{it.emoji}</span>
          <span className="nav-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
