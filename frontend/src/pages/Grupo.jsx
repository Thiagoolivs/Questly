import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Avatar, Button, Card, Chip, Icon, IconButton, Input, ListRow } from '../design-system/components/index.js'
import { shareInvite } from '../utils/invite.js'
import Sheet from '../components/Sheet.jsx'
import { useToast } from '../components/Toast.jsx'
import Grupos from './Grupos.jsx'

const MEDALHA = ['var(--warning)', 'var(--text-secondary)', '#b08d57']
const ALTURA_PODIO = 76 // a faixa dos degraus: todos terminam na mesma linha

/**
 * A tela do grupo é o lado competitivo do app: quem está na frente, por quanto,
 * e quanto tempo falta. Tudo o mais (chat, mural, desafio) é secundário e mora
 * embaixo do placar.
 */
export default function Grupo() {
  const { group } = useApp()
  const aviso = useToast()
  const [dados, setDados] = useState(null)
  const [metas, setMetas] = useState(null)
  const [duelo, setDuelo] = useState(null)
  const [cutucados, setCutucados] = useState([])
  const [criandoMeta, setCriandoMeta] = useState(false)
  const [erro, setErro] = useState(null)

  const carregar = useCallback(async () => {
    if (!group?.id) return
    try {
      setDados(await api.ranking(group.id))
    } catch (e) {
      setErro(e.message)
    }
  }, [group?.id])

  // Metas e duelo vêm à parte: se qualquer um falhar, o placar já está na tela.
  const carregarExtras = useCallback(async () => {
    if (!group?.id) return
    const [t, d] = await Promise.allSettled([api.targets(group.id), api.duel(group.id)])
    if (t.status === 'fulfilled') setMetas(t.value)
    if (d.status === 'fulfilled') setDuelo(d.value)
  }, [group?.id])

  useEffect(() => {
    carregar()
    carregarExtras()
  }, [carregar, carregarExtras])

  // Um empurrão por pessoa por dia: o botão some depois de usado, em vez de
  // deixar a pessoa tocar de novo e receber um erro.
  const cutucar = async (membro, kind) => {
    try {
      await api.nudge(group.id, { membership_id: membro.membership_id, kind })
      setCutucados((atual) => [...atual, membro.membership_id])
      aviso({
        text: kind === 'aplauso'
          ? `Aplauso enviado para ${membro.name.split(' ')[0]}`
          : `Força enviada para ${membro.name.split(' ')[0]}`,
        icon: kind === 'aplauso' ? 'star' : 'flame',
        tone: 'success',
      })
    } catch (e) {
      setErro(e.message)
    }
  }

  if (!group?.id) return <Grupos />

  const eu = dados?.me ?? null
  const ranking = dados?.ranking ?? []
  const competitivo = !!dados?.competitive
  // Com três pessoas ou menos, a classificação já mostra todo mundo com a cor
  // da medalha — repetir num pódio seria a mesma lista duas vezes.
  const podio = ranking.length >= 4 ? ranking.slice(0, 3) : []
  const restantes = podio.length ? ranking.slice(3) : ranking

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
      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-1)',
              fontWeight: 'var(--fw-bold)',
              letterSpacing: 'var(--ls-title)',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {group.name}
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            {group.member_count ?? ranking.length ?? 1}{' '}
            {(group.member_count ?? 1) === 1 ? 'participante' : 'participantes'}
            {dados ? ` · ${dados.period}` : ''}
          </p>
        </div>
        <Link to="/grupo/config" style={{ flex: 'none' }}>
          <IconButton icon="settings" label="Configurações do grupo" size={36} />
        </Link>
      </header>

      {erro ? (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--danger)' }}>
          {erro}
        </p>
      ) : null}

      {/* O placar entra primeiro e sempre — enquanto carrega fica um esqueleto
          do mesmo tamanho, senão a tela abria só com "Ações" e o placar caía
          em cima depois. */}
      {dados ? <Placar eu={eu} dados={dados} competitivo={competitivo} /> : <PlacarEsqueleto />}

      {competitivo && podio.length === 3 ? (
        <Podio podio={podio} cutucados={cutucados} onCutucar={cutucar} />
      ) : null}

      {duelo?.active ? <Duelo duelo={duelo} /> : null}

      <MetasDoGrupo
        metas={metas}
        onCriar={() => setCriandoMeta(true)}
        onEncerrar={async (id) => {
          await api.endTarget(group.id, id)
          carregarExtras()
          aviso({ text: 'Meta encerrada', icon: 'trash' })
        }}
      />

      {competitivo && restantes.length > 0 ? (
        <section>
          <TituloSecao>{podio.length ? 'Demais posições' : 'Classificação'}</TituloSecao>
          <Card pad="0 var(--pad-card)">
            {restantes.map((r, i) => (
              <ListRow
                key={r.membership_id}
                divider={i < restantes.length - 1}
                chevron={false}
                leading={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span
                      style={{
                        width: 18,
                        textAlign: 'center',
                        fontFamily: 'var(--font-ui)',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'var(--fs-body-sm)',
                        fontWeight: 'var(--fw-bold)',
                        color: MEDALHA[r.position - 1] ?? 'var(--text-tertiary)',
                      }}
                    >
                      {r.position}
                    </span>
                    <Avatar src={r.photo} name={r.name} size={32} />
                  </div>
                }
                title={
                  <span style={{ fontWeight: r.is_me ? 'var(--fw-semibold)' : 'var(--fw-regular)' }}>
                    {r.name}
                    {r.is_me ? ' · você' : ''}
                  </span>
                }
                subtitle={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span>Nível {r.level}</span>
                    {r.streak > 0 ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--warning)' }}>
                        <Icon name="flame" size={12} color="var(--warning)" />
                        {r.streak}
                      </span>
                    ) : null}
                  </span>
                }
                trailing={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* O feed deixa reagir a quem postou; faltava gesto para
                        quem não postou nada — que é quem mais precisa. */}
                    {!r.is_me && !cutucados.includes(r.membership_id) && (
                      <IconButton
                        icon={r.position < (eu?.position ?? 99) ? 'star' : 'flame'}
                        tone="bare"
                        size={30}
                        label={r.position < (eu?.position ?? 99)
                          ? `Aplaudir ${r.name}`
                          : `Mandar força para ${r.name}`}
                        onClick={() => cutucar(r, r.position < (eu?.position ?? 99) ? 'aplauso' : 'forca')}
                      />
                    )}
                    <span
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontVariantNumeric: 'tabular-nums',
                        fontSize: 'var(--fs-body)',
                        fontWeight: 'var(--fw-semibold)',
                        color: r.is_me ? 'var(--blue-glow)' : 'var(--text-primary)',
                      }}
                    >
                      {r.total_score}
                    </span>
                  </span>
                }
              />
            ))}
          </Card>
        </section>
      ) : null}

      {criandoMeta && (
        <NovaMeta
          metricas={metas?.metrics ?? []}
          onFechar={() => setCriandoMeta(false)}
          onCriar={async (corpo) => {
            await api.createTarget(group.id, corpo)
            setCriandoMeta(false)
            carregarExtras()
            aviso({ text: 'Meta do grupo criada', icon: 'target', tone: 'success' })
          }}
        />
      )}

      {group.rules?.invite && group.invite_code ? (
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-micro)',
                  letterSpacing: 'var(--ls-caps)',
                  textTransform: 'uppercase',
                  color: 'var(--text-tertiary)',
                }}
              >
                Código de convite
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 'var(--fs-title-3)',
                  fontWeight: 'var(--fw-semibold)',
                  letterSpacing: '.08em',
                  color: 'var(--text-primary)',
                }}
              >
                {group.invite_code}
              </div>
            </div>
            <Button size="sm" variant="secondary" iconLeft="share" onClick={() => shareInvite(group.invite_code, group.name)}>
              Convidar
            </Button>
          </div>
        </Card>
      ) : null}

      <section>
        <TituloSecao>Espaço do grupo</TituloSecao>
        <Card pad="0 var(--pad-card)">
          <Link to="/desafio" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow icon="target" title="Desafio do dia" subtitle="Vale pontos extras no placar" onClick={() => {}} />
          </Link>
          <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow icon="message-square" title="Conversa" subtitle="Combinar treino, provocar, comemorar" onClick={() => {}} />
          </Link>
          <Link to="/mural" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow icon="image" title="Mural" subtitle="As fotos do grupo" onClick={() => {}} divider={false} />
          </Link>
        </Card>
      </section>
    </div>
  )
}

