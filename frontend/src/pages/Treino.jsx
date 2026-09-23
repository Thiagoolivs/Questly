import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton, Input, Select } from '../design-system/components/index.js'
import CheckControl from '../components/CheckControl.jsx'
import Sheet from '../components/Sheet.jsx'
import Confirmar from '../components/Confirmar.jsx'
import { useToast } from '../components/Toast.jsx'

const MODALIDADES = [
  { value: 'jiu-jitsu', label: 'Jiu-Jitsu' },
  { value: 'academia', label: 'Academia' },
  { value: 'corrida', label: 'Corrida' },
  { value: 'danca', label: 'Dança' },
  { value: 'funcional', label: 'Funcional' },
  { value: 'natacao', label: 'Natação' },
  { value: 'ciclismo', label: 'Ciclismo' },
  { value: 'yoga', label: 'Yoga' },
]

const NIVEIS = [
  { value: 'iniciante', label: 'Iniciante' },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado', label: 'Avançado' },
]

export default function Treino() {
  const navigate = useNavigate()
  const aviso = useToast()
  const [planos, setPlanos] = useState([])
  const [iaLigada, setIaLigada] = useState(false)
  const [aberto, setAberto] = useState(null)
  const [criando, setCriando] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [apagando, setApagando] = useState(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const { plans, ai_enabled } = await api.trainingPlans()
      setPlanos(plans)
      setIaLigada(ai_enabled)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const abrir = async (id) => {
    try {
      setAberto(await api.trainingPlan(id))
    } catch (e) {
      setErro(e.message)
    }
  }

  // Plano abandonado sem como sumir vira lixo permanente na tela do Meu Plano.
  const apagarPlano = async (plano) => {
    await api.deleteTrainingPlan(plano.id)
    setAberto(null)
    await carregar()
    aviso({ text: 'Plano apagado', icon: 'trash' })
  }

  if (aberto) {
    return (
      <>
        <DetalheDoPlano
          plano={aberto}
          onVoltar={() => { setAberto(null); carregar() }}
          onAtualizar={setAberto}
          onErro={setErro}
          onApagar={() => setApagando(aberto)}
          aviso={aviso}
          iaLigada={iaLigada}
        />
        {apagando && (
          <Confirmar
            titulo="Apagar este plano?"
            descricao="As sessões e o que já foi marcado nelas vão junto. As atividades que você registrou continuam no seu histórico."
            onConfirmar={() => apagarPlano(apagando)}
            onFechar={() => setApagando(null)}
          />
        )}
      </>
    )
  }

  return (
    <Tela titulo="Treino" onVoltar={() => navigate('/plano')}>
      {!iaLigada && (
        <Card>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Icon name="info" size={16} color="var(--warning)" />
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
              A geração de planos precisa de IA configurada neste ambiente.
            </p>
          </div>
        </Card>
      )}

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      {carregando ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--fs-body-sm)' }}>Carregando…</p>
      ) : planos.length === 0 ? (
        <Card tone="bloom" pad="var(--pad-card-lg)">
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-3)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            Nenhum plano ainda
          </h2>
          <p
            style={{
              margin: 'var(--space-4) 0 var(--space-6)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-secondary)',
            }}
          >
            Diga a modalidade e o objetivo. O plano volta pronto em semanas e
            sessões, com checklist — não é conversa, é o que fazer.
          </p>
          <Button variant="accent" iconLeft="sparkles" disabled={!iaLigada} onClick={() => setCriando(true)}>
            Montar meu plano
          </Button>
        </Card>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {planos.map((p) => (
              <Card key={p.id} onClick={() => abrir(p.id)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-body)',
                        fontWeight: 'var(--fw-semibold)',
                        color: 'var(--text-primary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {p.modality}
                    </div>
                    {p.goal && (
                      <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                        {p.goal}
                      </div>
                    )}
                  </div>
                  <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
                </div>
                <Barra percent={p.progress.percent} />
                <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                  {p.progress.done} de {p.progress.total} sessões · {p.weeks} semanas
                </div>
              </Card>
            ))}
          </div>

          <Button variant="secondary" fullWidth iconLeft="plus" disabled={!iaLigada} onClick={() => setCriando(true)}>
            Novo plano
          </Button>
        </>
      )}

      {criando && (
        <NovoPlano
          onFechar={() => setCriando(false)}
          onCriado={(p) => { setCriando(false); carregar(); setAberto(p) }}
        />
      )}
    </Tela>
  )
}

