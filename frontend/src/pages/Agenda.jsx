import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton, Input, Select } from '../design-system/components/index.js'
import Sheet from '../components/Sheet.jsx'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Categorias de bem-estar, não de escritório: a agenda aqui é para cuidar de si.
const CATEGORIAS = [
  { value: 'treino', label: 'Treino' },
  { value: 'descanso', label: 'Descanso' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'mente', label: 'Mente' },
  { value: 'social', label: 'Social' },
  { value: 'outro', label: 'Outro' },
]

const LEMBRETES = [
  { value: '', label: 'Sem lembrete' },
  { value: '0', label: 'Na hora' },
  { value: '10', label: '10 min antes' },
  { value: '30', label: '30 min antes' },
  { value: '60', label: '1 hora antes' },
  { value: '1440', label: '1 dia antes' },
]

const RECORRENCIA = [
  { value: '', label: 'Não se repete' },
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekdays', label: 'Dias de semana' },
  { value: 'weekly', label: 'Toda semana' },
]

const dois = (n) => String(n).padStart(2, '0')
const iso = (d) => `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`

// O backend guarda data/hora como horário local ingênuo (o fuso é o do grupo).
// Mandar toISOString() converteria para UTC e jogaria um compromisso das 22h
// para o dia seguinte, então a hora vai como está no relógio de quem marcou.
const isoLocal = (d) => `${iso(d)}T${dois(d.getHours())}:${dois(d.getMinutes())}:00`

function inicioDaSemana(d) {
  const x = new Date(d)
  x.setDate(x.getDate() - x.getDay())
  x.setHours(0, 0, 0, 0)
  return x
}

