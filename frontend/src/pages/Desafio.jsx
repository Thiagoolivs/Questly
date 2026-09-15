import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Button, Card, Chip, Icon, IconButton } from '../design-system/components/index.js'
import Sheet from '../components/Sheet.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'

const AVISO_STATUS = {
  scheduled: 'Este desafio ainda não começou.',
  ended: 'Este desafio já terminou.',
}

export default function Desafio() {
  const navigate = useNavigate()
  const { group } = useApp()
  const [dados, setDados] = useState(null)
  const [erro, setErro] = useState(null)
  const [comprovando, setComprovando] = useState(null)

  const carregar = useCallback(async () => {
    if (!group) return
    setErro(null)
    try {
      setDados(await api.challengesToday(group.id))
    } catch (e) {
      setErro(e.message)
    }
  }, [group])

  useEffect(() => {
    carregar()
  }, [carregar])

  if (!group) {
    return (
      <Tela onVoltar={() => navigate('/')}>
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            Os desafios oficiais vivem dentro de um espaço.
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

  const status = dados?.challenge_status
  const foraDaJanela = status === 'scheduled' || status === 'ended'

  return (
    <Tela onVoltar={() => navigate('/')}>
      <Card tone="bloom" pad="var(--pad-card-lg)">
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          {dados?.motd ?? 'Escolha uma área e cumpra o desafio de hoje.'}
        </div>
        {dados && (
          <div style={{ marginTop: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <Chip>Dia {dados.day_number} de {dados.duration_days}</Chip>
            {foraDaJanela && <Chip>{status === 'scheduled' ? 'Ainda não começou' : 'Encerrado'}</Chip>}
          </div>
        )}
      </Card>

      {foraDaJanela && (
        <Card>
          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <Icon name="info" size={16} color="var(--warning)" />
            <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
              {AVISO_STATUS[status]} A janela é definida na configuração do espaço.
            </p>
          </div>
        </Card>
      )}

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
        {(dados?.challenges ?? []).map((ch) => (
          <Card key={ch.category}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--fs-micro)',
                    fontWeight: 'var(--fw-bold)',
                    letterSpacing: 'var(--ls-caps)',
                    textTransform: 'uppercase',
                    color: 'var(--blue-glow)',
                  }}
                >
                  {ch.category}
                </span>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 'var(--fs-body)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {ch.text}
                </p>
                {ch.difficulty_label && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: 'var(--space-4)',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body-sm)',
                      color: 'var(--text-tertiary)',
                    }}
                  >
                    {ch.difficulty_label} · {ch.points} pts
                  </span>
                )}
              </div>
              {ch.done ? (
                <Icon name="check-circle" size={22} color="var(--success)" />
              ) : (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={foraDaJanela}
                  onClick={() => setComprovando(ch)}
                >
                  Cumprir
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {comprovando && (
        <Comprovar
          desafio={comprovando}
          groupId={group.id}
          data={dados.date}
          onFechar={() => setComprovando(null)}
          onPronto={() => { setComprovando(null); carregar() }}
        />
      )}
    </Tela>
  )
}

function Comprovar({ desafio, groupId, data, onFechar, onPronto }) {
  const [foto, setFoto] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const escolher = async () => {
    const f = await pickImage()
    if (!f) return
    setFoto(await fileToCompressedDataURL(f))
  }

  const enviar = async () => {
    if (ocupado || !foto) return
    setOcupado(true)
    setErro('')
    try {
      await api.setChallenge(groupId, { date: data, category: desafio.category, image: foto })
      onPronto()
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Comprovar desafio"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={enviar} disabled={ocupado || !foto}>
            {ocupado ? 'Enviando…' : 'Concluir'}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
        {desafio.text}
      </p>
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
        A foto é o que faz o desafio valer ponto — sem ela, não conta.
      </p>

      {foto ? (
        <img
          src={foto}
          alt=""
          style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 'var(--radius-lg)' }}
        />
      ) : null}

      <Button variant="secondary" fullWidth iconLeft="camera" onClick={escolher}>
        {foto ? 'Trocar foto' : 'Tirar ou escolher foto'}
      </Button>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
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
          Desafio de hoje
        </h1>
      </header>
      {children}
    </div>
  )
}
