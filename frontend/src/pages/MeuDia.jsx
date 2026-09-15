import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Card, Chip, Icon, ListRow } from '../design-system/components/index.js'

export default function MeuDia() {
  const { state, me, user, refresh, loading, error } = useApp()
  const [busy, setBusy] = useState(false)

  // Data for today
  const [routines, setRoutines] = useState([])
  const [habits, setHabits] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    loadDayData()
  }, [])

  async function loadDayData() {
    setBusy(true)
    try {
      const [rs, hs, es] = await Promise.all([
        api.routines(),
        api.habits(),
        api.calendar()
      ])
      setRoutines(rs.routines || [])
      setHabits(hs.habits || [])
      setEvents(es.activities || [])
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="screen center muted">Carregando…</div>
  if (error) return <div className="screen center"><p className="error">Erro ao carregar</p><button className="btn btn-primary" onClick={refresh}>Tentar de novo</button></div>
  if (!user) return <div className="screen center muted">Sem dados do usuário.</div>

  const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

  const toggleHabit = async (h) => {
    // Optimistic update
    const previousHabits = [...habits]
    const updated = habits.map(x => x.id === h.id ? { ...x, completed: !x.completed } : x)
    setHabits(updated)
    try {
      await api.updateHabit(h.id, { active: true }) 
    } catch (e) {
      setHabits(previousHabits)
      console.error(e)
    }
  }

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)' }}>
      {/* HEADER SIMPLIFICADO */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', fontWeight: 'var(--fw-bold)', color: 'var(--text-tertiary)', letterSpacing: 'var(--ls-caps)', textTransform: 'uppercase' }}>
            {todayStr}
          </span>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            O que fazer hoje
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          {me?.stats?.streak > 0 && (
            <Chip icon="flame" label={me.stats.streak.toString()} variant="glass" />
          )}
          <Link to="/perfil">
            <Avatar name={user?.name} src={user?.photo} size={40} />
          </Link>
        </div>
      </header>

      {/* AGENDA */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon name="calendar" size={18} color="var(--blue-glow)" /> Agenda do dia
        </h2>
        {events.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-body)' }}>Nada agendado para hoje.</p>
        ) : (
          <Card padding="none">
            {events.map((ev, i) => (
              <ListRow
                key={ev.id}
                title={ev.title}
                subtitle={ev.description}
                left={<div style={{ width: 44, textAlign: 'center', color: 'var(--text-secondary)', fontFamily: 'var(--font-numeric)' }}>
                  {ev.start_datetime ? new Date(ev.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Dia'}
                </div>}
                borderBottom={i < events.length - 1}
              />
            ))}
          </Card>
        )}
      </div>

      {/* HÁBITOS */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon name="check-circle" size={18} color="var(--success)" /> Hábitos
        </h2>
        {habits.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-body)' }}>Nenhum hábito configurado.</p>
        ) : (
          <Card padding="none">
            {habits.map((h, i) => (
              <div key={h.id} style={{ borderBottom: i < habits.length - 1 ? '1px solid var(--line-hairline)' : 'none' }}>
                <button
                  onClick={() => toggleHabit(h)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 'var(--space-4)', padding: 'var(--pad-row)',
                    background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                    opacity: h.completed ? 0.5 : 1
                  }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 'var(--radius-sm)', border: h.completed ? 'none' : '1px solid var(--text-tertiary)',
                    background: h.completed ? 'var(--success)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {h.completed && <Icon name="check" size={16} color="#000" />}
                  </div>
                  <div style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)', textDecoration: h.completed ? 'line-through' : 'none' }}>
                    {h.name}
                  </div>
                </button>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* ROTINAS */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h2 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Icon name="list-todo" size={18} color="var(--warning)" /> Rotinas
        </h2>
        {routines.length === 0 ? (
          <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-body)' }}>Nenhuma rotina para hoje.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {routines.map(r => (
              <Card key={r.id}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', marginBottom: 'var(--space-4)' }}>
                  {r.name}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {r.steps?.map(step => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '1px solid var(--text-tertiary)' }} />
                      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                        {step.name}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* DESAFIO DIÁRIO CTA */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <Card variant="bloom" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--pad-card-lg)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
              Desafio Diário
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
              Supere seus limites hoje
            </span>
          </div>
          <button style={{
            background: 'var(--surface-inverse)', color: 'var(--text-on-light)', border: 'none',
            borderRadius: 'var(--radius-pill)', padding: 'var(--space-3) var(--space-5)',
            fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', fontWeight: 'var(--fw-semibold)', cursor: 'pointer'
          }}>
            Cumprir
          </button>
        </Card>
      </div>

    </div>
  )
}
