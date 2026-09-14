import { useState } from 'react'
import Icon, { PICKER_ICONS } from './Icon.jsx'

// Seletor de Ícones SVG (estilo Lucide).
export default function IconPicker({ icon, onPick }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="iconpicker">
      <button type="button" className="iconpicker-trigger" onClick={() => setOpen((o) => !o)} title="Escolher ícone">
        <Icon name={icon || 'target'} size={20} />
      </button>
      {open && (
        <div className="iconpicker-panel">
          <div className="ip-grid">
            {PICKER_ICONS.map((n) => (
              <button
                type="button"
                key={n}
                className={'ip-cell ' + (icon === n ? 'active' : '')}
                onClick={() => {
                  onPick({ icon: n })
                  setOpen(false)
                }}
              >
                <Icon name={n} size={20} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
