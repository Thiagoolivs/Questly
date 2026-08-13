import { useState, useEffect } from 'react'
import Icon from './Icon.jsx'

const EVT = 'questly:open-section'

// Abre um bloco de fora (usado pelo tour, que precisa mostrar o conteúdo).
export function openSection(id) {
  localStorage.setItem('questly.sect.' + id, '1')
  window.dispatchEvent(new CustomEvent(EVT, { detail: id }))
}

// Bloco de card com cabeçalho clicável que expande/recolhe o conteúdo.
// Mantém o estado (aberto/fechado) por `id` no localStorage.
export default function Section({ id, title, meta, summary, defaultOpen = true, children }) {
  const key = id ? 'questly.sect.' + id : null
  const [open, setOpen] = useState(() => {
    if (key) {
      const v = localStorage.getItem(key)
      if (v !== null) return v === '1'
    }
    return defaultOpen
  })
  const toggle = () =>
    setOpen((o) => {
      const nv = !o
      if (key) localStorage.setItem(key, nv ? '1' : '0')
      return nv
    })

  useEffect(() => {
    if (!id) return
    const h = (e) => e.detail === id && setOpen(true)
    window.addEventListener(EVT, h)
    return () => window.removeEventListener(EVT, h)
  }, [id])

  return (
    <section className="card sect" data-tour={id || undefined}>
      <button type="button" className="sect-head" onClick={toggle} aria-expanded={open}>
        <span className="sect-title">
          {title}
          {meta != null && <span className="muted small sect-meta"> {meta}</span>}
        </span>
        <span className="sect-toggle muted xsmall">
          {!open && summary != null && <span className="sect-summary">{summary}</span>}
          <span className="sect-more">{open ? 'ocultar' : 'mostrar tudo'}</span>
          <span className={'sect-chevron' + (open ? ' open' : '')}><Icon name="chevronRight" size={15} /></span>
        </span>
      </button>
      {open && <div className="sect-body">{children}</div>}
    </section>
  )
}
