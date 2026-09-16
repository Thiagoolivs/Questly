import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import { Card, Icon } from '../design-system/components/index.js'
import VoltarPara from '../components/VoltarPara.jsx'

export default function Conquistas() {
  const { groupId, viewId } = useApp()
  const [list, setList] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!groupId || !viewId) return
    setList(null)
    api.achievements(groupId, viewId).then((d) => setList(d.achievements)).catch((e) => setErr(e.message))
  }, [groupId, viewId])

  if (err) return <div className="screen center error" style={{ padding: 'var(--space-6)', color: 'var(--danger)' }}>{err}</div>
  if (!list) return <div className="screen center muted" style={{ padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>Carregando…</div>

  const unlocked = list.filter((a) => a.unlocked).length

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'calc(var(--space-11) + var(--space-8))' }}>
      {/* Cabeçalho numa linha só: voltar, título, e o contador à direita. Antes
          havia um flex dentro do flex empurrando o contador para cima do
          título em telas estreitas. */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <VoltarPara para="/plano" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            Conquistas
          </h1>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            {unlocked} de {list.length} desbloqueadas
          </p>
        </div>
        <span
          style={{
            flex: 'none',
            fontFamily: 'var(--font-ui)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--blue-glow)',
            background: 'var(--surface-accent-soft)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {unlocked}/{list.length}
        </span>
      </header>

      <PlayerSwitch />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
        {list.map((a) => (
          <Card key={a.key} style={{ 
            opacity: a.unlocked ? 1 : 0.6,
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            border: a.unlocked ? '1px solid var(--blue-glow)' : '1px solid transparent'
          }}>
            <div style={{ 
              width: 56, height: 56, borderRadius: 28, 
              background: a.unlocked ? 'var(--blue-glow)' : 'var(--surface-input)', 
              color: a.unlocked ? '#fff' : 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 'var(--space-3)'
            }}>
              <Icon name={a.unlocked ? 'award' : 'lock'} size={28} />
            </div>
            
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{a.name}</div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', flex: 1 }}>{a.desc}</div>
            
            <div style={{ width: '100%' }}>
              <div style={{ height: 4, background: 'var(--surface-input)', borderRadius: 2, overflow: 'hidden', marginBottom: 'var(--space-1)' }}>
                <div style={{ height: '100%', background: a.unlocked ? 'var(--blue-glow)' : 'var(--text-tertiary)', width: `${Math.min(100, (a.current / a.target) * 100)}%` }} />
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                {a.current}/{a.target}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
