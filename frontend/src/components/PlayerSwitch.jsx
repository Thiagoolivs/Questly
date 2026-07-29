import { useApp } from '../store.jsx'

// Alterna qual jogador está sendo visualizado/editado (o casal = 2 jogadores).
export default function PlayerSwitch() {
  const { state, playerId, setPlayerId } = useApp()
  if (!state) return null

  return (
    <div className="player-switch" role="tablist">
      {state.players.map((p) => (
        <button
          key={p.id}
          role="tab"
          aria-selected={p.id === playerId}
          className={'switch-btn' + (p.id === playerId ? ' active' : '')}
          onClick={() => setPlayerId(p.id)}
        >
          <span className="switch-avatar">{p.avatar}</span>
          <span className="switch-name">{p.name}</span>
        </button>
      ))}
    </div>
  )
}
