import { useState, useEffect } from 'react'
import Icon from '../design-system/components/core/Icon.jsx'
import { canPromptInstall, promptInstall, onInstallChange, isStandalone, installGuide } from '../utils/pwa.js'

// Passo a passo para colocar o Questly na tela inicial, adaptado ao aparelho.
// Quando o navegador permite (Android/desktop), oferece o botão de instalar nativo.
export default function InstallGuide({ compact = false }) {
  const [canPrompt, setCanPrompt] = useState(canPromptInstall())
  const [installed, setInstalled] = useState(isStandalone())
  const guide = installGuide()

  useEffect(() => onInstallChange(() => {
    setCanPrompt(canPromptInstall())
    setInstalled(isStandalone())
  }), [])

  async function install() {
    const out = await promptInstall()
    if (out === 'accepted') setInstalled(true)
  }

  if (installed) {
    return (
      <div className="install-done">
        <Icon name="check" size={16} /> O Questly já está instalado neste aparelho.
      </div>
    )
  }

  return (
    <div className={'install-guide' + (compact ? ' compact' : '')}>
      <div className="install-head">
        <span className="install-icon"><Icon name="plus" size={18} /></span>
        <div>
          <div className="install-title">{guide.title}</div>
          <div className="muted xsmall">{guide.subtitle}</div>
        </div>
      </div>

      <ol className="install-steps">
        {guide.steps.map((s, i) => (
          <li key={i}><span className="install-num">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>

      {canPrompt && (
        <button className="btn full btn-primary icon-btn" onClick={install}>
          <Icon name="plus" size={15} /> Instalar agora
        </button>
      )}

      {guide.note && <p className="muted xsmall install-note">{guide.note}</p>}
    </div>
  )
}
