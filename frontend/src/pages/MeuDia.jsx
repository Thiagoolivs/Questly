import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Button, Card, Chip, Icon, IconButton } from '../design-system/components/index.js'
import CheckControl from '../components/CheckControl.jsx'
import Confirmar from '../components/Confirmar.jsx'
import Compartilhar from '../components/Compartilhar.jsx'
import { useToast } from '../components/Toast.jsx'

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
  const { user, groupId } = useApp()
  const aviso = useToast()
  const [day, setDay] = useState(null)
  const [leitura, setLeitura] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [apagandoRegistro, setApagandoRegistro] = useState(null)
  const [resgates, setResgates] = useState(null)
  const [compartilhando, setCompartilhando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setDay(await api.today(null, groupId))
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // A leitura do dia é um extra e vem à parte: se a IA demorar ou falhar, o
  // Meu Dia já está na tela.
  useEffect(() => {
    api.insight().then((r) => setLeitura(r.text)).catch(() => {})
  }, [])

  // Dias salváveis: só carrega uma vez, e some da tela sozinho quando não há
  // nenhum. Recarregado junto de cada marcação porque fechar o dia muda a lista.
  const carregarResgates = useCallback(() => {
    api.rescues().then(setResgates).catch(() => {})
  }, [])

  useEffect(() => {
    carregarResgates()
  }, [carregarResgates])

  const salvarDia = async (dia) => {
    try {
      const r = await api.rescueDay({ date: dia })
      await carregar()
      carregarResgates()
      aviso({
        text: `Dia salvo — sequência de ${r.streak} ${r.streak === 1 ? 'dia' : 'dias'} de pé`,
        icon: 'flame',
        tone: 'success',
      })
    } catch (e) {
      setError(e.message)
    }
  }

  // As marcações são otimistas: o toque responde na hora e só volta atrás se o
  // servidor recusar. É o gesto mais repetido do app, não pode ter espera.
  const marcarHabito = async (habit, next) => {
    setDay((d) => ({
      ...d,
      habits: d.habits.map((h) => (h.id === habit.id ? { ...h, completed: next } : h)),
    }))
    try {
      const r = await api.logHabit(habit.id, { date: day.date, completed: next })
      await carregar()
      carregarResgates()
      if (next) anunciarGanho(r, habit.name)
      else aviso({
        text: `"${habit.name}" desmarcado`,
        icon: 'undo-2',
        onUndo: () => marcarHabito(habit, true),
      })
    } catch (e) {
      setError(e.message)
      await carregar()
    }
  }

  // Marcar e não ver nada acontecer é o que faz parar de marcar: o ponto ganho
  // e o marco de sequência à vista são a resposta imediata do app.
  const anunciarGanho = (r, nome) => {
    const marco = r.next_milestone
    const partes = [r.points ? `+${r.points} pts` : null]
    if (r.streak > 0) partes.push(`${r.streak} ${r.streak === 1 ? 'dia' : 'dias'} seguidos`)
    else if (marco) partes.push(`faltam ${marco.missing} para +${marco.points}`)
    aviso({
      text: `${nome} — ${partes.filter(Boolean).join(' · ')}`,
      icon: r.streak >= 3 ? 'flame' : 'check-circle',
      tone: 'success',
    })
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
      const r = await api.logRoutineStep(routine.id, { date: day.date, step_id: step.id, done: next })
      await carregar()
      carregarResgates()
      if (r.points) anunciarGanho(r, `${routine.name} fechada`)
      else if (!next) aviso({
        text: `"${step.name}" desmarcado`,
        icon: 'undo-2',
        onUndo: () => marcarPasso(routine, step, true),
      })
    } catch (e) {
      setError(e.message)
      await carregar()
    }
  }

  // Um registro errado (distância trocada, duplicado) travava a pontuação para
  // sempre: agora ele some e devolve o XP e os pontos exatos que deu.
  const apagarRegistro = async (registro) => {
    await api.deleteActivityRecord(registro.group_id ?? groupId, registro.id)
    await carregar()
    aviso({ text: 'Registro apagado — XP e pontos devolvidos', icon: 'trash' })
  }

  const alternarDescanso = async () => {
    const eraDescanso = day.rest_day
    try {
      if (eraDescanso) await api.removeRestDay(day.date)
      else await api.addRestDay({ date: day.date, reason: 'Descanso planejado' })
      await carregar()
      aviso({
        text: eraDescanso
          ? 'Descanso cancelado'
          : 'Hoje é descanso — não conta como falha e não quebra a sequência',
        icon: eraDescanso ? 'sun' : 'moon',
        onUndo: alternarDescanso,
      })
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

  const {
    agenda = [], habits = [], routines = [], records = [], summary = {},
    rest_day: descanso, training: treino, nutrition: nutricao,
  } = day || {}
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
      <Card tone="bloom" pad="var(--pad-card-lg)" data-tour="dia-resumo" style={{ marginBottom: 'var(--space-8)' }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
            <Chip>Nível {summary.level ?? 1}</Chip>
            {summary.streak > 0 && (
              <Chip>
                <Icon name="flame" size={13} color="var(--warning)" />
                <span style={{ marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
                  {summary.streak}
                </span>
              </Chip>
            )}
          </div>
        </div>

        {/* A sequência é o que dói perder — e era a única coisa do app que não
            aparecia em lugar nenhum do dia a dia. */}
        <Sequencia summary={summary} descanso={descanso} />
      </Card>

      <Resgate resgates={resgates} onSalvar={salvarDia} />

      {leitura && (
        <Card style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
            <Icon name="sparkles" size={16} color="var(--blue-glow)" />
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              {leitura}
            </p>
          </div>
        </Card>
      )}

      {/* Treino e alimentação são o que a pessoa executa no dia, então moram
          aqui. Planejar os dois é outro assunto, e é do Meu Plano. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-card)', marginBottom: 'var(--space-9)' }}>
        <CartaoTreino treino={treino} />
        <CartaoAlimentacao nutricao={nutricao} />
      </div>

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
                    fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
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
                      fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
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
                            fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
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
                      fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums',
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

      {records.length > 0 && (
        <Secao title="Registrado hoje">
          <Card pad="0 var(--pad-card)">
            {records.map((r, i) => (
              <div
                key={r.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-5)',
                  padding: 'var(--pad-row) 0',
                  borderBottom: i < records.length - 1 ? '1px solid var(--line-hairline)' : 'none',
                }}
              >
                <Icon name="activity" size={16} color="var(--blue-glow)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body)',
                      color: 'var(--text-primary)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {r.modality}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontFamily: 'var(--font-ui)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 'var(--fs-body-sm)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {resumoDoRegistro(r)}
                  </div>
                </div>
                <IconButton
                  icon="trash"
                  tone="bare"
                  label={`Apagar registro de ${r.modality}`}
                  size={32}
                  onClick={() => setApagandoRegistro(r)}
                />
              </div>
            ))}
          </Card>
        </Secao>
      )}

      {/* Registrar e desafiar-se são ações, não conteúdo: ficam no fim, fora do caminho. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-stack)', marginBottom: 'var(--space-9)' }}>
        <Link to="/registrar" data-tour="dia-registrar" style={{ textDecoration: 'none' }}>
          <Button fullWidth iconLeft="plus">
            Registrar atividade
          </Button>
        </Link>
        <Link to="/desafio" style={{ textDecoration: 'none' }}>
          <Button fullWidth variant="secondary" iconLeft="target">
            Cumprir um desafio hoje
          </Button>
        </Link>
        {/* O que a pessoa fez hoje só chega ao grupo se ela quiser: o botão
            existe, a publicação automática é outra coisa e vive nas opções. */}
        {summary.done > 0 && (
          <Button variant="ghost" iconLeft="send" onClick={() => setCompartilhando(true)} fullWidth>
            Compartilhar com o grupo
          </Button>
        )}
        <Button variant="ghost" iconLeft={descanso ? 'sun' : 'moon'} onClick={alternarDescanso} fullWidth>
          {descanso ? 'Cancelar descanso de hoje' : 'Marcar hoje como descanso'}
        </Button>
      </div>

      {error ? (
        <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          {error}
        </p>
      ) : null}

      <Compartilhar aberto={compartilhando} onFechar={() => setCompartilhando(false)} />

      {apagandoRegistro && (
        <Confirmar
          titulo="Apagar este registro?"
          descricao={`O XP e os pontos de ranking que ele rendeu voltam atrás (${apagandoRegistro.xp_earned} XP · ${apagandoRegistro.score_earned} pts). A publicação dele no feed sai junto.`}
          onConfirmar={() => apagarRegistro(apagandoRegistro)}
          onFechar={() => setApagandoRegistro(null)}
        />
      )}
    </div>
  )
}

/**
 * Salvar um dia que já passou.
 *
 * O descanso planejado só protege quem marcou antes — e ninguém planeja ficar
 * doente. Sem uma saída depois do fato, o primeiro tropeço zera a corrente, e é
 * aí que a maioria abandona. O cartão só aparece quando há dia salvável e cota,
 * e diz quantos restam para não virar um botão de "nunca falhei".
 */
function Resgate({ resgates, onSalvar }) {
  if (!resgates || resgates.left <= 0 || resgates.days.length === 0) return null
  const dia = resgates.days[resgates.days.length - 1]  // o mais recente
  const quando = new Date(`${dia.date}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long' })

  return (
    <Card style={{ marginBottom: 'var(--space-8)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
        <Icon name="flame" size={16} color="var(--warning)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            {quando} ficou com {dia.pending} {dia.pending === 1 ? 'item' : 'itens'} em aberto e cortou sua
            sequência. Dá para salvar esse dia — resta{resgates.left === 1 ? '' : 'm'} {resgates.left} neste mês.
          </p>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button variant="secondary" size="sm" iconLeft="undo-2" onClick={() => onSalvar(dia.date)}>
              Salvar {quando}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Descreve o registro pelos parâmetros que a pessoa informou. */
function resumoDoRegistro(r) {
  const p = r.params || {}
  return [
    p.distance ? `${p.distance} km` : null,
    p.duration ? `${p.duration} min` : null,
    p.rolas ? `${p.rolas} rolas` : null,
    p.series ? `${p.series} séries` : null,
    `+${r.xp_earned} XP`,
    r.score_earned ? `${r.score_earned} pts` : null,
  ].filter(Boolean).join(' · ')
}

/**
 * Sequência e próximo marco.
 *
 * O bônus por sequência só motiva se a pessoa souber que ele existe e quanto
 * falta — por isso o alvo aparece em número, não em frase de incentivo.
 */
function Sequencia({ summary, descanso }) {
  const dias = summary.streak ?? 0
  const marco = summary.next_milestone
  if (!dias && !marco) return null

  const recorde = summary.best_streak ?? 0
  const texto = dias === 0
    ? descanso
      ? 'Hoje é descanso — sua sequência fica de pé.'
      : recorde > 0
        ? `Sua melhor sequência foi ${recorde} ${recorde === 1 ? 'dia' : 'dias'}. Feche tudo de hoje para recomeçar.`
        : `Feche tudo de hoje para começar a sequência${marco ? ` (+${marco.points} pts em ${marco.days} dias)` : ''}.`
    : marco
      ? `${dias} ${dias === 1 ? 'dia seguido' : 'dias seguidos'} · faltam ${marco.missing} para +${marco.points} pts`
      : `${dias} dias seguidos — você já passou de todos os marcos.`

  const progresso = marco ? Math.min(100, Math.round((dias / marco.days) * 100)) : 100

  return (
    <div style={{ marginTop: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <Icon name="flame" size={14} color={dias > 0 ? 'var(--warning)' : 'var(--text-tertiary)'} />
        <span
          style={{
            flex: 1,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          {texto}
        </span>
        {/* O recorde fica visível enquanto a corrente atual não o alcança: é o
            número que sobrevive a uma queda e dá o que perseguir depois dela. */}
        {recorde > dias && dias > 0 ? (
          <span
            style={{
              flex: 'none',
              fontFamily: 'var(--font-ui)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--fs-micro)',
              color: 'var(--text-tertiary)',
            }}
          >
            recorde {recorde}
          </span>
        ) : null}
      </div>
      <div
        style={{
          marginTop: 'var(--space-4)',
          height: 4,
          borderRadius: 999,
          background: 'var(--surface-input)',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: `${progresso}%`, height: '100%', background: 'var(--warning)' }} />
      </div>
    </div>
  )
}

/**
 * Os dois cartões de destaque da Home.
 *
 * Gradiente e anel de progresso vêm do design system: um número grande, uma
 * linha de contexto e um caminho para a tela inteira. Sem plano/meta eles
 * viram convite, nunca um cartão vazio.
 */
const GRADIENTE_TREINO = 'linear-gradient(135deg, rgba(75,69,244,.38) 0%, rgba(75,69,244,.06) 62%, transparent 100%)'
const GRADIENTE_COMIDA = 'linear-gradient(135deg, rgba(255,122,24,.34) 0%, rgba(255,122,24,.05) 62%, transparent 100%)'

function CartaoDestaque({ to, gradiente, icone, cor, titulo, numero, unidade, linha, percent, acao }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>
      {/* O gradiente vai no fundo do próprio cartão: como filho absoluto ele
          parava na caixa de conteúdo e deixava a moldura do padding sem cor. */}
      <Card
        pad="var(--pad-card-lg)"
        style={{ height: '100%', background: `${gradiente}, var(--surface-card)` }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Icon name={icone} size={15} color={cor} />
            <span
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-micro)',
                letterSpacing: 'var(--ls-caps)',
                textTransform: 'uppercase',
                color: 'var(--text-secondary)',
              }}
            >
              {titulo}
            </span>
          </div>

          {numero != null ? (
            <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 'var(--fs-title-1)',
                  fontWeight: 'var(--fw-bold)',
                  lineHeight: 'var(--lh-tight)',
                  color: 'var(--text-primary)',
                }}
              >
                {numero}
              </span>
              {unidade ? (
                <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                  {unidade}
                </span>
              ) : null}
            </div>
          ) : null}

          <p
            style={{
              margin: numero != null ? '2px 0 0' : 'var(--space-4) 0 0',
              flex: 1,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            {linha}
          </p>

          {acao ? (
            <span
              style={{
                marginTop: 'var(--space-5)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body-sm)',
                fontWeight: 'var(--fw-medium)',
                color: cor,
              }}
            >
              {acao}
              <Icon name="chevron-right" size={14} color={cor} />
            </span>
          ) : (
            <div style={{ marginTop: 'var(--space-5)', height: 4, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, percent)}%`, height: '100%', background: cor }} />
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}

function CartaoTreino({ treino }) {
  if (!treino) {
    return (
      <CartaoDestaque
        to="/plano"
        gradiente={GRADIENTE_TREINO}
        icone="dumbbell"
        cor="var(--blue-glow)"
        titulo="Treino"
        linha="Nenhum plano ainda. A IA monta as semanas para você."
        acao="Montar plano"
      />
    )
  }
  const sessao = treino.today
  const linha = sessao
    ? sessao.status === 'done'
      ? `${sessao.title} — feito`
      : sessao.scheduled_for_today
        ? sessao.title
        : `Próxima: ${sessao.title}`
    : treino.logged_today
      ? 'Plano concluído. Atividade registrada hoje.'
      : 'Plano concluído.'
  return (
    <CartaoDestaque
      to="/treino"
      gradiente={GRADIENTE_TREINO}
      icone="dumbbell"
      cor="var(--blue-glow)"
      titulo="Treino"
      numero={treino.done}
      unidade={`/${treino.total}`}
      linha={linha}
      percent={treino.percent}
    />
  )
}

function CartaoAlimentacao({ nutricao }) {
  if (!nutricao) {
    return (
      <CartaoDestaque
        to="/plano"
        gradiente={GRADIENTE_COMIDA}
        icone="utensils"
        cor="var(--data-nutrition)"
        titulo="Alimentação"
        linha="Sem metas ainda. Complete o perfil para calculá-las."
        acao="Definir metas"
      />
    )
  }
  const meta = nutricao.calories_goal || 0
  const pct = meta ? Math.round((nutricao.calories / meta) * 100) : 0
  return (
    <CartaoDestaque
      to="/nutricao"
      gradiente={GRADIENTE_COMIDA}
      icone="utensils"
      cor="var(--data-nutrition)"
      titulo="Alimentação"
      numero={nutricao.calories}
      unidade={meta ? `/${meta}` : 'kcal'}
      linha={
        nutricao.meals === 0
          ? 'Nada registrado hoje.'
          : `${nutricao.protein_g}g de proteína · ${nutricao.water_l} L de água`
      }
      percent={pct}
    />
  )
}
