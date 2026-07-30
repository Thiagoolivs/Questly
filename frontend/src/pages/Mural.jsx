import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'

function dateLabel(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function Mural() {
  const { groupId } = useApp()
  const [weeks, setWeeks] = useState(null)
  const [err, setErr] = useState(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!groupId) return
    api.gallery(groupId).then((d) => setWeeks(d.weeks)).catch((e) => setErr(e.message))
  }, [groupId])

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Mural</div>
      </header>

      {err && <div className="error">{err}</div>}
      {weeks === null && !err && <div className="muted small">Carregando…</div>}
      {weeks && weeks.length === 0 && (
        <div className="empty-state">
          <div className="muted small">
            Sem fotos ainda. As comprovações dos desafios e das atividades em dupla aparecem aqui, semana a semana.
          </div>
        </div>
      )}

      {weeks &&
        weeks.map((w) => (
          <section className="card" key={w.week_start}>
            <div className="row between mural-week-head">
              <div className="mural-week-title">Semana de {w.label}</div>
              <div className="muted small">{w.retro.photo_count} foto(s)</div>
            </div>

            <div className="retro">
              <div className="retro-stat">
                <b>{w.retro.group_points}</b>
                <span className="muted xsmall">pts do grupo</span>
              </div>
              <div className="retro-stat">
                <b>{w.retro.joint_count}</b>
                <span className="muted xsmall">em dupla</span>
              </div>
              {w.retro.members.map((m) => (
                <div className="retro-stat" key={m.name}>
                  <b>{m.points}</b>
                  <span className="muted xsmall">{m.name}{m.perfect_days ? ` · ⭐${m.perfect_days}` : ''}</span>
                </div>
              ))}
            </div>

            {w.photos.length > 0 && (
              <div className="mural-grid">
                {w.photos.map((p, i) => (
                  <button className="mural-cell" key={i} onClick={() => setZoom(p)}>
                    <img src={p.image} alt={p.label} loading="lazy" />
                    <span className="mural-tag">{p.emoji}</span>
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <div className="lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <img src={zoom.image} alt={zoom.label} />
            <div className="lightbox-cap">
              {zoom.emoji} {zoom.label} · {zoom.author} · {dateLabel(zoom.date)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
