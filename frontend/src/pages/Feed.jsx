import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Button, Card, Icon, IconButton } from '../design-system/components/index.js'

function haQuanto(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

const chaveDoDia = (a) => a.day || (a.created_at ? a.created_at.slice(0, 10) : '')

function rotuloDoDia(iso) {
  if (!iso) return ''
  const d = new Date(`${iso}T00:00`)
  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diff = Math.round((hoje - d) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Ontem'
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })
}

export default function Feed() {
  const { groupId, myId } = useApp()
  const [itens, setItens] = useState(null)
  const [tipos, setTipos] = useState([])
  const [erro, setErro] = useState(null)
  const [zoom, setZoom] = useState(null)

  const carregar = useCallback(() => {
    if (!groupId) return
    api
      .activities(groupId)
      .then((d) => {
        setItens(d.activities)
        if (d.reaction_types) setTipos(d.reaction_types)
      })
      .catch((e) => setErro(e.message))
  }, [groupId])

  useEffect(() => {
    carregar()
  }, [carregar])

  useEffect(() => {
    const t = setInterval(carregar, 15000)
    return () => clearInterval(t)
  }, [carregar])

  const atualizar = (aid, mudanca) =>
    setItens((prev) => prev.map((a) => (a.id === aid ? { ...a, ...mudanca } : a)))

  // Agrupa por dia preservando a ordem em que o feed veio.
  const dias = []
  const indice = {}
  for (const a of itens || []) {
    const k = chaveDoDia(a)
    if (!(k in indice)) {
      indice[k] = dias.length
      dias.push({ key: k, items: [] })
    }
    dias[indice[k]].items.push(a)
  }

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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-8)',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-1)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            Feed
          </h1>
          <p
            style={{
              margin: 'var(--space-2) 0 0',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body)',
              color: 'var(--text-secondary)',
            }}
          >
            O que o grupo andou fazendo.
          </p>
        </div>
        <Link to="/mural" aria-label="Mural de fotos">
          <IconButton icon="image" label="Mural de fotos" />
        </Link>
      </header>

      {erro && <p style={{ color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      {itens === null && !erro && (
        <p style={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          Carregando…
        </p>
      )}

      {itens && itens.length === 0 && (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Ainda sem atividades. Registre um treino ou cumpra um desafio — aparece aqui.
          </p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {dias.map((g) => (
          <div key={g.key} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-micro)',
                fontWeight: 'var(--fw-bold)',
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: 'var(--ls-caps)',
              }}
            >
              {rotuloDoDia(g.key)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
              {g.items.map((a) => (
                <ItemDoFeed
                  key={a.id}
                  item={a}
                  tipos={tipos}
                  groupId={groupId}
                  myId={myId}
                  onZoom={setZoom}
                  onErro={setErro}
                  onAtualizar={(mudanca) => atualizar(a.id, mudanca)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.92)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-6)',
            cursor: 'zoom-out',
          }}
        >
          <img src={zoom} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-md)' }} />
        </div>
      )}
    </div>
  )
}

function ItemDoFeed({ item, tipos, groupId, myId, onZoom, onErro, onAtualizar }) {
  const [abrindoReacoes, setAbrindoReacoes] = useState(false)
  const [comentando, setComentando] = useState(false)
  const [texto, setTexto] = useState('')
  const [ocupado, setOcupado] = useState(false)

  const rx = item.reactions || { counts: {}, mine: null, total: 0 }
  const comentarios = item.comments || []
  const emojiDe = (k) => tipos.find((r) => r.key === k)?.emoji ?? ''

  const reagir = async (chave) => {
    setAbrindoReacoes(false)
    try {
      onAtualizar({ reactions: await api.reactActivity(groupId, item.id, { reaction: chave }) })
    } catch (e) {
      onErro(e.message)
    }
  }

  const comentar = async () => {
    if (ocupado || !texto.trim()) return
    setOcupado(true)
    try {
      const r = await api.addComment(groupId, item.id, { text: texto.trim() })
      onAtualizar({ comments: r.comments })
      setTexto('')
    } catch (e) {
      onErro(e.message)
    } finally {
      setOcupado(false)
    }
  }

  const apagar = async (cid) => {
    try {
      const r = await api.deleteComment(groupId, item.id, cid)
      onAtualizar({ comments: r.comments })
    } catch (e) {
      onErro(e.message)
    }
  }

  return (
    <Card>
      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <Avatar src={item.photo} name={item.author} size={36} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
            <span style={{ fontWeight: 'var(--fw-semibold)' }}>{item.author}</span> {item.text}
          </div>

          {item.image && (
            <img
              src={item.image}
              alt=""
              loading="lazy"
              onClick={() => onZoom(item.image)}
              style={{
                marginTop: 'var(--space-5)',
                width: '100%',
                maxHeight: 300,
                objectFit: 'cover',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--line-hairline)',
                cursor: 'pointer',
              }}
            />
          )}

          <div
            style={{
              marginTop: 'var(--space-5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 'var(--fs-micro)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {haQuanto(item.created_at)}
              </span>
              {rx.total > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                  {Object.keys(rx.counts).map((k) => (
                    <span key={k} style={{ fontSize: 14 }}>
                      {emojiDe(k)}
                    </span>
                  ))}
                  <span
                    style={{
                      fontFamily: 'var(--font-ui)',
                      fontVariantNumeric: 'tabular-nums',
                      fontSize: 'var(--fs-micro)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {rx.total}
                  </span>
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', position: 'relative' }}>
              <AcaoDoItem
                ativo={!!rx.mine}
                onClick={() => setAbrindoReacoes((v) => !v)}
                conteudo={rx.mine ? emojiDe(rx.mine) : null}
                icone="heart"
                rotulo="Reagir"
              />
              <AcaoDoItem
                ativo={comentando}
                onClick={() => setComentando((v) => !v)}
                icone="message-square"
                rotulo={comentarios.length ? String(comentarios.length) : 'Comentar'}
              />

              {/* As reações seguem sendo emoji — é o único lugar da interface,
                  junto das mensagens de grupo, onde eles continuam. */}
              {abrindoReacoes && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    right: 0,
                    display: 'flex',
                    gap: 'var(--space-2)',
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--surface-glass)',
                    border: '1px solid rgba(255,255,255,.12)',
                    backdropFilter: 'var(--blur-glass)',
                    boxShadow: 'var(--shadow-pop)',
                    zIndex: 20,
                  }}
                >
                  {tipos.map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      title={t.label}
                      onClick={() => reagir(t.key)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 19,
                        background: rx.mine === t.key ? 'var(--surface-pill)' : 'transparent',
                      }}
                    >
                      {t.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {(comentarios.length > 0 || comentando) && (
            <div
              style={{
                marginTop: 'var(--space-5)',
                paddingTop: 'var(--space-5)',
                borderTop: '1px solid var(--line-hairline)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              {comentarios.map((c) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-4)' }}>
                  <Avatar src={c.photo} name={c.author} size={24} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 'var(--fw-semibold)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      {c.author}
                    </span>{' '}
                    <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                      {c.text}
                    </span>
                  </div>
                  {c.membership_id === myId && (
                    <IconButton icon="x" label="Apagar comentário" size={24} tone="bare" onClick={() => apagar(c.id)} />
                  )}
                </div>
              ))}

              {comentando && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                  <input
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && comentar()}
                    placeholder="Escreva um comentário"
                    autoFocus
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: 'var(--control-h-sm)',
                      padding: '0 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-input)',
                      border: 'var(--border-input)',
                      outline: 'none',
                      fontFamily: 'var(--font-ui)',
                      fontSize: 'var(--fs-body-sm)',
                      color: 'var(--text-primary)',
                    }}
                  />
                  <Button size="sm" variant="accent" onClick={comentar} disabled={ocupado || !texto.trim()}>
                    Enviar
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

function AcaoDoItem({ ativo, onClick, conteudo, icone, rotulo }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        height: 26,
        padding: '0 10px',
        borderRadius: 'var(--radius-pill)',
        border: 'none',
        cursor: 'pointer',
        background: ativo ? 'var(--surface-pill)' : 'var(--surface-chip)',
        color: ativo ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-micro)',
        fontWeight: 'var(--fw-medium)',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {conteudo ? <span style={{ fontSize: 14 }}>{conteudo}</span> : <Icon name={icone} size={12} />}
      {rotulo}
    </button>
  )
}
