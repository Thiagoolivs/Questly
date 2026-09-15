import { Icon } from '../design-system/components/index.js'

/**
 * Caixa de marcação usada no Meu Dia (hábitos, passos de rotina, agenda).
 * Só tokens do design system — nada de emoji, conforme a regra de marca.
 */
export default function CheckControl({
  checked = false,
  onChange,
  size = 24,
  round = false,
  disabled = false,
  label,
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        onChange?.(!checked)
      }}
      style={{
        width: size,
        height: size,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        borderRadius: round ? '50%' : 'var(--radius-sm)',
        border: checked ? '1px solid transparent' : '1px solid var(--n-6)',
        background: checked ? 'var(--blue-glow)' : 'transparent',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)',
      }}
    >
      {checked ? <Icon name="check" size={Math.round(size * 0.62)} color="var(--full-white)" /> : null}
    </button>
  )
}
