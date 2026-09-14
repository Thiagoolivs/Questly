import { Link } from 'react-router-dom'
import Icon from '../components/Icon.jsx'

/**
 * Plano — Placeholder (Fase 2).
 * Unifica: Objetivos, Treino, Nutrição, Hábitos, Rotinas, Progresso.
 * Por enquanto: links para as funcionalidades existentes.
 */
export default function Plano() {
  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Meu Plano</div>
      </header>

      <section className="card tinted">
        <div className="card-title">Objetivos e planejamento</div>
        <p className="small" style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Aqui você vai centralizar seus objetivos pessoais, plano de treino, nutrição,
          hábitos e rotinas. Em breve!
        </p>
      </section>

      <Link to="/tarefas" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="listCheck" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Tarefas</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/historico" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="calendar" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Historico</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/conquistas" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="trophy" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Conquistas</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>
    </div>
  )
}
