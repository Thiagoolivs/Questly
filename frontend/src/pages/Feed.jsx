import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import Avatar from '../components/Avatar.jsx'

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function Feed() {
  const { groupId } = useApp()
  const [items, setItems] = useState(null)
  const [err, setErr] = useState(null)
  const [zoom, setZoom] = useState(null)

  const load = useCallback(() => {
    if (!groupId) return
    api.activities(groupId).then((d) => setItems(d.activities)).catch((e) => setErr(e.message))
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])
  useEffect(() => {
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

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

      {items && items.length > 0 && (
        <div className="feed-list">
          {items.map((a) => (
            <div className="feed-row card" key={a.id}>
              <div className="feed-av">
                <Avatar photo={a.photo} avatar={a.avatar} size={34} />
              </div>
              <div className="feed-body">
                <div className="feed-line">
                  <span className="feed-row-emoji">{a.emoji}</span> {a.text}
                </div>
                <div className="muted xsmall">{timeAgo(a.created_at)}</div>
              </div>
              {a.image && <img className="feed-row-thumb" src={a.image} alt="" onClick={() => setZoom(a.image)} />}
            </div>
          ))}
        </div>
      )}

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="" />
        </div>
      )}
    </div>
  )
}
