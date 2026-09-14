import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import Icon from './Icon.jsx'

const itemsLeft = [
  {
    to: '/',
    label: 'Meu Dia',
    icon: <Icon name="sun" size={22} />,
  },
  {
    to: '/plano',
    label: 'Plano',
    icon: <Icon name="calendar" size={22} />,
  },
]

const itemsRight = [
  {
    to: '/grupo',
    label: 'Grupo',
    icon: <Icon name="users" size={22} />,
  },
  {
    to: '/feed',
    label: 'Feed',
    icon: <Icon name="activity" size={22} />,
  },
]

export default function BottomNav() {
  const [showFabMenu, setShowFabMenu] = useState(false)

  return (
    <>
      <nav className="bottom-nav">
        {itemsLeft.map((it) => (
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
        
        <div className="nav-fab-container">
          <button className="nav-fab" onClick={() => setShowFabMenu(true)}>
            <Icon name="plus" size={24} />
          </button>
        </div>

        {itemsRight.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
          >
            {it.icon}
            <span className="nav-label">{it.label}</span>
          </NavLink>
        ))}
      </nav>

      {showFabMenu && (
        <div className="bottom-sheet-overlay" onClick={() => setShowFabMenu(false)}>
          <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <h3 className="sheet-title">Adicionar...</h3>
            <div className="fab-menu-options">
              <button className="fab-option" onClick={() => setShowFabMenu(false)}>
                <div className="fab-icon-wrap"><Icon name="calendar" size={20} /></div>
                <span>Novo Evento</span>
              </button>
              <button className="fab-option" onClick={() => setShowFabMenu(false)}>
                <div className="fab-icon-wrap"><Icon name="sun" size={20} /></div>
                <span>Nova Rotina</span>
              </button>
              <button className="fab-option" onClick={() => setShowFabMenu(false)}>
                <div className="fab-icon-wrap"><Icon name="check-circle" size={20} /></div>
                <span>Novo Hábito</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
