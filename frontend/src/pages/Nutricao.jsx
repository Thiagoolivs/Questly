import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Button, Card, Icon, IconButton, Input, SearchField, SegmentedControl, Select } from '../design-system/components/index.js'
import Sheet from '../components/Sheet.jsx'
import TelaDeLista from '../components/TelaDeLista.jsx'
import { useToast } from '../components/Toast.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'

const COPO_ML = 250

export default function Nutricao() {
  const navigate = useNavigate()
  const { group } = useApp()
  const aviso = useToast()
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
      aviso({
        text: delta > 0 ? `+${delta / 1000} L de água` : `${delta / 1000} L de água`,
        icon: 'droplet',
        onUndo: () => beber(-delta),
      })
    } catch (e) {
      setErro(e.message)
    }
  }

  // Refeição apagada volta com um toque: os macros já estão na tela, recriá-la
  // é exatamente o que o "+" faria.
  const apagar = async (refeicao) => {
    try {
      await api.deleteMeal(group.id, refeicao.id)
      carregar()
      aviso({
        text: `"${refeicao.label}" removida`,
        icon: 'trash',
        onUndo: async () => {
          await api.addMealManual(group.id, {
            date: dados.date,
            label: refeicao.label,
            calories: refeicao.calories,
            protein_g: refeicao.protein_g,
            carbs_g: refeicao.carbs_g,
            fat_g: refeicao.fat_g,
            image: refeicao.image,
          })
          carregar()
        },
      })
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!group) {
    return (
      <TelaDeLista
        titulo="Alimentação"
        onVoltar={() => navigate('/plano')}
        vazio
        textoVazio="A alimentação é registrada dentro de um espaço."
        acaoVazio={
          <Button variant="accent" onClick={() => navigate('/grupo')}>
            Criar meu espaço
          </Button>
        }
      />
    )
  }

  const refeicoes = dados?.meals ?? []

  return (
    <TelaDeLista titulo="Alimentação" onVoltar={() => navigate('/plano')} erro={erro} carregando={carregando}>
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

          {/* A ação principal da tela é registrar o que se comeu. Ela era um
              ícone de 36px no canto do cabeçalho — agora é um botão inteiro,
              logo abaixo dos números que ele altera. */}
          <Button variant="accent" size="lg" fullWidth iconLeft="plus" onClick={() => setRegistrando(true)}>
            Registrar refeição
          </Button>

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
                <IconButton icon="minus" label="Tirar um copo" size={32} onClick={() => beber(-COPO_ML)} />
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
            Nada registrado hoje. Busque o alimento pelo nome para ter o valor exato, ou mande uma foto e deixe a IA
            estimar.
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
              <IconButton icon="trash" tone="bare" label="Remover" size={32} onClick={() => apagar(r)} />
            </div>
          </Card>
        ))
      )}

      {registrando && dados && (
        <RegistrarRefeicao
          groupId={group.id}
          data={dados.date}
          onFechar={() => setRegistrando(false)}
          onPronto={() => {
            setRegistrando(false)
            carregar()
          }}
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

/**
 * Três formas de registrar, da mais exata para a mais rápida:
 * alimento tabelado > foto do prato > frase solta. As duas últimas dependem de
 * IA; a primeira não, e é por isso que ela abre primeiro.
 */
function RegistrarRefeicao({ groupId, data, onFechar, onPronto }) {
  const [modo, setModo] = useState('alimento')
  const [itens, setItens] = useState([])
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const total = useMemo(
    () =>
      itens.reduce(
        (acc, i) => ({
          calories: acc.calories + i.calories,
          protein_g: acc.protein_g + i.protein_g,
          carbs_g: acc.carbs_g + i.carbs_g,
          fat_g: acc.fat_g + i.fat_g,
        }),
        { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
      ),
    [itens],
  )

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

  const porAlimentos = async () => {
    if (ocupado || itens.length === 0) return
    setOcupado(true)
    setErro('')
    try {
      await api.addMealFoods(groupId, {
        date: data,
        items: itens.map((i) => ({
          food_id: i.food_id,
          grams: i.grams,
          name: i.name,
          calories: i.por100.calories,
          protein_g: i.por100.protein_g,
          carbs_g: i.por100.carbs_g,
          fat_g: i.por100.fat_g,
        })),
      })
      onPronto()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  const confirmar = modo === 'alimento' ? porAlimentos : modo === 'texto' ? porTexto : porFoto
  const podeConfirmar =
    modo === 'alimento' ? itens.length > 0 : modo === 'texto' ? texto.trim().length >= 2 : true

  return (
    <Sheet
      title="Registrar refeição"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={confirmar} disabled={ocupado || !podeConfirmar}>
            {ocupado ? 'Salvando…' : modo === 'alimento' ? `Salvar ${total.calories} kcal` : 'Registrar'}
          </Button>
        </>
      }
    >
      <SegmentedControl
        value={modo}
        onChange={setModo}
        options={[
          { label: 'Alimento', value: 'alimento' },
          { label: 'Foto', value: 'foto' },
          { label: 'Frase', value: 'texto' },
        ]}
      />

      {modo === 'alimento' ? (
        <PorAlimento itens={itens} setItens={setItens} total={total} />
      ) : modo === 'foto' ? (
        <>
          <Button variant="secondary" size="lg" fullWidth iconLeft="camera" onClick={porFoto} disabled={ocupado}>
            Tirar foto do prato
          </Button>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            A IA lê o prato e estima calorias e macros. Precisa de chave de IA configurada no servidor.
          </p>
        </>
      ) : (
        <>
          <Input
            label="O que você comeu"
            placeholder="Dois ovos, café com leite e um pão"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Estimativa por IA. Para o número exato, use a aba Alimento.
          </p>
        </>
      )}

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}

/** Busca por nome, escolha da quantidade e soma — sem IA no caminho. */
function PorAlimento({ itens, setItens, total }) {
  const [termo, setTermo] = useState('')
  const [achados, setAchados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [escolhido, setEscolhido] = useState(null)
  const pedido = useRef(0)

  useEffect(() => {
    const q = termo.trim()
    if (q.length < 2) {
      setAchados([])
      return
    }
    // Espera a pessoa parar de digitar: uma busca por tecla estoura a rede e
    // faz a lista piscar com resultado velho.
    const id = setTimeout(async () => {
      const meu = ++pedido.current
      setBuscando(true)
      try {
        const d = await api.searchFoods(q)
        if (meu === pedido.current) setAchados(d.foods)
      } catch {
        if (meu === pedido.current) setAchados([])
      } finally {
        if (meu === pedido.current) setBuscando(false)
      }
    }, 320)
    return () => clearTimeout(id)
  }, [termo])

  const adicionar = (alimento, gramas) => {
    const fator = gramas / 100
    setItens([
      ...itens,
      {
        chave: `${alimento.id}-${Date.now()}`,
        food_id: alimento.id,
        name: alimento.name,
        grams: gramas,
        por100: alimento,
        calories: Math.round(alimento.calories * fator),
        protein_g: Math.round(alimento.protein_g * fator * 10) / 10,
        carbs_g: Math.round(alimento.carbs_g * fator * 10) / 10,
        fat_g: Math.round(alimento.fat_g * fator * 10) / 10,
      },
    ])
    setEscolhido(null)
    setTermo('')
    setAchados([])
  }

  return (
    <>
      <SearchField placeholder="Arroz, ovo, frango…" value={termo} onChange={(e) => setTermo(e.target.value)} />

      {escolhido ? (
        <Quantidade alimento={escolhido} onCancelar={() => setEscolhido(null)} onAdicionar={adicionar} />
      ) : termo.trim().length >= 2 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {buscando && achados.length === 0 ? (
            <Aviso>Buscando…</Aviso>
          ) : achados.length === 0 ? (
            <Aviso>Nada encontrado. Tente outro nome, ou registre por foto/frase.</Aviso>
          ) : (
            achados.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setEscolhido(a)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: '10px 0',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--line-hairline)',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                    {a.name}
                  </div>
                  <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
                    {a.calories} kcal · P {a.protein_g}g · C {a.carbs_g}g · G {a.fat_g}g — por 100 g
                  </div>
                </div>
                <Icon name="plus" size={16} color="var(--blue-glow)" />
              </button>
            ))
          )}
        </div>
      ) : null}

      {itens.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {itens.map((i) => (
            <div key={i.chave} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-primary)' }}>
                  {i.name}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
                  {i.grams} g · {i.calories} kcal · P {i.protein_g}g
                </div>
              </div>
              <IconButton
                icon="x"
                tone="bare"
                size={28}
                label={`Tirar ${i.name}`}
                onClick={() => setItens(itens.filter((x) => x.chave !== i.chave))}
              />
            </div>
          ))}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: 'var(--space-4)',
              borderTop: '1px solid var(--line-hairline)',
              fontFamily: 'var(--font-ui)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-primary)',
            }}
          >
            <span>Total</span>
            <span>
              {total.calories} kcal · P {Math.round(total.protein_g)}g · C {Math.round(total.carbs_g)}g · G{' '}
              {Math.round(total.fat_g)}g
            </span>
          </div>
        </div>
      )}
    </>
  )
}

