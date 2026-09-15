import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Card, Icon } from '../design-system/components/index.js'

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
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'calc(var(--tab-bar-height) + var(--space-8))' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Mural
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Fotos e comprovações da semana.
        </p>
      </header>

      {err && <div className="error" style={{ color: 'var(--error)' }}>{err}</div>}
      {weeks === null && !err && <div className="muted small" style={{ color: 'var(--text-tertiary)' }}>Carregando…</div>}
      {weeks && weeks.length === 0 && (
        <Card padding="md">
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', padding: 'var(--space-4) 0' }}>
            Sem fotos ainda. As comprovações dos desafios e das atividades em dupla aparecem aqui.
          </div>
        </Card>
      )}

      {weeks && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {weeks.map((w) => (
            <Card key={w.week_start} padding="none">
              <div style={{ padding: 'var(--pad-card-md)', borderBottom: '1px solid var(--line-hairline)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)' }}>
                    Semana de {w.label}
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                    {w.retro.photo_count} foto(s)
                  </div>
                </div>
              </div>

              <div style={{ padding: 'var(--pad-card-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 'var(--space-3)', background: 'var(--surface-sunken)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <b style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', color: 'var(--text-primary)' }}>{w.retro.group_points}</b>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>pts do grupo</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  <b style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', color: 'var(--text-primary)' }}>{w.retro.joint_count}</b>
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>em dupla</span>
                </div>
                {w.retro.members.map((m) => (
                  <div key={m.name} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                    <b style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', color: 'var(--text-primary)' }}>{m.points}</b>
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      {m.name}
                      {m.perfect_days > 0 && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', color: '#ffb300', gap: 2 }}>
                          <Icon name="star" size={10} fill="currentColor" />
                          {m.perfect_days}
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {w.photos.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, padding: 2 }}>
                  {w.photos.map((p, i) => (
                    <button 
                      key={i} 
                      onClick={() => setZoom(p)}
                      style={{ 
                        aspectRatio: '1', position: 'relative', border: 'none', padding: 0, 
                        background: 'var(--surface-sunken)', cursor: 'pointer', overflow: 'hidden' 
                      }}
                    >
                      <img src={p.image} alt={p.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 4, right: 4, background: 'rgba(0,0,0,0.6)', borderRadius: 'var(--radius-pill)', padding: '2px 6px', fontSize: 12 }}>
                        {p.icon ? <Icon name={p.icon} size={12} color="#fff" /> : p.emoji}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {zoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column' }} onClick={() => setZoom(null)}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)' }}>
            <img src={zoom.image} alt={zoom.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} onClick={(e) => e.stopPropagation()} />
          </div>
          <div style={{ padding: 'var(--space-6)', color: '#fff', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)', marginBottom: 'var(--space-1)' }}>
              {zoom.icon ? <Icon name={zoom.icon} size={14} color="#fff" /> : zoom.emoji} {zoom.label}
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'rgba(255,255,255,0.7)' }}>
              {zoom.author} · {dateLabel(zoom.date)}
            </div>
          </div>
          <button 
            style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => setZoom(null)}
          >
            <Icon name="x" size={20} />
          </button>
        </div>
      )}
    </div>
  )
}

