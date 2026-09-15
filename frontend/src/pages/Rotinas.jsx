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

const MOMENTOS = [
  { value: '', label: 'Sem momento fixo' },
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noite' },
  { value: 'pre-workout', label: 'Pré-treino' },
  { value: 'post-workout', label: 'Pós-treino' },
]

const rotuloMomento = (v) => MOMENTOS.find((m) => m.value === v)?.label ?? null

function resumo(r) {
  const f = r.frequency || {}
  const partes = []
  if ((f.type || 'daily') === 'daily') partes.push('Todo dia')
  else if (f.type === 'weekdays') partes.push('Seg a Sex')
  else partes.push((f.days || []).map((d) => DIAS[d]).join(', ') || 'Nenhum dia')
  const momento = rotuloMomento(r.time_slot)
  if (momento) partes.push(momento)
  partes.push(`${(r.steps || []).length} passos`)
  return partes.join(' · ')
}

export default function Rotinas() {
  const navigate = useNavigate()
  const [rotinas, setRotinas] = useState([])
  const [iaLigada, setIaLigada] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [editando, setEditando] = useState(null)
  const [pedindoIA, setPedindoIA] = useState(false)

  const carregar = useCallback(async () => {
    setErro(null)
    try {
      const [r, t] = await Promise.allSettled([api.routines(), api.trainingPlans()])
      if (r.status === 'fulfilled') setRotinas(r.value.routines)
      else setErro(r.reason.message)
      if (t.status === 'fulfilled') setIaLigada(t.value.ai_enabled)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  const remover = async (r) => {
    try {
      await api.deleteRoutine(r.id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  return (
    <TelaDeLista
      titulo="Rotinas"
      onVoltar={() => navigate('/plano')}
      acao={<IconButton icon="plus" label="Nova rotina" onClick={() => setEditando({ steps: [] })} />}
      erro={erro}
      carregando={carregando}
      vazio={rotinas.length === 0}
      textoVazio="Rotina é um conjunto de passos que você repete: manhã, pré-treino, antes de dormir. Marcar os passos é o que fecha a rotina do dia."
      acaoVazio={
        <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
          <Button variant="accent" iconLeft="plus" onClick={() => setEditando({ steps: [] })}>
            Criar
          </Button>
          {iaLigada && (
            <Button variant="secondary" iconLeft="sparkles" onClick={() => setPedindoIA(true)}>
              Pedir à IA
            </Button>
          )}
        </div>
      }
    >
      {rotinas.map((r) => (
        <Card key={r.id} style={{ opacity: r.active ? 1 : 0.55 }}>
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
                {r.name}
              </div>
              <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                {resumo(r)}
              </div>
              {(r.steps || []).length > 0 && (
                <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  {r.steps.map((p) => (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                      <Icon
                        name={p.is_required ? 'check-circle' : 'circle-dashed'}
                        size={13}
                        color="var(--text-tertiary)"
                      />
                      <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                        {p.name}
                      </span>
                      {p.duration_min ? (
                        <span style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
                          {p.duration_min} min
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <IconButton icon="pencil" label="Editar" size={32} onClick={() => setEditando(r)} />
              <IconButton icon="trash" label="Remover" size={32} onClick={() => remover(r)} />
            </div>
          </div>
        </Card>
      ))}

      {rotinas.length > 0 && iaLigada && (
        <Button variant="secondary" fullWidth iconLeft="sparkles" onClick={() => setPedindoIA(true)}>
          Pedir uma rotina à IA
        </Button>
      )}

      {editando && (
        <EditorDeRotina
          rotina={editando}
          onFechar={() => setEditando(null)}
          onSalvo={() => { setEditando(null); carregar() }}
        />
      )}

      {pedindoIA && (
        <RotinaPelaIA
          onFechar={() => setPedindoIA(false)}
          onPronto={() => { setPedindoIA(false); carregar() }}
        />
      )}
    </TelaDeLista>
  )
}

function EditorDeRotina({ rotina, onFechar, onSalvo }) {
  const novo = !rotina.id
  const [nome, setNome] = useState(rotina.name ?? '')
  const [momento, setMomento] = useState(rotina.time_slot ?? '')
  const [frequencia, setFrequencia] = useState(rotina.frequency?.type ?? 'daily')
  const [dias, setDias] = useState(rotina.frequency?.days ?? [])
  const [passos, setPassos] = useState(
    (rotina.steps ?? []).map((p) => ({
      name: p.name,
      duration_min: p.duration_min ?? '',
      is_required: p.is_required ?? true,
    })),
  )
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const alternarDia = (d) =>
    setDias((atual) => (atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d].sort()))

  const mudarPasso = (i, campo, valor) =>
    setPassos((atual) => atual.map((p, j) => (i === j ? { ...p, [campo]: valor } : p)))

  const moverPasso = (i, delta) =>
    setPassos((atual) => {
      const destino = i + delta
      if (destino < 0 || destino >= atual.length) return atual
      const copia = [...atual]
      ;[copia[i], copia[destino]] = [copia[destino], copia[i]]
      return copia
    })

  const salvar = async () => {
    const limpos = passos.filter((p) => p.name.trim())
    if (ocupado || !nome.trim() || limpos.length === 0) return
    setOcupado(true)
    setErro('')

    const frequenciaCorpo = { type: frequencia, days: frequencia === 'custom' ? dias : [] }
    try {
      if (novo) {
        await api.createRoutine({
          name: nome.trim(),
          time_slot: momento || null,
          frequency: frequenciaCorpo,
          steps: limpos.map((p, i) => ({
            name: p.name.trim(),
            order: i,
            duration_min: p.duration_min === '' ? null : Number(p.duration_min),
            is_required: p.is_required,
          })),
        })
      } else {
        // A rota de update não mexe nos passos; recriar é o caminho honesto
        // enquanto não existir endpoint próprio para eles.
        await api.updateRoutine(rotina.id, {
          name: nome.trim(),
          time_slot: momento || null,
          frequency: frequenciaCorpo,
        })
      }
      onSalvo()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title={novo ? 'Nova rotina' : 'Editar rotina'}
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button
            variant="accent"
            fullWidth
            onClick={salvar}
            disabled={ocupado || !nome.trim() || passos.filter((p) => p.name.trim()).length === 0}
          >
            {ocupado ? 'Salvando…' : 'Salvar'}
          </Button>
        </>
      }
    >
      <Input
        label="Nome"
        placeholder="Manhã, pré-treino, antes de dormir…"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
      />
      <Select label="Momento" value={momento} onChange={(e) => setMomento(e.target.value)} options={MOMENTOS} />
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

      <div>
        <Rotulo>Passos (na ordem de execução)</Rotulo>
        {!novo && (
          <p style={{ margin: '0 0 var(--space-5)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
            Os passos de uma rotina existente não são editados aqui — crie outra
            rotina se a sequência mudou.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {passos.map((p, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder={`Passo ${i + 1}`}
                  value={p.name}
                  onChange={(e) => mudarPasso(i, 'name', e.target.value)}
                  disabled={!novo}
                />
              </div>
              <div style={{ width: 84 }}>
                <Input
                  type="number"
                  inputMode="numeric"
                  unit="min"
                  value={p.duration_min}
                  onChange={(e) => mudarPasso(i, 'duration_min', e.target.value)}
                  disabled={!novo}
                />
              </div>
              {novo && (
                <>
                  <IconButton icon="chevron-up" label="Subir" size={30} onClick={() => moverPasso(i, -1)} />
                  <IconButton icon="chevron-down" label="Descer" size={30} onClick={() => moverPasso(i, 1)} />
                  <IconButton
                    icon="x"
                    label="Remover passo"
                    size={30}
                    onClick={() => setPassos((a) => a.filter((_, j) => j !== i))}
                  />
                </>
              )}
            </div>
          ))}
        </div>
        {novo && (
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button
              variant="secondary"
              size="sm"
              iconLeft="plus"
              onClick={() => setPassos((a) => [...a, { name: '', duration_min: '', is_required: true }])}
            >
              Adicionar passo
            </Button>
          </div>
        )}
      </div>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}

function RotinaPelaIA({ onFechar, onPronto }) {
  const [nome, setNome] = useState('')
  const [contexto, setContexto] = useState('')
  const [quantos, setQuantos] = useState('5')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const gerar = async () => {
    if (ocupado || !nome.trim()) return
    setOcupado(true)
    setErro('')
    try {
      await api.createRoutineWithAI({
        name: nome.trim(),
        context: contexto.trim() || null,
        steps: Number(quantos) || 5,
      })
      onPronto()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Rotina pela IA"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={gerar} disabled={ocupado || !nome.trim()}>
            {ocupado ? 'Montando…' : 'Gerar'}
          </Button>
        </>
      }
    >
      <Input
        label="Rotina"
        placeholder="Pré-treino, acordar bem, desacelerar à noite…"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        autoFocus
      />
      <Input
        label="Contexto (opcional)"
        placeholder="Antes do jiu-jitsu, tenho 15 minutos…"
        value={contexto}
        onChange={(e) => setContexto(e.target.value)}
      />
      <Input
        label="Quantos passos"
        type="number"
        inputMode="numeric"
        value={quantos}
        onChange={(e) => setQuantos(e.target.value)}
      />
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