export default function Agenda() {
  const navigate = useNavigate()
  const [ancora, setAncora] = useState(() => new Date())
  const [selecionado, setSelecionado] = useState(() => iso(new Date()))
  const [dia, setDia] = useState(null)
  const [erro, setErro] = useState(null)
  const [criando, setCriando] = useState(false)

  const semana = useMemo(() => {
    const base = inicioDaSemana(ancora)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return d
    })
  }, [ancora])

  const carregar = useCallback(async (data) => {
    setErro(null)
    try {
      setDia(await api.today(data))
    } catch (e) {
      setErro(e.message)
    }
  }, [])

  useEffect(() => {
    carregar(selecionado)
  }, [selecionado, carregar])

  const hoje = iso(new Date())
  const agenda = dia?.agenda ?? []

  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        paddingBottom: 'var(--space-11)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-7)' }}>
        <IconButton icon="arrow-left" label="Voltar" onClick={() => navigate('/')} />
        <h1
          style={{
            flex: 1,
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-2)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
          }}
        >
          Agenda
        </h1>
        <IconButton icon="plus" label="Novo compromisso" onClick={() => setCriando(true)} />
      </header>

      {/* Tira de semana: navegação por toque, sem calendário mensal cheio de ruído. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <IconButton
          icon="chevron-left"
          label="Semana anterior"
          onClick={() => setAncora((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7))}
        />
        <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
          {semana.map((d) => {
            const chave = iso(d)
            const ativo = chave === selecionado
            return (
              <button
                key={chave}
                type="button"
                onClick={() => setSelecionado(chave)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  padding: 'var(--space-4) 0',
                  borderRadius: 'var(--radius-md)',
                  border: chave === hoje && !ativo ? '1px solid var(--blue-glow)' : '1px solid transparent',
                  background: ativo ? 'var(--blue-glow)' : 'transparent',
                  color: ativo ? 'var(--full-white)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)' }}>{DIAS[d.getDay()]}</span>
                <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)' }}>
                  {d.getDate()}
                </span>
              </button>
            )
          })}
        </div>
        <IconButton
          icon="chevron-right"
          label="Próxima semana"
          onClick={() => setAncora((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7))}
        />
      </div>

      {selecionado !== hoje && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Chip onClick={() => { setAncora(new Date()); setSelecionado(hoje) }}>Voltar para hoje</Chip>
        </div>
      )}

      {dia?.rest_day && (
        <Card tone="accent" style={{ marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Icon name="moon" size={18} color="var(--full-white)" />
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--full-white)' }}>
              Descanso planejado. Nada aqui conta como falha.
            </span>
          </div>
        </Card>
      )}

      {erro && (
        <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>
      )}

      {agenda.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Nada marcado neste dia.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
          {agenda.map((ev) => (
            <Compromisso
              key={ev.id}
              evento={ev}
              onMudou={() => carregar(selecionado)}
              onErro={setErro}
            />
          ))}
        </div>
      )}

      {criando && (
        <NovoCompromisso
          data={selecionado}
          onFechar={() => setCriando(false)}
          onCriado={() => { setCriando(false); carregar(selecionado) }}
        />
      )}
    </div>
  )
}

function Compromisso({ evento, onMudou, onErro }) {
  const [ocupado, setOcupado] = useState(false)
  const feito = evento.status === 'done'

  const alternar = async () => {
    setOcupado(true)
    try {
      await api.updateCalendarActivity(evento.id, { status: feito ? 'pending' : 'done' })
      onMudou()
    } catch (e) {
      onErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const remover = async () => {
    setOcupado(true)
    try {
      await api.deleteCalendarActivity(evento.id)
      onMudou()
    } catch (e) {
      onErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const hora = evento.start
    ? new Date(evento.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <Card style={{ opacity: feito ? 0.6 : 1 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--blue-glow)' }}>
              {hora ?? 'Sem hora'}
            </span>
            {evento.visibility === 'group' && <Icon name="users" size={14} color="var(--text-tertiary)" />}
            {evento.reminder_minutes?.length > 0 && <Icon name="bell" size={14} color="var(--text-tertiary)" />}
          </div>
          <div
            style={{
              marginTop: 2,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body)',
              fontWeight: 'var(--fw-medium)',
              color: 'var(--text-primary)',
              textDecoration: feito ? 'line-through' : 'none',
            }}
          >
            {evento.title}
          </div>
          {(evento.category || evento.duration_min) && (
            <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
              {[evento.category, evento.duration_min ? `${evento.duration_min} min` : null].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <IconButton
            icon={feito ? 'refresh-cw' : 'check'}
            label={feito ? 'Reabrir' : 'Concluir'}
            disabled={ocupado}
            onClick={alternar}
          />
          <IconButton icon="trash" label="Remover" disabled={ocupado} onClick={remover} />
        </div>
      </div>
    </Card>
  )
}

function NovoCompromisso({ data, onFechar, onCriado }) {
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('08:00')
  const [duracao, setDuracao] = useState('60')
  const [categoria, setCategoria] = useState('treino')
  const [lembrete, setLembrete] = useState('30')
  const [repete, setRepete] = useState('')
  const [doGrupo, setDoGrupo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    if (ocupado || !titulo.trim()) return
    setOcupado(true)
    setErro('')
    try {
      const inicio = new Date(`${data}T${hora || '00:00'}:00`)
      const minutos = Number(duracao) || 0
      await api.createCalendarActivity({
        title: titulo.trim(),
        category: categoria,
        start_datetime: isoLocal(inicio),
        end_datetime: minutos ? isoLocal(new Date(inicio.getTime() + minutos * 60000)) : null,
        duration_min: minutos || null,
        recurrence_rule: repete ? { type: repete } : {},
        reminder_minutes: lembrete === '' ? [] : [Number(lembrete)],
        visibility: doGrupo ? 'group' : 'private',
      })
      onCriado()
    } catch (e2) {
      setErro(e2.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Novo compromisso"
      onClose={onFechar}
      footer={
        <>
          <Button type="button" variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button type="button" variant="accent" fullWidth onClick={salvar} disabled={ocupado || !titulo.trim()}>
            {ocupado ? 'Salvando…' : 'Agendar'}
          </Button>
        </>
      }
    >
      <Input
        label="O quê"
        placeholder="Treino de perna, meditar, almoço com a família…"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        autoFocus
      />

      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1 }}>
          <Input label="Hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            label="Duração (min)"
            type="number"
            inputMode="numeric"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
          />
        </div>
      </div>

      <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} options={CATEGORIAS} />
      <Select label="Repetir" value={repete} onChange={(e) => setRepete(e.target.value)} options={RECORRENCIA} />
      <Select label="Lembrete" value={lembrete} onChange={(e) => setLembrete(e.target.value)} options={LEMBRETES} />

      <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', cursor: 'pointer' }}>
        <input type="checkbox" checked={doGrupo} onChange={(e) => setDoGrupo(e.target.checked)} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
          Abrir para o grupo (por padrão é só seu)
        </span>
      </label>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}
