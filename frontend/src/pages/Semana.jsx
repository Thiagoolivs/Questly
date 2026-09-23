import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton } from '../design-system/components/index.js'

/**
 * Retrospectiva da semana.
 *
 * Sem um momento em que o app diz o que aconteceu, a semana boa passa igual à
 * ruim: o esforço fica todo em check diário e nunca vira história. Esta tela é
 * esse momento — números da semana fechada, a anterior ao lado para comparar, e
 * uma frase que não finge que foi ótimo quando não foi.
 */
const DIA_MES = { day: '2-digit', month: 'short' }

const dataCurta = (iso) => new Date(`${iso}T12:00`).toLocaleDateString('pt-BR', DIA_MES)

/** Segunda-feira da semana de uma data (ISO local, sem passar por UTC). */
function segundaDe(iso) {
  const d = new Date(`${iso}T12:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function deslocar(iso, dias) {
  const d = new Date(`${iso}T12:00`)
  d.setDate(d.getDate() + dias)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export default function Semana() {
  const navigate = useNavigate()
  const [semana, setSemana] = useState(null)   // null = a última fechada
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async (alvo) => {
    setErro(null)
    try {
      setDados(await api.weekRecap(alvo ?? undefined))
    } catch (e) {
      setErro(e.message)
    }
  }, [])

  useEffect(() => {
    carregar(semana)
  }, [semana, carregar])

  const navegar = (dias) => {
    const base = dados?.current?.week_start
    if (base) setSemana(segundaDe(deslocar(base, dias)))
  }

  if (erro) {
    return (
      <Tela onVoltar={() => navigate('/perfil')}>
        <p style={{ margin: 0, color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>
      </Tela>
    )
  }
  if (!dados) {
    return (
      <Tela onVoltar={() => navigate('/perfil')}>
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>Carregando…</p>
      </Tela>
    )
  }

  const a = dados.current
  const b = dados.previous

  return (
    <Tela onVoltar={() => navigate('/perfil')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <IconButton icon="chevron-left" label="Semana anterior" onClick={() => navegar(-7)} />
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
            {a.label}
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
            {dados.is_last_closed ? 'Última semana fechada' : `${dataCurta(a.week_start)} a ${dataCurta(a.week_end)}`}
          </div>
        </div>
        <IconButton icon="chevron-right" label="Semana seguinte" onClick={() => navegar(7)} />
      </div>

      <Card tone="bloom" pad="var(--pad-card-lg)">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--fs-title-1)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            {a.days_closed}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            {a.days_closed === 1 ? 'dia fechado' : 'dias fechados'}
          </span>
        </div>
        <p style={{ margin: 'var(--space-4) 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
          {dados.verdict}
        </p>
        <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Chip>
            <Icon name="flame" size={13} color="var(--warning)" />
            <span style={{ marginLeft: 4, fontVariantNumeric: 'tabular-nums' }}>
              {dados.streak} agora
            </span>
          </Chip>
          <Chip>Recorde {dados.best_streak}</Chip>
          {a.points > 0 && <Chip>{Math.round(a.points)} pts na semana</Chip>}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-card)' }}>
        <Numero rotulo="Hábitos" valor={a.habits_done} antes={b.habits_done} icone="check-circle" />
        <Numero rotulo="Rotinas" valor={a.routines_done} antes={b.routines_done} icone="repeat" />
        <Numero rotulo="Treinos" valor={a.records} antes={b.records} icone="dumbbell" />
        <Numero rotulo="Descanso" valor={a.rest_days} antes={b.rest_days} icone="moon" comparar={false} />
      </div>

      {(a.distance_km > 0 || a.minutes > 0) && (
        <Card>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
            {a.distance_km > 0 && <Linha icone="footprints" texto={`${a.distance_km} km percorridos`} />}
            {a.minutes > 0 && <Linha icone="timer" texto={`${Math.round(a.minutes / 60)} h de treino`} />}
          </div>
          {a.modalities.length > 0 && (
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              {a.modalities.map((mod) => (
                <Chip key={mod}>{mod}</Chip>
              ))}
            </div>
          )}
        </Card>
      )}

      {a.best_day && (
        <Card>
          <Linha
            icone="star"
            texto={`Melhor dia: ${new Date(`${a.best_day.date}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long' })}, com ${a.best_day.done} ${a.best_day.done === 1 ? 'item' : 'itens'}.`}
          />
        </Card>
      )}

      <Button variant="secondary" fullWidth iconLeft="award" onClick={() => navigate('/conquistas')}>
        Ver conquistas
      </Button>
    </Tela>
  )
}

/** Número da semana com a variação em relação à anterior. */
function Numero({ rotulo, valor, antes, icone, comparar = true }) {
  const delta = valor - antes
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <Icon name={icone} size={14} color="var(--text-tertiary)" />
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-micro)',
            letterSpacing: 'var(--ls-caps)',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
          }}
        >
          {rotulo}
        </span>
      </div>
      <div style={{ marginTop: 'var(--space-4)', display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
        <span
          style={{
            fontFamily: 'var(--font-ui)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'var(--fs-title-2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
          }}
        >
          {valor}
        </span>
        {comparar && delta !== 0 && (
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--fs-body-sm)',
              color: delta > 0 ? 'var(--success)' : 'var(--text-tertiary)',
            }}
          >
            {delta > 0 ? '+' : ''}{delta}
          </span>
        )}
      </div>
    </Card>
  )
}

function Linha({ icone, texto }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <Icon name={icone} size={15} color="var(--blue-glow)" />
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
        {texto}
      </span>
    </div>
  )
}

function Tela({ onVoltar, children }) {
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
          }}
        >
          Sua semana
        </h1>
      </header>
      {children}
    </div>
  )
}
