import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'

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

  // Agrupa por dia mantendo a ordem (itens já vêm do mais novo pro mais antigo).
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
    <div className="screen">
      <header className="topbar">
        <div className="brand">Atividades</div>
      </header>

      {err && <div className="error">{err}</div>}
      {items === null && !err && <div className="muted small">Carregando…</div>}
      {items && items.length === 0 && (
        <div className="empty-state">
          <div className="muted small">Ainda sem atividades. Conclua um desafio ou registre algo em dupla — aparece aqui.</div>
        </div>
      )}

      {groups.map((g) => (
        <div className="feed-day" key={g.key}>
          <div className="feed-day-divider">{dayLabel(g.key)}</div>
          <div className="feed-list">
            {g.items.map((a) => {
              const rx = a.reactions || { counts: {}, mine: null, total: 0 }
              return (
                <div className="feed-row card" key={a.id}>
                  <div className="feed-av">
                    <Avatar photo={a.photo} avatar={a.avatar} name={a.author} size={34} />
                  </div>
                  <div className="feed-body">
                    <div className="feed-line">
                      <span className="feed-row-emoji">{a.emoji}</span> {a.text}
                    </div>
                    {a.image && (
                      <img className="feed-photo" src={a.image} alt="" loading="lazy" onClick={() => setZoom(a.image)} />
                    )}
                    <div className="feed-react">
                      <span className="feed-react-left">
                        <span className="muted xsmall">{timeAgo(a.created_at)}</span>
                        {rx.total > 0 && (
                          <span className="feed-react-summary">
                            {Object.keys(rx.counts).map((k) => (
                              <span key={k} className="react-chip-emoji">{emojiOf(k)}</span>
                            ))}
                            <span className="muted xsmall">{rx.total}</span>
                          </span>
                        )}
                      </span>
                      <span className="feed-react-btnwrap">
                        <button
                          className={'react-btn ' + (rx.mine ? 'active' : '')}
                          onClick={() => setPickerFor(pickerFor === a.id ? null : a.id)}
                        >
                          {rx.mine ? (
                            <>{emojiOf(rx.mine)} {labelOf(rx.mine)}</>
                          ) : (
                            <><Icon name="heart" size={13} /> Reagir</>
                          )}
                        </button>
                        {pickerFor === a.id && (
                          <div className="react-picker">
                            {types.map((rt) => (
                              <button
                                key={rt.key}
                                className={'react-opt ' + (rx.mine === rt.key ? 'active' : '')}
                                title={rt.label}
                                onClick={() => react(a.id, rt.key)}
                              >
                                {rt.emoji}
                              </button>
                            ))}
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  )
}
