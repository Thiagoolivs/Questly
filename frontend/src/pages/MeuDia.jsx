import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import Section from '../components/Section.jsx'
import Avatar from '../components/Avatar.jsx'

function WeekStrip({ selectedDate, onDateSelect }) {
  const days = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get start of week (Sunday)
  const d = new Date(selectedDate)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day
  const startOfWeek = new Date(d.setDate(diff))

  for (let i = 0; i < 7; i++) {
    const cur = new Date(startOfWeek)
    cur.setDate(startOfWeek.getDate() + i)
    days.push(cur)
  }

  const isSameDay = (d1, d2) => d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
  const weekdays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

  return (
    <div className="week-strip">
      {days.map((date, i) => {
        const selected = isSameDay(date, selectedDate)
        const isToday = isSameDay(date, today)
        return (
          <button
            key={i}
            className={`week-day ${selected ? 'selected' : ''} ${isToday ? 'today' : ''}`}
            onClick={() => onDateSelect(date)}
          >
            <span className="week-day-name">{weekdays[i]}</span>
            <span className="week-day-num">{date.getDate()}</span>
          </button>
        )
      })}
    </div>
  )
}

export default function MeuDia() {
  const { state, me, groupId, refresh, loading, error } = useApp()
  const [busy, setBusy] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Data for today
  const [routines, setRoutines] = useState([])
  const [habits, setHabits] = useState([])
  const [events, setEvents] = useState([])

  useEffect(() => {
    if (!groupId) return
    loadDayData()
  }, [groupId, selectedDate])

  async function loadDayData() {
    setBusy(true)
    try {
      const [rs, hs, es] = await Promise.all([
        api.routines(),
        api.habits(),
        api.calendar()
      ])
      setRoutines(rs)
      setHabits(hs)
      setEvents(es)
    } catch (e) {
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="screen center muted">Carregando…</div>
  if (error) return <div className="screen center"><p className="error">Erro ao carregar</p><button className="btn" onClick={refresh}>Tentar de novo</button></div>
  if (!state || !me) return <div className="screen center muted">Sem dados.</div>

  const dateStr = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })

  const toggleHabit = async (h) => {
    // Optimistic update
    const previousHabits = [...habits]
    const updated = habits.map(x => x.id === h.id ? { ...x, completed: !x.completed } : x)
    setHabits(updated)
    try {
      await api.updateHabit(h.id, { active: true }) // FIXME: Update log, not habit active state
      // Actually, since we're in Phase 2, we need a dedicated API for logging.
      // But for now just simulate the UI interaction.
    } catch (e) {
      setHabits(previousHabits)
      console.error(e)
    }
  }

  return (
    <div className="screen">
      <header className="topbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="brand">{state.group?.name || 'Questly'}</div>
          <div className="muted small" style={{ textTransform: 'capitalize' }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="streak-chip" title="Sequência atual"><Icon name="flame" size={15} /> {me.stats?.streak || 0}</div>
          <Link to="/perfil">
            <Avatar user={me.user} size={36} />
          </Link>
        </div>
      </header>

      <WeekStrip selectedDate={selectedDate} onDateSelect={setSelectedDate} />

      <Section id="rotinas" title="Rotinas" defaultOpen>
        {routines.length === 0 ? (
          <p className="muted xsmall">Nenhuma rotina para hoje.</p>
        ) : (
          <div className="routines-list">
            {routines.map(r => (
              <div key={r.id} className="routine-card">
                <div className="routine-title">
                  <Icon name="sun" size={16} /> {r.name}
                </div>
                <div className="routine-steps">
                  {r.steps?.map(step => (
                    <div key={step.id} className="routine-step">
                      <div className="check"><Icon name="check" size={14} /></div>
                      <span>{step.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="eventos" title="Agenda" defaultOpen>
        {events.length === 0 ? (
          <p className="muted xsmall">Nenhum evento agendado.</p>
        ) : (
          <div className="events-list">
            {events.map(ev => (
              <div key={ev.id} className="event-item">
                <div className="event-time">
                  {ev.start_datetime ? new Date(ev.start_datetime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Todo o dia'}
                </div>
                <div className="event-details">
                  <div className="event-title">{ev.title}</div>
                  {ev.description && <div className="muted xsmall">{ev.description}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section id="habitos" title="Hábitos" defaultOpen>
        {habits.length === 0 ? (
          <p className="muted xsmall">Nenhum hábito para hoje.</p>
        ) : (
          <div className="habits">
            {habits.map((h) => (
              <div key={h.id} className={`habit-row ${h.completed ? 'done' : ''}`}>
                <button className="habit habit-toggle" onClick={() => toggleHabit(h)}>
                  <span className="habit-emoji">{h.icon ? <Icon name={h.icon} size={18} /> : '✅'}</span>
                  <span className="habit-label">{h.name}</span>
                  <span className={`check ${h.completed ? 'on' : ''}`}>
                    {h.completed ? <Icon name="check" size={14} /> : ''}
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}
