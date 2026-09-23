import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Button, Card, Chip, Icon, IconButton, Input, Select } from '../design-system/components/index.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { useToast } from '../components/Toast.jsx'

const ROTULO_INTENSIDADE = {
  leve: 'Leve',
  moderado: 'Moderado',
  intenso: 'Intenso',
  extremo: 'Extremo',
}

export default function Registrar() {
  const navigate = useNavigate()
  const { group } = useApp()
  const aviso = useToast()

  const [modalidades, setModalidades] = useState([])
  const [escolhida, setEscolhida] = useState(null)
  const [valores, setValores] = useState({})
  const [foto, setFoto] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    api
      .modalities()
      .then(({ modalities }) => {
        setModalidades(modalities)
        setEscolhida(modalities[0] ?? null)
      })
      .catch((e) => setErro(e.message))
  }, [])

  const trocar = useCallback((mod) => {
    setEscolhida(mod)
    setValores({})
    setResultado(null)
  }, [])

  const anexarFoto = async () => {
    const f = await pickImage()
    if (!f) return
    setFoto(await fileToCompressedDataURL(f))
  }

  const enviar = async () => {
    if (ocupado || !escolhida) return
    setOcupado(true)
    setErro('')
    try {
      const params = {}
      for (const campo of escolhida.fields) {
        const bruto = valores[campo.key]
        if (bruto === undefined || bruto === '') continue
        params[campo.key] = campo.type === 'number' ? Number(bruto) : bruto
      }
      if (!params.intensity && escolhida.fields.some((f) => f.key === 'intensity')) {
        params.intensity = 'moderado'
      }
      const r = await api.createActivityRecord(group.id, {
        modality: escolhida.id,
        category: 'fitness',
        params,
        proof_image: foto,
      })
      setResultado(r)
    } catch (e) {
      setErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  // Registro com número trocado é o erro mais comum aqui, e antes não tinha
  // volta: desfazer na própria tela de sucesso devolve o XP e os pontos.
  const desfazer = async () => {
    try {
      await api.deleteActivityRecord(group.id, resultado.id)
      setResultado(null)
      setValores({})
      setFoto(null)
      aviso({ text: 'Registro desfeito — XP e pontos devolvidos', icon: 'undo-2' })
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!group) {
    return (
      <Tela titulo="Registrar" onVoltar={() => navigate('/')}>
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            Registrar atividade precisa de um espaço — mesmo que seja só seu.
          </p>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button variant="accent" onClick={() => navigate('/grupo')}>
              Criar meu espaço
            </Button>
          </div>
        </Card>
      </Tela>
    )
  }

  if (resultado) {
    return (
      <Tela titulo="Registrado" onVoltar={() => navigate('/')}>
        <Card tone="bloom" pad="var(--pad-card-lg)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            <Icon name="check-circle" size={28} color="var(--success)" />
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-title-3)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-primary)',
                }}
              >
                +{resultado.xp_earned} XP
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                {resultado.score_earned} ponto{resultado.score_earned === 1 ? '' : 's'} no ranking
              </div>
            </div>
          </div>
        </Card>

        {/* Pontuação cortada em silêncio parece bug: o corte é dito. */}
        {resultado.capped > 0 && (
          <Card>
            <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
              <Icon name="info" size={16} color="var(--warning)" />
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                O XP foi todo seu. No ranking, parte não contou por causa do limite
                diário e da repetição da mesma modalidade hoje — é o que impede
                quem registra mais de passar na frente de quem se esforça mais.
              </p>
            </div>
          </Card>
        )}

        {resultado.notes?.length > 0 && (
          <Card>
            {resultado.notes.map((n, i) => (
              <p
                key={i}
                style={{
                  margin: i ? 'var(--space-4) 0 0' : 0,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--text-secondary)',
                }}
              >
                {n}
              </p>
            ))}
          </Card>
        )}

        {resultado.streak > 0 && (
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <Icon name="flame" size={16} color="var(--warning)" />
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                {resultado.streak} {resultado.streak === 1 ? 'dia seguido' : 'dias seguidos'}
                {resultado.next_milestone
                  ? ` · faltam ${resultado.next_milestone.missing} para +${resultado.next_milestone.points} pts`
                  : ''}
              </p>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
          <Button variant="ghost" fullWidth onClick={() => { setResultado(null); setValores({}); setFoto(null) }}>
            Registrar outra
          </Button>
          <Button variant="accent" fullWidth onClick={() => navigate('/')}>
            Voltar
          </Button>
        </div>

        <Button variant="ghost" fullWidth iconLeft="undo-2" onClick={desfazer}>
          Desfazer este registro
        </Button>
      </Tela>
    )
  }

  return (
    <Tela titulo="Registrar atividade" onVoltar={() => navigate('/')}>
      <div>
        <Rotulo>Modalidade</Rotulo>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {modalidades.map((mod) => (
            <Chip key={mod.id} selected={escolhida?.id === mod.id} onClick={() => trocar(mod)}>
              {mod.label}
            </Chip>
          ))}
        </div>
      </div>

      {escolhida?.fields.map((campo) =>
        campo.type === 'choice' ? (
          <Select
            key={campo.key}
            label={campo.label}
            value={valores[campo.key] ?? 'moderado'}
            onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
            options={campo.options.map((o) => ({ value: o, label: ROTULO_INTENSIDADE[o] ?? o }))}
          />
        ) : (
          <Input
            key={campo.key}
            label={campo.label}
            type="number"
            inputMode="decimal"
            step={campo.step}
            unit={campo.unit}
            value={valores[campo.key] ?? ''}
            onChange={(e) => setValores((v) => ({ ...v, [campo.key]: e.target.value }))}
          />
        ),
      )}

      {escolhida?.fields.some((f) => f.key === 'intensity') && (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
          A intensidade ajuda a descrever o treino, mas quase não muda a pontuação
          quando há distância e tempo — aí quem manda é o ritmo.
        </p>
      )}

      <div>
        <Rotulo>Foto (opcional)</Rotulo>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          {foto && (
            <img
              src={foto}
              alt=""
              style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
            />
          )}
          <Button variant="secondary" size="sm" iconLeft="camera" onClick={anexarFoto}>
            {foto ? 'Trocar' : 'Anexar'}
          </Button>
          {foto && (
            <IconButton icon="x" label="Remover foto" size={32} onClick={() => setFoto(null)} />
          )}
        </div>
      </div>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      <Button variant="accent" fullWidth size="lg" onClick={enviar} disabled={ocupado || !escolhida}>
        {ocupado ? 'Salvando…' : 'Registrar'}
      </Button>
    </Tela>
  )
}

function Tela({ titulo, onVoltar, children }) {
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
          {titulo}
        </h1>
      </header>
      {children}
    </div>
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
