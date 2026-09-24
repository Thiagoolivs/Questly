import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import { Button, Card, Icon } from '../design-system/components/index.js'
import VoltarPara from '../components/VoltarPara.jsx'
import Compartilhar from '../components/Compartilhar.jsx'

/**
 * Conquistas — duas famílias, separadas na tela.
 *
 * "Seu progresso" mede o que a pessoa faz sozinha (hábito, rotina, sequência,
 * treino) e vale em qualquer espaço. "Desafio do grupo" mede o desafio diário
 * por área, e só aparece onde esse lado do app está em uso. Antes só existia a
 * segunda: quem usava o app pelo Meu Dia via uma prateleira inteira de medalhas
 * que não tinha como tirar.
 */
const GRUPOS = [
  { scope: 'pessoal', titulo: 'Seu progresso', explica: 'Valem em qualquer espaço — dependem só de você.' },
  { scope: 'grupo', titulo: 'Desafio do grupo', explica: 'Dependem dos hábitos fixos e dos desafios por área.' },
]

export default function Conquistas() {
  const { groupId, viewId } = useApp()
  const [list, setList] = useState(null)
  const [err, setErr] = useState(null)
  const [compartilhando, setCompartilhando] = useState(null)

  useEffect(() => {
    if (!groupId || !viewId) return
    setList(null)
    api.achievements(groupId, viewId).then((d) => setList(d.achievements)).catch((e) => setErr(e.message))
  }, [groupId, viewId])

  if (err) return <div className="screen center error" style={{ padding: 'var(--space-6)', color: 'var(--danger)' }}>{err}</div>
  if (!list) return <div className="screen center muted" style={{ padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>Carregando…</div>

  const unlocked = list.filter((a) => a.unlocked).length
  // Uma medalha em andamento diz mais que dez paradas no zero: a mais perto de
  // sair vem primeiro dentro de cada família.
  const ordenar = (itens) =>
    [...itens].sort((a, b) => {
      if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1
      return b.current / b.target - a.current / a.target
    })

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'calc(var(--space-11) + var(--space-8))' }}>
      {/* Cabeçalho numa linha só: voltar, título, e o contador à direita. Antes
          havia um flex dentro do flex empurrando o contador para cima do
          título em telas estreitas. */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
        <VoltarPara para="/plano" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            Conquistas
          </h1>
          <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
            {unlocked} de {list.length} desbloqueadas
          </p>
        </div>
        <span
          style={{
            flex: 'none',
            fontFamily: 'var(--font-ui)',
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--blue-glow)',
            background: 'var(--surface-accent-soft)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
          }}
        >
          {unlocked}/{list.length}
        </span>
      </header>

      <PlayerSwitch />

      {GRUPOS.map(({ scope, titulo, explica }) => {
        // `scope` só existe na resposta nova; sem ele tudo cai em "grupo", que
        // é o que as medalhas antigas sempre foram.
        const itens = ordenar(list.filter((a) => (a.scope ?? 'grupo') === scope))
        if (itens.length === 0) return null
        return (
          <section key={scope} style={{ marginBottom: 'var(--space-8)' }}>
            <h2
              style={{
                margin: '0 0 2px',
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-micro)',
                fontWeight: 'var(--fw-bold)',
                letterSpacing: 'var(--ls-caps)',
                textTransform: 'uppercase',
                color: 'var(--text-tertiary)',
              }}
            >
              {titulo}
            </h2>
            <p style={{ margin: '0 0 var(--space-5)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
              {explica}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 'var(--space-4)' }}>
              {itens.map((a) => (
                <Medalha
                  key={a.key}
                  conquista={a}
                  // Só as pessoais: as do desafio do grupo já acontecem à vista
                  // de todos no feed, e o servidor não as valida para partilha.
                  onCompartilhar={
                    a.unlocked && scope === 'pessoal' ? () => setCompartilhando(a) : null
                  }
                />
              ))}
            </div>
          </section>
        )
      })}

      <Compartilhar
        aberto={!!compartilhando}
        titulo="Compartilhar conquista"
        fixo={compartilhando && {
          kind: 'achievement',
          ref: compartilhando.key,
          icon: compartilhando.icon,
          text: `desbloqueou: ${compartilhando.name}`,
        }}
        onFechar={() => setCompartilhando(null)}
      />
    </div>
  )
}

function Medalha({ conquista: a, onCompartilhar }) {
  const pct = Math.min(100, (a.current / a.target) * 100)
  return (
    <Card
      style={{
        opacity: a.unlocked ? 1 : 0.6,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        border: a.unlocked ? '1px solid var(--blue-glow)' : '1px solid transparent',
      }}
    >
      <div
        style={{
          width: 56, height: 56, borderRadius: 28,
          background: a.unlocked ? 'var(--blue-glow)' : 'var(--surface-input)',
          color: a.unlocked ? '#fff' : 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--space-3)',
        }}
      >
        {/* O ícone próprio da medalha, que o catálogo sempre definiu e a tela
            nunca desenhou — todas saíam iguais. */}
        <Icon name={a.unlocked ? (a.icon || 'award') : 'lock'} size={28} />
      </div>

      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>{a.name}</div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-secondary)', marginBottom: 'var(--space-3)', flex: 1 }}>{a.desc}</div>

      <div style={{ width: '100%' }}>
        <div style={{ height: 4, background: 'var(--surface-input)', borderRadius: 2, overflow: 'hidden', marginBottom: 'var(--space-1)' }}>
          <div style={{ height: '100%', background: a.unlocked ? 'var(--blue-glow)' : 'var(--text-tertiary)', width: `${pct}%` }} />
        </div>
        <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 10, color: 'var(--text-tertiary)', textAlign: 'right' }}>
          {a.current}/{a.target}
        </div>
      </div>

      {onCompartilhar && (
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Button variant="ghost" size="sm" iconLeft="send" onClick={onCompartilhar}>
            Contar
          </Button>
        </div>
      )}
    </Card>
  )
}
