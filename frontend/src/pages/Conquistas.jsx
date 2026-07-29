import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'

export default function Conquistas() {
  const { groupId, viewId } = useApp()
  const [list, setList] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!groupId || !viewId) return
    setList(null)
    api.achievements(groupId, viewId).then((d) => setList(d.achievements)).catch((e) => setErr(e.message))
  }, [groupId, viewId])

  if (err) return <div className="screen center error">{err}</div>
  if (!list) return <div className="screen center muted">Carregando…</div>

  const unlocked = list.filter((a) => a.unlocked).length

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Conquistas</div>
        <div className="streak-chip">{unlocked}/{list.length}</div>
      </header>
      <PlayerSwitch />

      <div className="badge-grid">
        {list.map((a) => (
          <div key={a.key} className={'badge ' + (a.unlocked ? 'unlocked' : 'locked')}>
            <div className="badge-emoji">{a.unlocked ? a.emoji : '🔒'}</div>
            <div className="badge-name">{a.name}</div>
            <div className="muted xsmall badge-desc">{a.desc}</div>
            <div className="bar thin">
              <div className="bar-fill" style={{ width: `${(a.current / a.target) * 100}%` }} />
            </div>
            <div className="muted xsmall">{a.current}/{a.target}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
