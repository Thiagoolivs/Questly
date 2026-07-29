import { useApp } from '../store.jsx'

// Alterna qual MEMBRO do grupo está sendo visualizado nas telas de leitura
// (histórico, conquistas). As ações do dia sempre valem para o próprio usuário.
export default function PlayerSwitch() {
  const { state, viewId, setViewId } = useApp()
  if (!state || state.players.length < 2) return null

  return (
    <div className="player-switch" role="tablist">
      {state.players.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={p.id === viewId}
          className={'switch-btn' + (p.id === viewId ? ' active' : '')}
          onClick={() => setViewId(p.id)}
        >
          <span className="switch-avatar">{p.avatar}</span>
          <span className="switch-name">{p.name}</span>
        </button>
      ))}
    </div>
  )
}
