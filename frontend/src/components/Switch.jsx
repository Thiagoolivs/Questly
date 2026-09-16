/**
 * Chave liga/desliga.
 *
 * O design system não traz uma, e o app usava uma classe CSS antiga (`.toggle`)
 * pintada com tokens de outra paleta — verde num app azul. Esta usa os tokens
 * do LGrow e some do CSS global.
 */
export default function Switch({ checked = false, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.(!checked)
      }}
      style={{
        position: 'relative',
        width: 46,
        height: 28,
        flex: 'none',
        padding: 0,
        borderRadius: 'var(--radius-pill)',
        border: checked ? '1px solid transparent' : '1px solid var(--line-hairline)',
        background: checked ? 'var(--blue-glow)' : 'var(--surface-input)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'background var(--dur-fast) var(--ease-standard)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--full-white)',
          transition: 'left var(--dur-fast) var(--ease-standard)',
        }}
      />
    </button>
  )
}
