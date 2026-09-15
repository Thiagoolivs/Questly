import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton, Input, Select } from '../design-system/components/index.js'
import Sheet from '../components/Sheet.jsx'
import TelaDeLista from '../components/TelaDeLista.jsx'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const FREQUENCIAS = [
  { value: 'daily', label: 'Todo dia' },
  { value: 'weekdays', label: 'Dias de semana' },
  { value: 'custom', label: 'Dias escolhidos' },
]

const LEMBRETES = [
  { value: '', label: 'Sem lembrete' },
  { value: '0', label: 'Na hora' },
  { value: '15', label: '15 min antes' },
  { value: '60', label: '1 hora antes' },
]

const CATEGORIAS = [
  { value: 'corpo', label: 'Corpo' },
  { value: 'mente', label: 'Mente' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'sono', label: 'Sono' },
  { value: 'outro', label: 'Outro' },
]

function resumo(h) {
  const partes = []
  if (h.frequency === 'daily') partes.push('Todo dia')
  else if (h.frequency === 'weekdays') partes.push('Seg a Sex')
  else partes.push((h.custom_days || []).map((d) => DIAS[d]).join(', ') || 'Nenhum dia')
  if (h.time) partes.push(h.time)
  if (h.goal_qty) partes.push(`${h.goal_qty}${h.goal_unit ? ` ${h.goal_unit}` : ''}`)
  return partes.join(' · ')
}

export default function Habitos() {
  const navigate = useNavigate()
  const [habitos, setHabitos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [editando, setEditando] = useState(null)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      setHabitos((await api.habits()).habits)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const remover = async (h) => {
    try {
      await api.deleteHabit(h.id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const alternarAtivo = async (h) => {
    try {
      await api.updateHabit(h.id, { active: !h.active })
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <TelaDeLista
      titulo="Hábitos"
      onVoltar={() => navigate('/plano')}
      acao={<IconButton icon="plus" label="Novo hábito" onClick={() => setEditando({})} />}
      erro={erro}
      carregando={carregando}
      vazio={habitos.length === 0}
      textoVazio="Nenhum hábito ainda. Comece por um só — constância vem de poucos hábitos mantidos, não de muitos criados."
      acaoVazio={<Button variant="accent" iconLeft="plus" onClick={() => setEditando({})}>Criar hábito</Button>}
    >
      {habitos.map((h) => (
        <Card key={h.id} style={{ opacity: h.active ? 1 : 0.55 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-primary)',
                }}
              >
                {h.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                {resumo(h)}
              </div>
              {!h.active && (
                <div style={{ marginTop: 'var(--space-4)' }}>
                  <Chip>Pausado</Chip>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <IconButton icon="pencil" label="Editar" size={32} onClick={() => setEditando(h)} />
              <IconButton
                icon={h.active ? 'moon' : 'sun'}
                label={h.active ? 'Pausar' : 'Retomar'}
                size={32}
                onClick={() => alternarAtivo(h)}
              />
              <IconButton icon="trash" label="Remover" size={32} onClick={() => remover(h)} />
            </div>
          </div>
        </Card>
      ))}

      {editando && (
        <EditorDeHabito
          habito={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => { setEditando(null); carregar() }}
        />
      )}
    </TelaDeLista>
  )
}

function EditorDeHabito({ habito, onFechar, onSalvo }) {
  const novo = !habito.id
  const [nome, setNome] = useState(habito.name ?? '')
  const [categoria, setCategoria] = useState(habito.category ?? 'corpo')
  const [frequencia, setFrequencia] = useState(habito.frequency ?? 'daily')
  const [dias, setDias] = useState(habito.custom_days ?? [])
  const [hora, setHora] = useState(habito.time ?? '')
  const [metaQtd, setMetaQtd] = useState(habito.goal_qty ?? '')
  const [metaUnidade, setMetaUnidade] = useState(habito.goal_unit ?? '')
  const [lembrete, setLembrete] = useState(
    habito.reminder_minutes == null ? '' : String(habito.reminder_minutes),
  )
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const alternarDia = (d) =>
    setDias((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d].sort()))

  const salvar = async () => {
    if (ocupado || !nome.trim()) return
    setOcupado(true)
    setErro('')
    const corpo = {
      name: nome.trim(),
      category: categoria,
      frequency: frequencia,
      custom_days: frequencia === 'custom' ? dias : [],
      time: hora || null,
      goal_qty: metaQtd === '' ? null : Number(metaQtd),
      goal_unit: metaUnidade.trim() || null,
      reminder_minutes: lembrete === '' ? null : Number(lembrete),
    }
    try {
      if (novo) await api.createHabit(corpo)
      else await api.updateHabit(habito.id, corpo)
      onSalvo()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title={novo ? 'Novo hábito' : 'Editar hábito'}
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={salvar} disabled={ocupado || !nome.trim()}>
            {ocupado ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <Input
        label="Hábito"
        placeholder="Beber água, ler, alongar…"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
      />
      <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)} options={CATEGORIAS} />
      <Select label="Frequência" value={frequencia} onChange={(e) => setFrequencia(e.target.value)} options={FREQUENCIAS} />

      {frequencia === 'custom' && (
        <div>
          <Rotulo>Dias</Rotulo>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {DIAS.map((rotulo, i) => (
              <Chip key={i} selected={dias.includes(i)} onClick={() => alternarDia(i)} style={{ flex: 1, padding: 0 }}>
                {rotulo}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <Input label="Horário (opcional)" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />

      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Meta (opcional)"
            type="number"
            inputMode="decimal"
            value={metaQtd}
            onChange={(e) => setMetaQtd(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            label="Unidade"
            placeholder="L, páginas, min"
            value={metaUnidade}
            onChange={(e) => setMetaUnidade(e.target.value)}
          />
        </div>
      </div>

      <Select label="Lembrete" value={lembrete} onChange={(e) => setLembrete(e.target.value)} options={LEMBRETES} />

      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
        <Icon name="info" size={12} color="var(--text-tertiary)" style={{ verticalAlign: 'middle', marginRight: 4 }} />
        Dias marcados como descanso não contam como falha.
      </p>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}

function Rotulo({ children }) {
  return (
    <span
      style={{
        display: 'block',
        marginBottom: 'var(--space-3)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-label)',
        fontWeight: 'var(--fw-medium)',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </span>
  )
}
