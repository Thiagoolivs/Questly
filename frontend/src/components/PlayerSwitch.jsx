import { useApp } from '../store.jsx'
import { Avatar } from '../design-system/components/index.js'

/**
 * Alterna qual membro do grupo está sendo visualizado nas telas de leitura
 * (conquistas, histórico). As ações do dia sempre valem para o próprio usuário.
 *
 * Some quando não há com quem alternar — num espaço de uma pessoa ele não tem
 * função nenhuma.
 */
export default function PlayerSwitch() {
  const { state, viewId, setViewId } = useApp()
  if (!state || (state.players?.length ?? 0) < 2) return null

  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        overflowX: 'auto',
        // A fileira rola até a borda da tela em vez de terminar no meio dela:
        // o último nome parecia cortado por falta de respiro à direita.
        paddingBottom: 'var(--space-2)',
        paddingRight: 'var(--gutter-screen)',
        marginRight: 'calc(-1 * var(--gutter-screen))',
        marginBottom: 'var(--space-6)',
        scrollbarWidth: 'none',
      }}
    >
      {state.players.map((p) => {
        const ativo = p.id === viewId
        return (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={ativo}
            onClick={() => setViewId(p.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              flex: 'none',
              height: 36,
              padding: '0 12px 0 4px',
              borderRadius: 'var(--radius-pill)',
              cursor: 'pointer',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-label)',
              fontWeight: 'var(--fw-medium)',
              background: ativo ? 'var(--surface-inverse)' : 'var(--surface-chip)',
              color: ativo ? 'var(--text-on-light)' : 'var(--text-secondary)',
              border: ativo ? '1px solid transparent' : '1px solid var(--line-hairline)',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* O Avatar do design system recebe src/name; photo/avatar não existem
                nele e faziam a bolinha sair vazia. */}
            <Avatar src={p.photo} name={p.name} size={28} />
            {p.name.split(' ')[0]}
          </button>
        )
      })}
    </div>
  )
}
