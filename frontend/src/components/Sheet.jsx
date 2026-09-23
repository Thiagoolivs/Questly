import { useEffect } from 'react'

/**
 * Bottom sheet do Questly — a forma padrão de criar/editar coisa no app.
 *
 * O design system traz as superfícies (`--surface-raised`, `--shadow-sheet`)
 * mas não um componente de sheet, então ele mora aqui e é único: agenda,
 * registro e desafio usam este mesmo, em vez de cada tela repetir o overlay.
 */
export default function Sheet({ title, onClose, children, footer }) {
  // Sheet aberto não deixa a página atrás rolar junto.
  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const aoTeclar = (e) => e.key === 'Escape' && onClose?.()
    window.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', aoTeclar)
    }
  }, [onClose])

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.6)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        // Acima do aviso do rodapé (300): a folha é modal e o texto dela diz o
        // que se perde — um aviso da ação anterior não pode cobri-lo. Os avisos
        // disparados de dentro de uma folha só aparecem depois que ela fecha,
        // que é o que o app faz em todos os casos.
        zIndex: 400,
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-raised)',
          borderTopLeftRadius: 'var(--radius-xl)',
          borderTopRightRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-sheet)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 'var(--space-5)' }}>
          <span style={{ width: 36, height: 4, borderRadius: 999, background: 'var(--n-6)' }} />
        </div>

        {title ? (
          <h2
            style={{
              margin: 0,
              padding: 'var(--space-5) var(--gutter-screen) 0',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-3)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h2>
        ) : null}

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            padding: 'var(--space-6) var(--gutter-screen)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-5)',
          }}
        >
          {children}
        </div>

        {footer ? (
          <div
            style={{
              display: 'flex',
              gap: 'var(--space-5)',
              padding: 'var(--space-5) var(--gutter-screen)',
              paddingBottom: 'calc(var(--space-6) + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid var(--line-hairline)',
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
