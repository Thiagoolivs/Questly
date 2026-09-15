import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Button, Card, Chip, Icon } from '../design-system/components/index.js'
import CheckControl from '../components/CheckControl.jsx'

const LONG_DATE = { weekday: 'long', day: '2-digit', month: 'long' }

function saudacao(h = new Date().getHours()) {
  if (h < 5) return 'Boa madrugada'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function hora(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function Secao({ title, action, children }) {
  return (
    <section style={{ marginBottom: 'var(--space-9)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-5)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-3)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

function Vazio({ children }) {
  return (
    <p
      style={{
        margin: 0,
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-body-sm)',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  )
}

export default function MeuDia() {
  const { user } = useApp()
  const [day, setDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDay(await api.today())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // As marcações são otimistas: o toque responde na hora e só volta atrás se o
  // servidor recusar. É o gesto mais repetido do app, não pode ter espera.
  const marcarHabito = async (habit, next) => {
    setDay((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === habit.id ? { ...h, completed: next } : h)),
    }))
    try {
      await api.logHabit(habit.id, { date: day.date, completed: next })
      await carregar()
    } catch (e) {
      setError(e.message)
      await carregar()
    }
  }

  const marcarPasso = async (routine, step, next) => {
    setDay((d) => ({
      ...d,
      routines: d.routines.map((r) =>
        r.id !== routine.id
          ? r
          : {
              ...r,
              steps: r.steps.map((s) => (s.id === step.id ? { ...s, done: next } : s)),
              done_count: r.done_count + (next ? 1 : -1),
            },
      ),
    }))
    try {
      await api.logRoutineStep(routine.id, { date: day.date, step_id: step.id, done: next })
      await carregar()
    } catch (e) {
      setError(e.message)
      await carregar()
    }
  }

  const alternarDescanso = async () => {
    try {
      if (day.rest_day) await api.removeRestDay(day.date)
      else await api.addRestDay({ date: day.date, reason: 'Descanso planejado' })
      await carregar()
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading && !day) return <div className="screen center muted">Carregando…</div>

  if (error && !day) {
    return (
      <div className="screen center" style={{ gap: 'var(--space-5)' }}>
        <p style={{ color: 'var(--danger)' }}>{error}</p>
        <Button onClick={carregar}>Tentar de novo</Button>
      </div>
    )
  }

  const { agenda = [], habits = [], routines = [], summary = {}, rest_day: descanso } = day || {}
  const data = day ? new Date(`${day.date}T12:00:00`) : new Date()
  const tudoFeito = summary.total > 0 && summary.pending === 0 && !descanso

  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-tertiary)',
              letterSpacing: 'var(--ls-caps)',
              textTransform: 'uppercase',
            }}
          >
            {data.toLocaleDateString('pt-BR', LONG_DATE)}
          </span>
          <h1
            style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-2)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            {saudacao()}
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
        </div>
        <Link to="/perfil" aria-label="Perfil">
          <Avatar name={user?.name} src={user?.photo} size={40} />
        </Link>
      </header>

      {/* O resumo é a única métrica da Home: o que falta hoje. */}
      <Card tone="bloom" pad="var(--pad-card-lg)" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-title-3)',
                fontWeight: 'var(--fw-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              {descanso
                ? 'Dia de descanso'
                : tudoFeito
                  ? 'Dia concluído'
                  : `${summary.pending} ${summary.pending === 1 ? 'item pendente' : 'itens pendentes'}`}
            </div>
            <div
              style={{
                marginTop: 2,
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {descanso
                ? 'Descanso planejado não conta como falha.'
                : summary.total === 0
                  ? 'Nada planejado ainda. Comece pelo Meu Plano.'
                  : `${summary.done} de ${summary.total} concluídos`}
            </div>
          </div>
          <Chip>Nível {summary.level ?? 1}</Chip>
        </div>
      </Card>

      <Secao
        title="Agenda"
        action={
          <Link
            to="/agenda"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--blue-glow)',
              textDecoration: 'none',
            }}
          >
            Ver tudo
          </Link>
        }
      >
        {agenda.length === 0 ? (
          <Vazio>Nada agendado para hoje.</Vazio>
        ) : (
          <Card pad="0 var(--pad-card)">
            {agenda.map((ev, i) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  padding: 'var(--pad-row) 0',
                  borderBottom: i < agenda.length - 1 ? '1px solid var(--line-hairline)' : 'none',
                }}
              >
                <span
                  style={{
                    width: 46,
                    flex: 'none',
                    fontFamily: 'var(--font-numeric)',
                    fontSize: 'var(--fs-body-sm)',
                    color: ev.start ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  }}
                >
                  {hora(ev.start) ?? '—'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {ev.title}
                  </div>
                  {(ev.duration_min || ev.category) && (
                    <div
                      style={{
                        marginTop: 2,
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-body-sm)',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      {[ev.category, ev.duration_min ? `${ev.duration_min} min` : null]
                        .filter(Boolean)
                        .join(' · ')}
                    </div>
                  )}
                </div>
                {ev.visibility === 'group' && <Icon name="users" size={15} color="var(--text-tertiary)" />}
              </div>
            ))}
          </Card>
        )}
      </Secao>

      <Secao title="Rotinas">
        {routines.length === 0 ? (
          <Vazio>Nenhuma rotina para hoje.</Vazio>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {routines.map((r) => (
              <Card key={r.id}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body)',
                      fontWeight: 'var(--fw-semibold)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {r.name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-numeric)',
                      fontSize: 'var(--fs-body-sm)',
                      color: r.completed ? 'var(--success)' : 'var(--text-tertiary)',
                    }}
                  >
                    {r.done_count}/{r.total_count}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {r.steps.map((step) => (
                    <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                      <CheckControl
                        checked={step.done}
                        round
                        size={20}
                        label={step.name}
                        onChange={(v) => marcarPasso(r, step, v)}
                      />
                      <span
                        style={{
                          flex: 1,
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--fs-body-sm)',
                          color: step.done ? 'var(--text-tertiary)' : 'var(--text-secondary)',
                          textDecoration: step.done ? 'line-through' : 'none',
                        }}
                      >
                        {step.name}
                      </span>
                      {step.duration_min ? (
                        <span
                          style={{
                            fontFamily: 'var(--font-numeric)',
                            fontSize: 'var(--fs-micro)',
                            color: 'var(--text-tertiary)',
                          }}
                        >
                          {step.duration_min} min
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Secao>

      <Secao title="Hábitos">
        {habits.length === 0 ? (
          <Vazio>Nenhum hábito para hoje.</Vazio>
        ) : (
          <Card pad="0 var(--pad-card)">
            {habits.map((h, i) => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  padding: 'var(--pad-row) 0',
                  borderBottom: i < habits.length - 1 ? '1px solid var(--line-hairline)' : 'none',
                }}
              >
                <CheckControl
                  checked={h.completed}
                  label={h.name}
                  onChange={(v) => marcarHabito(h, v)}
                />
                <span
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--fs-body)',
                    color: h.completed ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: h.completed ? 'line-through' : 'none',
                  }}
                >
                  {h.name}
                </span>
                {h.time ? (
                  <span
                    style={{
                      fontFamily: 'var(--font-numeric)',
                      fontSize: 'var(--fs-body-sm)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {h.time}
                  </span>
                ) : null}
              </div>
            ))}
          </Card>
        )}
      </Secao>

      {/* Registrar e desafiar-se são ações, não conteúdo: ficam no fim, fora do caminho. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)', marginBottom: 'var(--space-9)' }}>
        <Link to="/registrar" style={{ textDecoration: 'none' }}>
          <Button fullWidth iconLeft="plus">
            Registrar atividade
          </Button>
        </Link>
        <Link to="/desafio" style={{ textDecoration: 'none' }}>
          <Button fullWidth variant="secondary" iconLeft="target">
            Cumprir um desafio hoje
          </Button>
        </Link>
        <Button variant="ghost" iconLeft={descanso ? 'sun' : 'moon'} onClick={alternarDescanso} fullWidth>
          {descanso ? 'Cancelar descanso de hoje' : 'Marcar hoje como descanso'}
        </Button>
      </div>

      {error ? (
        <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