/** Quantidade em medida caseira ("2 ovos") ou em gramas. */
function Quantidade({ alimento, onCancelar, onAdicionar }) {
  const medidas = alimento.measures?.length ? alimento.measures : []
  const [unidade, setUnidade] = useState(medidas[0]?.label ?? 'g')
  const [qtd, setQtd] = useState('1')

  const medida = medidas.find((m) => m.label === unidade)
  const numero = Number(String(qtd).replace(',', '.')) || 0
  const gramas = medida ? Math.round(numero * medida.grams) : Math.round(numero)
  const fator = gramas / 100

  return (
    <Card>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
        {alimento.name}
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
        <div style={{ width: 90, flex: 'none' }}>
          <Input label="Quanto" type="number" inputMode="decimal" value={qtd} onChange={(e) => setQtd(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Select
            label="Medida"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            options={[...medidas.map((m) => ({ value: m.label, label: `${m.label} (${m.grams} g)` })), { value: 'g', label: 'gramas' }]}
          />
        </div>
      </div>

      <div
        style={{
          marginTop: 'var(--space-5)',
          fontFamily: 'var(--font-ui)',
          fontVariantNumeric: 'tabular-nums',
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {gramas} g · {Math.round(alimento.calories * fator)} kcal · P {Math.round(alimento.protein_g * fator)}g · C{' '}
        {Math.round(alimento.carbs_g * fator)}g · G {Math.round(alimento.fat_g * fator)}g
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-4)', marginTop: 'var(--space-5)' }}>
        <Button variant="ghost" fullWidth onClick={onCancelar}>
          Voltar
        </Button>
        <Button variant="accent" fullWidth disabled={gramas <= 0} onClick={() => onAdicionar(alimento, gramas)}>
          Adicionar
        </Button>
      </div>
    </Card>
  )
}

function Aviso({ children }) {
  return (
    <p style={{ margin: 0, padding: 'var(--space-4) 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
      {children}
    </p>
  )
}
