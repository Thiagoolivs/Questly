import { NavLink } from 'react-router-dom'

// Ícones de linha (SVG inline) para um visual mais sóbrio.
const Icon = ({ d, extra }) => (
  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {d.map((path, i) => (
      <path key={i} d={path} />
    ))}
    {extra}
  </svg>
)

const items = [
  { to: '/', label: 'Início', icon: <Icon d={['M3 10.8 12 3l9 7.8', 'M5 9.6V21h14V9.6']} /> },
  { to: '/feed', label: 'Feed', icon: <Icon d={['M3 12h4l3 8 4-16 3 8h4']} /> },
  { to: '/chat', label: 'Chat', icon: <Icon d={['M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z']} /> },
  { to: '/historico', label: 'Histórico', icon: <Icon d={['M8 2v4', 'M16 2v4', 'M3 10h18']} extra={<rect x="3" y="4" width="18" height="18" rx="2" />} /> },
  { to: '/conquistas', label: 'Conquistas', icon: <Icon d={['M8 21h8', 'M12 17v4', 'M7 4h10v5a5 5 0 0 1-10 0z', 'M7 7a3 3 0 0 1-3-3V4h3', 'M17 7a3 3 0 0 0 3-3V4h-3']} /> },
  { to: '/perfil', label: 'Perfil', icon: <Icon d={['M4 21c0-4 4-6 8-6s8 2 8 6']} extra={<circle cx="12" cy="8" r="4" />} /> },
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
          {it.icon}
          <span className="nav-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