/** O número grande da tela: pontos do mês, posição e distância. */
function Placar({ eu, dados, competitivo }) {
  const pontos = eu?.total_score ?? 0
  const posicao = eu?.position ?? 1
  const total = dados.ranking.length

  return (
    <Card tone="bloom" pad="var(--pad-card-lg)" glow>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-micro)',
              letterSpacing: 'var(--ls-caps)',
              textTransform: 'uppercase',
              color: 'var(--text-tertiary)',
            }}
          >
            Seus pontos no mês
          </div>
          <div
            style={{
              marginTop: 'var(--space-2)',
              display: 'flex',
              alignItems: 'baseline',
              gap: 'var(--space-3)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-numeric)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 'var(--fs-num-hero)',
                fontWeight: 'var(--fw-numeric)',
                lineHeight: 'var(--lh-tight)',
                color: 'var(--text-primary)',
              }}
            >
              {pontos}
            </span>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
              pts
            </span>
          </div>
        </div>

        {competitivo ? (
          <div style={{ flex: 'none', textAlign: 'right' }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-micro)',
                letterSpacing: 'var(--ls-caps)',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              Posição
            </div>
            <div
              style={{
                marginTop: 'var(--space-2)',
                fontFamily: 'var(--font-ui)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 'var(--fs-title-1)',
                fontWeight: 'var(--fw-bold)',
                lineHeight: 'var(--lh-tight)',
                color: MEDALHA[posicao - 1] ?? 'var(--text-primary)',
              }}
            >
              {posicao}
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', fontWeight: 'var(--fw-regular)', color: 'var(--text-tertiary)' }}>
                /{total}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <p
        style={{
          margin: 'var(--space-5) 0 0',
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {frase(eu, dados, competitivo)}
      </p>

      {eu ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
          <Chip>Esforço {eu.effort_score}</Chip>
          {/* Constância é o ponto do hábito e da rotina cumpridos, mais o bônus
              dos marcos de sequência. Sem ela na tela, quem só marca hábitos
              não entende de onde veio o próprio placar. */}
          <Chip>Constância {eu.habit_score ?? 0}</Chip>
          <Chip>Consistência {eu.consistency_score}</Chip>
          <Chip>Desafios {eu.challenge_score}</Chip>
        </div>
      ) : null}
    </Card>
  )
}

/** A linha que dá o motivo de voltar amanhã. */
function frase(eu, dados, competitivo) {
  const d = dados.days_left
  const prazo = d <= 0 ? 'último dia do mês' : d === 1 ? 'resta 1 dia no mês' : `restam ${d} dias no mês`
  if (!competitivo || !eu) return `O placar zera quando o mês virar — ${prazo}.`
  if (eu.position === 1) {
    const atras = dados.ranking[1]
    const margem = atras ? eu.total_score - atras.total_score : 0
    return margem > 0
      ? `Você lidera por ${margem} pts — ${prazo}.`
      : `Você lidera, mas empatado — ${prazo}.`
  }
  const acima = dados.ranking[eu.position - 2]
  return `${eu.gap_to_next} pts para passar ${acima.name.split(' ')[0]} — ${prazo}.`
}

function PlacarEsqueleto() {
  return (
    <Card tone="bloom" pad="var(--pad-card-lg)">
      <div style={{ height: 14, width: 120, borderRadius: 999, background: 'var(--surface-input)' }} />
      <div style={{ marginTop: 'var(--space-4)', height: 44, width: 150, borderRadius: 'var(--radius-md)', background: 'var(--surface-input)' }} />
      <div style={{ marginTop: 'var(--space-5)', height: 12, width: '70%', borderRadius: 999, background: 'var(--surface-input)' }} />
    </Card>
  )
}

function Podio({ podio, cutucados, onCutucar }) {
  // Ordem visual clássica: 2º, 1º, 3º — o campeão fica no meio e mais alto.
  const ordem = [podio[1], podio[0], podio[2]].filter(Boolean)
  const alturas = { 1: 76, 2: 56, 3: 44 }

  return (
    <Card pad="var(--pad-card-lg)">
      {/* Os degraus terminam todos na mesma linha de baixo; só a altura do
          degrau muda. Sem isso o avatar maior do campeão empurrava o degrau
          dele para baixo e o pódio saía torto. */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 'var(--space-4)' }}>
        {ordem.map((p) => (
          <div key={p.membership_id} style={{ flex: 1, minWidth: 0, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Avatar src={p.photo} name={p.name} size={p.position === 1 ? 52 : 40} />
            </div>
            <div
              style={{
                marginTop: 'var(--space-3)',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-label)',
                fontWeight: p.is_me ? 'var(--fw-semibold)' : 'var(--fw-medium)',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {p.name.split(' ')[0]}
            </div>
            {/* Sem isto, aplaudir era impossível justamente para quem está indo
                melhor: o pódio tira os três primeiros da lista de baixo. */}
            <div style={{ height: 30, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {!p.is_me && !cutucados.includes(p.membership_id) && (
                <IconButton
                  icon="star"
                  tone="bare"
                  size={28}
                  label={`Aplaudir ${p.name}`}
                  onClick={() => onCutucar(p, 'aplauso')}
                />
              )}
            </div>
            <div
              style={{
                marginTop: 'var(--space-3)',
                height: ALTURA_PODIO,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
            <div
              style={{
                width: '100%',
                height: alturas[p.position] ?? 44,
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                background: `linear-gradient(180deg, ${MEDALHA[p.position - 1]} 0%, transparent 180%)`,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'center',
                paddingTop: 'var(--space-3)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-ui)',
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 'var(--fs-body)',
                  fontWeight: 'var(--fw-bold)',
                  color: 'var(--full-white)',
                }}
              >
                {p.total_score}
              </span>
            </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

/**
 * Duelo da semana.
 *
 * O placar mensal desanima quem ficou para trás na primeira semana: em pouco
 * tempo o líder disparou e o resto já sabe o resultado. O duelo recomeça toda
 * segunda, contra outra pessoa, e cabe numa semana — dá para virar.
 */
function Duelo({ duelo }) {
  const cor = { me: 'var(--success)', rival: 'var(--warning)', tie: 'var(--text-tertiary)' }[duelo.leading]
  const frase = {
    me: 'Você está na frente',
    rival: `${duelo.rival.name.split(' ')[0]} está na frente`,
    tie: 'Empatados',
  }[duelo.leading]

  return (
    <section>
      <TituloSecao>Duelo da semana</TituloSecao>
      <Card pad="var(--pad-card-lg)">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          <Lado pessoa={duelo.me} rotulo="Você" destaque={duelo.leading === 'me'} />
          <span
            style={{
              flex: 'none',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            ×
          </span>
          <Lado pessoa={duelo.rival} rotulo={duelo.rival.name.split(' ')[0]} destaque={duelo.leading === 'rival'} />
        </div>
        <p
          style={{
            margin: 'var(--space-5) 0 0',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--text-secondary)',
          }}
        >
          <span style={{ color: cor, fontWeight: 'var(--fw-semibold)' }}>{frase}</span>
          {' em dias fechados · '}
          {duelo.days_left === 0 ? 'último dia' : `${duelo.days_left} dias para virar`}
        </p>
      </Card>
    </section>
  )
}

function Lado({ pessoa, rotulo, destaque }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
      <Avatar src={pessoa.photo} name={pessoa.name} size={36} />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'var(--fs-title-3)',
            fontWeight: 'var(--fw-bold)',
            color: destaque ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          {pessoa.days_closed}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-micro)',
            color: 'var(--text-tertiary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {rotulo}
        </div>
      </div>
    </div>
  )
}

/**
 * Meta que o grupo soma junto.
 *
 * É o contrapeso do ranking: com placar, quem está em último tem cada vez menos
 * motivo para continuar. Aqui o que cada um faz conta para todos, então o
 * último ainda é útil ao time — e o primeiro tem motivo para puxá-lo.
 */
function MetasDoGrupo({ metas, onCriar, onEncerrar }) {
  if (!metas) return null
  const lista = metas.targets ?? []

  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
        <TituloSecao>Meta do grupo</TituloSecao>
        <Button variant="ghost" size="sm" iconLeft="plus" onClick={onCriar}>
          Nova
        </Button>
      </div>

      {lista.length === 0 ? (
        <Card>
          <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            Uma meta somada por todos — 100 km, 40 treinos, 60 dias fechados. No
            placar só um ganha; aqui o grupo ganha junto.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-card)' }}>
          {lista.map((meta) => (
            <Card key={meta.id} pad="var(--pad-card-lg)">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-5)' }}>
                <Icon name={meta.icon || 'target'} size={18} color="var(--blue-glow)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)' }}>
                    {meta.title}
                  </div>
                  <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                    {meta.total} de {meta.target} {meta.metric_label}
                    {meta.done ? ' · alcançada' : meta.ended ? ' · encerrada' : ` · ${meta.days_left} dias`}
                  </div>
                </div>
                <IconButton icon="trash" tone="bare" size={30} label={`Encerrar ${meta.title}`} onClick={() => onEncerrar(meta.id)} />
              </div>

              <div style={{ marginTop: 'var(--space-5)', height: 6, borderRadius: 999, background: 'var(--surface-input)', overflow: 'hidden' }}>
                <div style={{ width: `${meta.percent}%`, height: '100%', background: meta.done ? 'var(--success)' : 'var(--blue-glow)' }} />
              </div>

              {/* Quem pôs quanto — não é ranking: é para saber de quem pedir. */}
              <div style={{ marginTop: 'var(--space-5)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {meta.members.filter((x) => x.value > 0).map((x) => (
                  <Chip key={x.membership_id}>
                    {x.name.split(' ')[0]} {x.value}
                  </Chip>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  )
}

function NovaMeta({ metricas, onFechar, onCriar }) {
  const [titulo, setTitulo] = useState('')
  const [metrica, setMetrica] = useState('km')
  const [alvo, setAlvo] = useState('100')
  const [dias, setDias] = useState('30')
  const [ocupado, setOcupado] = useState(false)
  const [erro, setErro] = useState('')

  const salvar = async () => {
    if (ocupado || !titulo.trim() || !Number(alvo)) return
    setOcupado(true)
    setErro('')
    try {
      await onCriar({
        title: titulo.trim(),
        metric: metrica,
        target: Number(alvo),
        days: Number(dias) || 30,
      })
    } catch (e) {
      setErro(e.message)
      setOcupado(false)
    }
  }

  return (
    <Sheet
      title="Meta do grupo"
      onClose={onFechar}
      footer={
        <>
          <Button variant="ghost" fullWidth onClick={onFechar} disabled={ocupado}>
            Cancelar
          </Button>
          <Button variant="accent" fullWidth onClick={salvar} disabled={ocupado || !titulo.trim() || !Number(alvo)}>
            {ocupado ? 'Criando…' : 'Criar'}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
        Vale para todo mundo do grupo: o que cada um fizer soma no mesmo número.
      </p>

      <Input
        label="Meta"
        placeholder="100 km juntos, 40 treinos no mês…"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        autoFocus
      />

      <div>
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
          O que somar
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          {metricas.map((x) => (
            <Chip key={x.value} selected={metrica === x.value} onClick={() => setMetrica(x.value)}>
              {x.label}
            </Chip>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-5)' }}>
        <div style={{ flex: 1 }}>
          <Input
            label="Alvo"
            type="number"
            inputMode="decimal"
            value={alvo}
            onChange={(e) => setAlvo(e.target.value)}
          />
        </div>
        <div style={{ flex: 1 }}>
          <Input
            label="Em quantos dias"
            type="number"
            inputMode="numeric"
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
        </div>
      </div>

      {erro && <p style={{ margin: 0, color: 'var(--danger)', fontSize: 'var(--fs-body-sm)' }}>{erro}</p>}
    </Sheet>
  )
}

function TituloSecao({ children }) {
  return (
    <h2
      style={{
        margin: '0 0 var(--space-4)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-title-3)',
        fontWeight: 'var(--fw-semibold)',
        color: 'var(--text-primary)',
      }}
    >
      {children}
    </h2>
  )
}