function Barra({ percent }) {
  return (
    <div
      style={{
        marginTop: 'var(--space-5)',
        height: 6,
        borderRadius: 999,
        background: 'var(--surface-input)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          background: 'var(--blue-glow)',
          transition: 'width var(--dur-base) var(--ease-out)',
        }}
      />
    </div>
  )
}

function DetalheDoPlano({ plano, onVoltar, onAtualizar, onErro, onApagar, aviso, iaLigada }) {
  const [adaptando, setAdaptando] = useState(false)

  // Fechar a sessão inteira (e reabrir) num toque: marcar item por item para
  // depois descobrir que marcou a sessão errada não tinha volta nenhuma.
  const mudarStatus = async (sessao, status) => {
    try {
      const r = await api.updateTrainingSession(sessao.id, { status })
      onAtualizar({
        ...plano,
        progress: r.plan?.progress ?? plano.progress,
        sessions: plano.sessions.map((x) =>
          x.id === sessao.id ? { ...x, items: r.items, status: r.status } : x,
        ),
      })
      aviso?.({
        text: status === 'done' ? `${sessao.title} concluída` : `${sessao.title} reaberta`,
        icon: status === 'done' ? 'check-circle' : 'undo-2',
        tone: status === 'done' ? 'success' : undefined,
        onUndo: () => mudarStatus(sessao, status === 'done' ? 'pending' : 'done'),
      })
    } catch (e) {
      onErro(e.message)
    }
  }

  const marcar = async (sessao, indice, valor) => {
    try {
      const r = await api.toggleTrainingItem(sessao.id, { item_index: indice, done: valor })
      onAtualizar({
        ...plano,
        progress: r.plan.progress,
        sessions: plano.sessions.map((x) =>
          x.id === sessao.id ? { ...x, items: r.items, status: r.status } : x,
        ),
      })
    } catch (e) {
      onErro(e.message)
    }
  }

  const semanas = [...new Set(plano.sessions.map((x) => x.week))].sort((a, b) => a - b)

  return (
    <Tela titulo={plano.modality} onVoltar={onVoltar} capitalizar>
      <Card tone="bloom" pad="var(--pad-card-lg)">
        {plano.goal && (
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
            {plano.goal}
          </div>
        )}
        <Barra percent={plano.progress.percent} />
        <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Chip>{plano.progress.done}/{plano.progress.total} sessões</Chip>
          <Chip>{NIVEIS.find((n) => n.value === plano.level)?.label ?? plano.level}</Chip>
        </div>
      </Card>

      {plano.notes && (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            {plano.notes}
          </p>
        </Card>
      )}

      {semanas.map((semana) => (
        <div key={semana}>
          <h2
            style={{
              margin: '0 0 var(--space-4)',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-micro)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: 'var(--ls-caps)',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Semana {semana}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
            {plano.sessions
              .filter((x) => x.week === semana)
              .map((sessao) => (
                <Card key={sessao.id} style={{ opacity: sessao.status === 'done' ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: 'var(--fs-body)',
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {sessao.title}
                      </div>
                      {(sessao.focus || sessao.duration_min) && (
                        <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                          {[sessao.focus, sessao.duration_min ? `${sessao.duration_min} min` : null].filter(Boolean).join(' · ')}
                        </div>
                      )}
                    </div>
                    <IconButton
                      icon={sessao.status === 'done' ? 'undo-2' : 'check-circle'}
                      tone="bare"
                      size={32}
                      label={sessao.status === 'done' ? 'Reabrir sessão' : 'Concluir sessão'}
                      onClick={() => mudarStatus(sessao, sessao.status === 'done' ? 'pending' : 'done')}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                    {sessao.items.map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
                        <CheckControl
                          checked={!!item.done}
                          round
                          size={20}
                          label={item.name}
                          onChange={(v) => marcar(sessao, i, v)}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontFamily: 'var(--font-ui)',
                              fontSize: 'var(--fs-body-sm)',
                              color: item.done ? 'var(--text-tertiary)' : 'var(--text-primary)',
                              textDecoration: item.done ? 'line-through' : 'none',
                            }}
                          >
                            {item.name}
                          </div>
                          {item.detail && (
                            <div style={{ marginTop: 1, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
                              {item.detail}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
          </div>
        </div>
      ))}

      {/* Plano que não se ajusta é abandonado; ajustar é mais barato que recomeçar. */}
      <Button variant="secondary" fullWidth iconLeft="wand" disabled={!iaLigada} onClick={() => setAdaptando(true)}>
        Pedir ajuste à IA
      </Button>

      <Button variant="ghost" fullWidth iconLeft="trash" onClick={onApagar}>
        Apagar plano
      </Button>

      {adaptando && (
        <Adaptar
          plano={plano}
          onFechar={() => setAdaptando(false)}
          onPronto={(p) => { setAdaptando(false); onAtualizar(p) }}
          onErro={onErro}
        />
      )}
    </Tela>
  )
}

function Adaptar({ plano, onFechar, onPronto, onErro }) {
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const enviar = async () => {
    if (ocupado || texto.trim().length < 3) return
    setOcupado(true)
    try {
      onPronto(await api.adaptTrainingPlan(plano.id, { feedback: texto.trim() }))
    } catch (e) {
      onErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Ajustar o plano"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={enviar} disabled={ocupado || texto.trim().length < 3}>
            {ocupado ? 'Ajustando…' : 'Ajustar'}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
        Conte o que não está encaixando. O que você já concluiu é preservado —
        só o que falta é remontado.
      </p>
      <Input
        label="O que ajustar"
        placeholder="Está pesado demais, meu joelho doeu, só tenho 40 min…"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        autoFocus
      />
    </Sheet>
  )
}

function NovoPlano({ onFechar, onCriado }) {
  const [modalidade, setModalidade] = useState('jiu-jitsu')
  const [objetivo, setObjetivo] = useState('')
  const [nivel, setNivel] = useState('iniciante')
  const [dias, setDias] = useState('3')
  const [semanas, setSemanas] = useState('4')
  const [restricoes, setRestricoes] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const gerar = async () => {
    if (ocupado) return
    setOcupado(true)
    setErro('')
    try {
      onCriado(
        await api.createTrainingPlan({
          modality: modalidade,
          goal: objetivo.trim() || null,
          level: nivel,
          days_per_week: Number(dias) || 3,
          weeks: Number(semanas) || 4,
          constraints: restricoes.trim() || null,
        }),
      )
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Montar plano"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={gerar} disabled={ocupado}>
            {ocupado ? 'Montando…' : 'Gerar plano'}
          </Button>
        </>
      }
    >
      <Select label="Modalidade" value={modalidade} onChange={(e) => setModalidade(e.target.value)} options={MODALIDADES} />
      <Input
        label="Objetivo"
        placeholder="Passar a guarda, correr 10k, ganhar força…"
        value={objetivo}
        onChange={(e) => setObjetivo(e.target.value)}
      />
      <Select label="Nível" value={nivel} onChange={(e) => setNivel(e.target.value)} options={NIVEIS} />
      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1 }}>
          <Input label="Dias por semana" type="number" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Input label="Semanas" type="number" inputMode="numeric" value={semanas} onChange={(e) => setSemanas(e.target.value)} />
        </div>
      </div>
      <Input
        label="Restrições (opcional)"
        placeholder="Joelho sensível, só treino de manhã…"
        value={restricoes}
        onChange={(e) => setRestricoes(e.target.value)}
      />
      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}

function Tela({ titulo, onVoltar, capitalizar, children }) {
  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        paddingBottom: 'var(--space-11)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
        <IconButton icon="arrow-left" label="Voltar" onClick={onVoltar} />
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
            textTransform: capitalizar ? 'capitalize' : 'none',
          }}
        >
          {titulo}
        </h1>
      </header>
      {children}
    </div>
  )
}
