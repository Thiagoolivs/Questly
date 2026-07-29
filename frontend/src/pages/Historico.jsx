import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import RadarChart, { RADAR_COLORS } from '../components/RadarChart.jsx'
import Icon from '../components/Icon.jsx'

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

  if (err) return <div className="screen center error">{err}</div>
  if (!data) return <div className="screen center muted">Carregando…</div>

  const { stats, calendar } = data

  // alinhamento do calendário por dia da semana
  const cells = []
  if (calendar.length) {
    const first = new Date(calendar[0].date + 'T00:00')
    for (let i = 0; i < first.getDay(); i++) cells.push(null)
  }
  calendar.forEach((d) => cells.push(d))

  const maxPts = Math.max(120, ...calendar.map((d) => d.max_points))

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Histórico</div>
      </header>
      <PlayerSwitch />

      <Link to="/mural" className="btn ghost full config-link icon-btn"><Icon name="image" size={15} /> Mural de fotos &amp; retrospectiva</Link>

      {/* Radar por área */}
      {radar && radar.members.length > 0 && (
        <section className="card center">
          <div className="card-title self-start">Radar por área</div>
          <RadarChart categories={radar.categories} emojis={radar.emojis} members={radar.members} />
          <div className="radar-legend">
            {radar.members.map((m, i) => (
              <span className="radar-legend-item" key={m.id}>
                <i className="radar-dot" style={{ background: RADAR_COLORS[i % RADAR_COLORS.length] }} />
                {m.name}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="stat-grid four">
          <div className="stat-box"><div className="stat-value">{stats.completed_days}</div><div className="muted xsmall">concluídos</div></div>
          <div className="stat-box"><div className="stat-value">{stats.perfect_days}</div><div className="muted xsmall">perfeitos</div></div>
          <div className="stat-box"><div className="stat-value">{stats.best_streak}</div><div className="muted xsmall">maior seq.</div></div>
          <div className="stat-box"><div className="stat-value">{stats.completion_pct}%</div><div className="muted xsmall">conclusão</div></div>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Desempenho (pontos/dia)</div>
        {calendar.length === 0 ? (
          <p className="muted small">Ainda sem dias registrados.</p>
        ) : (
          <div className="chart">
            {calendar.map((d) => (
              <div className="chart-col" key={d.date} title={`Dia ${d.day_number}: ${d.points} pts`}>
                <div className="chart-bar-wrap">
                  <div
                    className={'chart-bar ' + (d.perfect ? 'perfect' : d.completed ? 'ok' : '')}
                    style={{ height: `${(d.points / maxPts) * 100}%` }}
                  />
                </div>
                <div className="chart-x">{d.day_number}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-title">Calendário</div>
        <div className="cal-head">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-wd">{w}</div>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((d, i) =>
            d === null ? (
              <div key={'e' + i} className="cal-cell empty" />
            ) : (
              <div
                key={d.date}
                className={'cal-cell ' + (d.perfect ? 'perfect' : d.completed ? 'completed' : d.points > 0 ? 'partial' : '')}
                title={`${d.points} pts`}
              >
                <span className="cal-day">{new Date(d.date + 'T00:00').getDate()}</span>
                {d.perfect && <span className="cal-star">⭐</span>}
              </div>
            ),
          )}
        </div>
        <div className="legend">
          <span><i className="dot perfect" /> Perfeito</span>
          <span><i className="dot completed" /> Concluído</span>
          <span><i className="dot partial" /> Parcial</span>
        </div>
      </section>
    </div>
  )
}
