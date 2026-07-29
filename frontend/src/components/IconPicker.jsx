import { useState } from 'react'
import Icon, { PICKER_ICONS } from './Icon.jsx'

const EMOJIS = [
  '🎯', '🔥', '⭐', '💪', '🏃', '📚', '💧', '🥗', '😴', '☀️', '🌙', '🧘',
  '🙏', '💞', '🎵', '✍️', '💼', '☕', '🚭', '🥤', '🏋️', '🧠', '🤝', '📅',
  '🔔', '✅', '🏆', '🎨', '🍎', '🚶', '❤️', '🌱',
]

// Seletor com abas Emoji | Ícone SVG. Valor = { emoji, icon } (um dos dois).
export default function IconPicker({ emoji, icon, onPick }) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState(icon ? 'icon' : 'emoji')

  return (
    <div className="iconpicker">
      <button type="button" className="iconpicker-trigger" onClick={() => setOpen((o) => !o)} title="Escolher ícone">
        {icon ? <Icon name={icon} size={20} /> : <span className="ip-emoji">{emoji || '🎯'}</span>}
      </button>
      {open && (
        <div className="iconpicker-panel">
          <div className="auth-tabs ip-tabs">
            <button type="button" className={'auth-tab ' + (tab === 'emoji' ? 'active' : '')} onClick={() => setTab('emoji')}>Emoji</button>
            <button type="button" className={'auth-tab ' + (tab === 'icon' ? 'active' : '')} onClick={() => setTab('icon')}>Ícone</button>
          </div>
          {tab === 'emoji' ? (
            <div className="ip-grid">
              {EMOJIS.map((e) => (
                <button type="button" key={e} className={'ip-cell ' + (emoji === e && !icon ? 'active' : '')} onClick={() => { onPick({ emoji: e, icon: null }); setOpen(false) }}>
                  {e}
                </button>
              ))}
            </div>
          ) : (
            <div className="ip-grid">
              {PICKER_ICONS.map((n) => (
                <button type="button" key={n} className={'ip-cell ' + (icon === n ? 'active' : '')} onClick={() => { onPick({ emoji: '', icon: n }); setOpen(false) }}>
                  <Icon name={n} size={20} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
