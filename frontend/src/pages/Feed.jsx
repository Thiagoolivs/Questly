import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Card, Icon } from '../design-system/components/index.js'

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function dayKey(a) {
  return a.day || (a.created_at ? a.created_at.slice(0, 10) : '')
}

function dayLabel(iso) {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function Feed() {
  const { groupId } = useApp()
  const [items, setItems] = useState(null)
  const [types, setTypes] = useState([])
  const [pickerFor, setPickerFor] = useState(null)
  const [err, setErr] = useState(null)
  const [zoom, setZoom] = useState(null)

  const load = useCallback(() => {
    if (!groupId) return
    api.activities(groupId)
      .then((d) => {
        setItems(d.activities)
        if (d.reaction_types) setTypes(d.reaction_types)
      })
      .catch((e) => setErr(e.message))
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  const emojiOf = (k) => types.find((r) => r.key === k)?.emoji || '👍'
  const labelOf = (k) => types.find((r) => r.key === k)?.label || 'Reagir'

  async function react(aid, key) {
    setPickerFor(null)
    try {
      const r = await api.reactActivity(groupId, aid, { reaction: key })
      setItems((prev) => prev.map((a) => (a.id === aid ? { ...a, reactions: r } : a)))
    } catch (e) {
      alert('Erro: ' + e.message)
    }
  }

  const groups = []
  const idx = {}
  for (const a of items || []) {
    const k = dayKey(a)
    if (!(k in idx)) {
      idx[k] = groups.length
      groups.push({ key: k, items: [] })
    }
    groups[idx[k]].items.push(a)
  }

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Feed
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Atividades recentes do grupo.
        </p>
      </header>

      {err && (
        <div style={{ padding: 'var(--space-4)', background: 'rgba(255, 69, 58, 0.1)', color: 'var(--error)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)' }}>
          {err}
        </div>
      )}
      
      {items === null && !err && (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>Carregando…</div>
      )}
      
      {items && items.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: 'var(--space-8)' }}>
          Ainda sem atividades. Conclua um desafio ou registre algo em dupla — aparece aqui.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {groups.map((g) => (
          <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: 'var(--ls-caps)' }}>
              {dayLabel(g.key)}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
              {g.items.map((a) => {
                const rx = a.reactions || { counts: {}, mine: null, total: 0 }
                return (
                  <Card key={a.id} padding="md">
                    <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                      <Avatar src={a.photo || a.avatar} name={a.author} size={36} />
                      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                          <span style={{ fontWeight: 'var(--fw-bold)' }}>{a.author}</span> {a.text}
                        </div>
                        
                        {a.image && (
                          <img 
                            src={a.image} 
                            alt="" 
                            loading="lazy" 
                            onClick={() => setZoom(a.image)}
                            style={{ 
                              width: '100%', borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: 300, cursor: 'pointer',
                              border: '1px solid var(--line-hairline)' 
                            }} 
                          />
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--space-2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                            <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
                              {timeAgo(a.created_at)}
                            </span>
                            {rx.total > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                {Object.keys(rx.counts).map((k) => (
                                  <span key={k} style={{ fontSize: 14 }}>{emojiOf(k)}</span>
                                ))}
                                <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                                  {rx.total}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div style={{ position: 'relative' }}>
                            <button
                              style={{
                                background: rx.mine ? 'rgba(0, 122, 255, 0.1)' : 'var(--surface-chip)',
                                border: 'none', borderRadius: 'var(--radius-pill)',
                                padding: 'var(--space-1) var(--space-3)',
                                display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
                                cursor: 'pointer',
                                color: rx.mine ? 'var(--blue-glow)' : 'var(--text-secondary)',
                                fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)'
                              }}
                              onClick={() => setPickerFor(pickerFor === a.id ? null : a.id)}
                            >
                              {rx.mine ? (
                                <>{emojiOf(rx.mine)} <span style={{ display: 'none' }}>{labelOf(rx.mine)}</span></>
                              ) : (
                                <><Icon name="heart" size={12} /> Reagir</>
                              )}
                            </button>
                            
                            {pickerFor === a.id && (
                              <div style={{
                                position: 'absolute', bottom: 'calc(100% + 8px)', right: 0,
                                background: 'var(--surface-overlay)', border: '1px solid var(--line-hairline)',
                                borderRadius: 'var(--radius-pill)', padding: 'var(--space-2)',
                                display: 'flex', gap: 'var(--space-2)', boxShadow: 'var(--shadow-float)',
                                zIndex: 10
                              }}>
                                {types.map((rt) => (
                                  <button
                                    key={rt.key}
                                    title={rt.label}
                                    onClick={() => react(a.id, rt.key)}
                                    style={{
                                      background: rx.mine === rt.key ? 'var(--surface-hover)' : 'transparent',
                                      border: 'none', fontSize: 20, cursor: 'pointer',
                                      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      transition: 'transform var(--dur-fast) var(--ease-spring)'
                                    }}
                                  >
                                    {rt.emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {zoom && (
        <div 
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.9)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--space-4)', cursor: 'zoom-out'
          }}
        >
          <img src={zoom} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
        </div>
      )}
    </div>
  )
}
