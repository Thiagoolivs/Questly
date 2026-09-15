import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton } from '../design-system/components/index.js'

/**
 * Mural — espaço próprio das fotos.
 *
 * Saiu de dentro do feed porque são coisas diferentes: o feed é cronológico e
 * conversado, o mural é a parede de provas da semana. Aqui a foto vem primeiro
 * e o resumo da semana fica como contexto, não como manchete.
 */
function dataCurta(iso) {
  return new Date(`${iso}T00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function Mural() {
  const navigate = useNavigate()
  const { groupId } = useApp()
  const [semanas, setSemanas] = useState(null)
  const [erro, setErro] = useState(null)
  const [zoom, setZoom] = useState(null)

  useEffect(() => {
    if (!groupId) return
    api
      .gallery(groupId)
      .then((d) => setSemanas(d.weeks))
      .catch((e) => setErro(e.message))
  }, [groupId])

  const totalFotos = (semanas ?? []).reduce((n, w) => n + w.photos.length, 0)

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
        gap: 'var(--space-7)',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
        <IconButton icon="arrow-left" label="Voltar" onClick={() => navigate('/feed')} />
        <div style={{ flex: 1 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-2)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            Mural
          </h1>
        </div>
        {totalFotos > 0 && <Chip>{totalFotos} fotos</Chip>}
      </header>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}

      {!groupId && (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            O mural é do espaço — crie ou entre em um para começar.
          </p>
          <div style={{ marginTop: 'var(--space-5)' }}>
            <Button variant="accent" onClick={() => navigate('/grupo')}>
              Ver espaços
            </Button>
          </div>
        </Card>
      )}

      {semanas === null && groupId && !erro && (
        <p style={{ margin: 0, color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)' }}>
          Carregando…
        </p>
      )}

      {semanas && totalFotos === 0 && (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Nenhuma foto ainda. As comprovações de desafio e as fotos de atividade
            aparecem aqui.
          </p>
        </Card>
      )}

      {(semanas ?? [])
        .filter((w) => w.photos.length > 0)
        .map((w) => (
          <section key={w.week_start}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-5)',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-micro)',
                  fontWeight: 'var(--fw-bold)',
                  letterSpacing: 'var(--ls-caps)',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}
              >
                Semana de {w.label}
              </h2>
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 'var(--fs-micro)',
                  color: 'var(--text-tertiary)',
                }}
              >
                {w.retro.group_points} pts
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
              {w.photos.map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setZoom(p)}
                  style={{
                    aspectRatio: '1',
                    padding: 0,
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    background: 'var(--surface-card)',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  <img
                    src={p.image}
                    alt={p.label}
                    loading="lazy"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          </section>
        ))}

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(0,0,0,.94)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: 'var(--space-6)' }}>
            <IconButton icon="x" label="Fechar" tone="glass" onClick={() => setZoom(null)} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
            <img
              src={zoom.image}
              alt={zoom.label}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
            />
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: 'var(--space-7) var(--gutter-screen)',
              paddingBottom: 'calc(var(--space-8) + env(safe-area-inset-bottom, 0px))',
              background: 'var(--scrim-bottom)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--full-white)',
              }}
            >
              {zoom.icon ? <Icon name={zoom.icon} size={15} color="var(--full-white)" /> : null}
              {zoom.label}
            </div>
            <div
              style={{
                marginTop: 2,
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body-sm)',
                color: 'rgba(255,255,255,.72)',
              }}
            >
              {zoom.author} · {dataCurta(zoom.date)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
