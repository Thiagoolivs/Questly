import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Button, Card, Icon, IconButton, Input } from '../design-system/components/index.js'
import Sheet from '../components/Sheet.jsx'
import TelaDeLista from '../components/TelaDeLista.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'

const COPO_ML = 250

export default function Nutricao() {
  const navigate = useNavigate()
  const { group } = useApp()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [registrando, setRegistrando] = useState(false)

  const carregar = useCallback(async () => {
    if (!group) {
      setCarregando(false)
      return
    }
    setErro(null)
    try {
      const estado = await api.state(group.id)
      setDados(estado.nutrition)
    } catch (e) {
      setErro(e.message)
    } finally {
      setCarregando(false)
    }
  }, [group])

  useEffect(() => {
    carregar()
  }, [carregar])

  const beber = async (delta) => {
    try {
      await api.addWater(group.id, { date: dados.date, delta_ml: delta })
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  const apagar = async (id) => {
    try {
      await api.deleteMeal(group.id, id)
      carregar()
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!group) {
    return (
      <TelaDeLista titulo="Alimentação" onVoltar={() => navigate('/plano')} vazio textoVazio="A alimentação é registrada dentro de um espaço." acaoVazio={<Button variant="accent" onClick={() => navigate('/grupo')}>Criar meu espaço</Button>} />
    )
  }

  const refeicoes = dados?.meals ?? []

  return (
    <TelaDeLista
      titulo="Alimentação"
      onVoltar={() => navigate('/plano')}
      acao={<IconButton icon="plus" label="Registrar refeição" onClick={() => setRegistrando(true)} />}
      erro={erro}
      carregando={carregando}
    >
      {dados && (
        <>
          <Card tone="bloom" pad="var(--pad-card-lg)">
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
              <Macro rotulo="Calorias" valor={dados.calories} meta={dados.calories_goal} />
              <Macro rotulo="Proteína" valor={dados.protein_g} meta={dados.protein_goal_g} unidade="g" />
              <Macro rotulo="Carbo" valor={dados.carbs_g} meta={dados.carbs_goal_g} unidade="g" />
              <Macro rotulo="Gordura" valor={dados.fat_g} meta={dados.fat_goal_g} unidade="g" />
            </div>
          </Card>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                <Icon name="droplet" size={18} color="var(--sleep-core)" />
                <div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                    {dados.water_l} L
                  </div>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
                    de {dados.water_goal_l} L
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <IconButton icon="x" label="Tirar um copo" size={32} onClick={() => beber(-COPO_ML)} />
                <Button size="sm" variant="secondary" iconLeft="plus" onClick={() => beber(COPO_ML)}>
                  Copo
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {refeicoes.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Nada registrado hoje. A foto ou uma frase bastam — a IA estima o resto.
          </p>
        </Card>
      ) : (
        refeicoes.map((r) => (
          <Card key={r.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
              {r.image && (
                <img src={r.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                  {r.label}
                </div>
                <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                  {r.calories} kcal · P {r.protein_g}g · C {r.carbs_g}g · G {r.fat_g}g
                </div>
              </div>
              <IconButton icon="trash" label="Remover" size={32} onClick={() => apagar(r.id)} />
            </div>
          </Card>
        ))
      )}

      {registrando && dados && (
        <RegistrarRefeicao
          groupId={group.id}
          data={dados.date}
          onFechar={() => setRegistrando(false)}
          onPronto={() => { setRegistrando(false); carregar() }}
        />
      )}
    </TelaDeLista>
  )
}

function Macro({ rotulo, valor, meta, unidade = '' }) {
  const pct = meta ? Math.min(100, Math.round(((valor ?? 0) / meta) * 100)) : 0
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>{rotulo}</div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
        {valor ?? 0}
        {unidade}
      </div>
      <div style={{ marginTop: 'var(--space-3)', height: 4, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: 'var(--blue-glow)' }} />
      </div>
    </div>
  )
}

function RegistrarRefeicao({ groupId, data, onFechar, onPronto }) {
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const porFoto = async () => {
    const f = await pickImage()
    if (!f) return
    setOcupado(true)
    setErro('')
    try {
      await api.addMeal(groupId, { date: data, image: await fileToCompressedDataURL(f) })
      onPronto()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  const porTexto = async () => {
    if (ocupado || texto.trim().length < 2) return
    setOcupado(true)
    setErro('')
    try {
      await api.addMealText(groupId, { date: data, text: texto.trim() })
      onPronto()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Registrar refeição"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={porTexto} disabled={ocupado || texto.trim().length < 2}>
            {ocupado ? 'Estimando…' : 'Registrar'}
          </Button>
        </>
      }
    >
      <Button variant="secondary" fullWidth iconLeft="camera" onClick={porFoto} disabled={ocupado}>
        Tirar foto do prato
      </Button>
      <p style={{ margin: 0, textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
        ou descreva
      </p>
      <Input
        label="O que você comeu"
        placeholder="Dois ovos, café com leite e um pão"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />
      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}
