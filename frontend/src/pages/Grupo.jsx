import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import Icon from '../components/Icon.jsx'

/**
 * Grupo — Placeholder (Fase 3).
 * Unifica: Ranking, Desafios, Chat, Atividades em dupla, Membros.
 * Por enquanto: exibe as funcionalidades existentes via links.
 */
export default function Grupo() {
  const { group } = useApp()

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">{group?.name || 'Grupo'}</div>
        <div className="streak-chip">
          <Icon name="users" size={14} />
          {group?.member_count ?? '—'}
        </div>
      </header>

      <PlayerSwitch />

      <Link to="/chat" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="message" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Chat do grupo</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/mural" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="image" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Mural de fotos</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/config" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="settings" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Configuracoes do grupo</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>
    </div>
  )
}
