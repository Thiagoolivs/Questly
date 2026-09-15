import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import RadarChart, { RADAR_COLORS } from '../components/RadarChart.jsx'
import { Card, Icon, Button } from '../design-system/components/index.js'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Historico() {
  const { groupId, viewId } = useApp()
  const [data, setData] = useState(null)
  const [radar, setRadar] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    if (!groupId || !viewId) return
    setData(null)
    api.history(groupId, viewId).then(setData).catch((e) => setErr(e.message))
  }, [groupId, viewId])

  useEffect(() => {
    if (!groupId) return
    api.radar(groupId).then(setRadar).catch(() => {})
  }, [groupId])

  if (err) return <div className="screen center error" style={{ padding: 'var(--space-6)', color: 'var(--error)' }}>{err}</div>
  if (!data) return <div className="screen center muted" style={{ padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>Carregando…</div>

  const { stats, calendar } = data

  const cells = []
  if (calendar.length) {
    const first = new Date(calendar[0].date + 'T00:00')
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
  }
  calendar.forEach((d) => cells.push(d))

  const maxPts = Math.max(120, ...calendar.map((d) => d.max_points))

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'calc(var(--tab-bar-height) + var(--space-8))' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Histórico
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Acompanhe a sua evolução.
        </p>
      </header>
      
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <PlayerSwitch />
      </div>

      <Link to="/mural" style={{ display: 'block', textDecoration: 'none', marginBottom: 'var(--space-6)' }}>
        <Button variant="secondary" block>
          <Icon name="image" size={16} /> Mural de fotos & retrospectiva
        </Button>
      </Link>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {radar && radar.members.length > 0 && (
          <Card padding="md">
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Radar por área</div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart categories={radar.categories} emojis={radar.emojis} members={radar.members} size={280} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', justifyContent: 'center', marginTop: 'var(--space-4)' }}>
              {radar.members.map((m, i) => (
                <span key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                  <i style={{ width: 8, height: 8, borderRadius: '50%', background: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                  {m.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        <Card padding="md">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div style={{ textAlign: 'center', background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{stats.completed_days}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>concluídos</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{stats.perfect_days}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>perfeitos</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{stats.best_streak}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>maior seq.</div>
            </div>
            <div style={{ textAlign: 'center', background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>{stats.completion_pct}%</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>conclusão</div>
            </div>
          </div>
        </Card>

        <Card padding="md">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Desempenho (pontos/dia)</div>
          {calendar.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>Ainda sem dias registrados.</p>
          ) : (
            <div className="chart" style={{ display: 'flex', alignItems: 'flex-end', height: 120, gap: 4, overflowX: 'auto', paddingBottom: 'var(--space-2)' }}>
              {calendar.map((d) => (
                <div key={d.date} title={`Dia ${d.day_number}: ${d.points} pts`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 20 }}>
                  <div style={{ flex: 1, width: '100%', position: 'relative', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                    <div
                      style={{ 
                        position: 'absolute', bottom: 0, left: 0, right: 0, 
                        height: `${(d.points / maxPts) * 100}%`,
                        background: d.perfect ? 'var(--blue-glow)' : d.completed ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    />
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-tertiary)', marginTop: 4 }}>{d.day_number}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card padding="md">
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>Calendário</div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8 }}>
            {WEEKDAYS.map((w) => (
              <div key={w} style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{w}</div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {cells.map((d, i) =>
              d === null ? (
                <div key={'e' + i} style={{ aspectRatio: '1', background: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', opacity: 0.5 }} />
              ) : (
                <div
                  key={d.date}
                  style={{ 
                    aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: d.perfect ? 'rgba(0,122,255,0.1)' : d.completed ? 'var(--text-primary)' : d.points > 0 ? 'var(--surface-sunken)' : 'transparent',
                    border: d.points === 0 ? '1px dashed var(--line-hairline)' : 'none',
                    color: d.perfect ? 'var(--blue-glow)' : d.completed ? 'var(--surface-overlay)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)', position: 'relative'
                  }}
                  title={`${d.points} pts`}
                >
                  <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)' }}>
                    {new Date(d.date + 'T00:00').getDate()}
                  </span>
                  {d.perfect && (
                    <span style={{ position: 'absolute', top: -4, right: -4, color: 'var(--blue-glow)', background: 'var(--surface-overlay)', borderRadius: '50%', padding: 2 }}>
                      <Icon name="star" size={10} fill="currentColor" />
                    </span>
                  )}
                </div>
              ),
            )}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-glow)' }} /> Perfeito</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)' }} /> Concluído</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--surface-sunken)' }} /> Parcial</span>
          </div>
        </Card>
      </div>
    </div>
  )
}
