import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Card, Chip, Icon, ListRow } from '../design-system/components/index.js'

/**
 * Meu Plano — onde se decide o que vai acontecer. Executar é do Meu Dia.
 *
 * Essa divisão é a razão da tela existir, então ela é dita em voz alta no topo
 * e repetida em cada bloco: aqui aparecem plano, metas e regras; lá aparecem a
 * sessão de hoje e as calorias de hoje.
 */
export default function Plano() {
  const { groupId, user } = useApp()
  const [dia, setDia] = useState(null)
  const [planos, setPlanos] = useState([])
  const [metas, setMetas] = useState(null)

  const carregar = useCallback(async () => {
    const [d, t] = await Promise.allSettled([api.today(null, groupId), api.trainingPlans()])
    if (d.status === 'fulfilled') setDia(d.value)
    if (t.status === 'fulfilled') setPlanos(t.value.plans)
  }, [groupId])

  useEffect(() => {
    carregar()
  }, [carregar])

  // As metas vêm prontas do servidor. Sem peso e altura elas são só o padrão
  // genérico, e aí a tela pede os dados em vez de fingir que são pessoais.
  useEffect(() => {
    const t = user?.nutrition_targets
    setMetas(t?.has_profile ? t.targets : null)
  }, [user])

  const ativo = planos.find((p) => p.status === 'active') ?? planos[0] ?? null
  const habitos = dia?.habits ?? []
  const rotinas = dia?.routines ?? []

  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        paddingBottom: 'var(--space-11)',
      }}
    >
      <header style={{ marginBottom: 'var(--space-7)' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-1)',
            fontWeight: 'var(--fw-bold)',
            letterSpacing: 'var(--ls-title)',
            color: 'var(--text-primary)',
          }}
        >
          Meu Plano
        </h1>
        <p
          style={{
            margin: '2px 0 0',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            color: 'var(--text-tertiary)',
          }}
        >
          Aqui você decide o que vai fazer. Fazer é na aba Hoje.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Bloco
          titulo="Plano de treino"
          explica="Quantas sessões, em quais semanas, com qual objetivo."
          verTudo="/treino"
          rotuloVerTudo={ativo ? 'Editar' : null}
        >
          {ativo ? (
            <Link to="/treino" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card tone="bloom" pad="var(--pad-card-lg)">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-ui)',
                        fontSize: 'var(--fs-title-3)',
                        fontWeight: 'var(--fw-semibold)',
                        color: 'var(--text-primary)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {ativo.modality}
                    </div>
                    {ativo.goal && (
                      <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                        {ativo.goal}
                      </div>
                    )}
                  </div>
                  <Chip>{ativo.progress.percent}%</Chip>
                </div>
                <div
                  style={{
                    marginTop: 'var(--space-5)',
                    height: 6,
                    borderRadius: 999,
                    background: 'var(--surface-input)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ width: `${ativo.progress.percent}%`, height: '100%', background: 'var(--blue-glow)' }} />
                </div>
                <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
                  {ativo.progress.done} de {ativo.progress.total} sessões · {ativo.weeks}{' '}
                  {ativo.weeks === 1 ? 'semana' : 'semanas'} · {ativo.days_per_week}x por semana
                </div>
              </Card>
            </Link>
          ) : (
            <Vazio to="/treino" icone="sparkles" titulo="Montar um plano de treino">
              A IA monta as semanas e sessões a partir da sua modalidade e objetivo.
            </Vazio>
          )}
        </Bloco>

        <Bloco
          titulo="Metas de alimentação"
          explica="O alvo do dia. O que você comeu hoje aparece na aba Hoje."
          verTudo="/perfil"
          rotuloVerTudo="Ajustar"
        >
          {metas ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
                <Meta rotulo="Calorias" valor={metas.kcal} unidade="kcal" />
                <Meta rotulo="Proteína" valor={metas.protein_g} unidade="g" />
                <Meta rotulo="Carbo" valor={metas.carbs_g} unidade="g" />
                <Meta rotulo="Água" valor={metas.water_l} unidade="L" />
              </div>
              <p
                style={{
                  margin: 'var(--space-5) 0 0',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-body-sm)',
                  color: 'var(--text-tertiary)',
                }}
              >
                Calculadas do seu peso, altura, idade e nível de atividade.
              </p>
            </Card>
          ) : (
            <Vazio to="/perfil" icone="utensils" titulo="Definir metas de alimentação">
              Preencha peso, altura e objetivo no perfil — o app calcula calorias, macros e água.
            </Vazio>
          )}
        </Bloco>

        <Bloco titulo="O que se repete" explica="Rotinas e hábitos aparecem sozinhos nos dias certos.">
          <Card pad="0 var(--pad-card)">
            <Link to="/rotinas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow
                icon="repeat"
                title="Rotinas"
                subtitle={rotinas.length ? `${rotinas.length} para hoje` : 'Nenhuma criada ainda'}
                onClick={() => {}}
              />
            </Link>
            <Link to="/habitos" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow
                icon="check-circle"
                title="Hábitos"
                subtitle={habitos.length ? `${habitos.length} para hoje` : 'Nenhum criado ainda'}
                onClick={() => {}}
              />
            </Link>
            <Link to="/agenda" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow icon="calendar-days" title="Agenda" subtitle="Compromissos com dia e hora" onClick={() => {}} />
            </Link>
            <Link to="/tarefas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow icon="list-check" title="Tarefas" subtitle="O que tem data para acontecer" onClick={() => {}} divider={false} />
            </Link>
          </Card>
        </Bloco>

        <Bloco titulo="Sua evolução" explica="O que já saiu do plano e virou resultado.">
          <Card pad="0 var(--pad-card)">
            <Link to="/conquistas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow icon="trophy" title="Conquistas" subtitle="Medalhas e marcos" onClick={() => {}} divider={false} />
            </Link>
          </Card>
        </Bloco>
      </div>
    </div>
  )
}

function Bloco({ titulo, explica, verTudo, rotuloVerTudo = 'Ver tudo', children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <div style={{ minWidth: 0 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-3)',
              fontWeight: 'var(--fw-semibold)',
              color: 'var(--text-primary)',
            }}
          >
            {titulo}
          </h2>
          {explica ? (
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>
              {explica}
            </p>
          ) : null}
        </div>
        {verTudo && rotuloVerTudo ? (
          <Link
            to={verTudo}
            style={{ flex: 'none', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--blue-glow)', textDecoration: 'none' }}
          >
            {rotuloVerTudo}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Meta({ rotulo, valor, unidade = '' }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>{rotulo}</div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)', color: 'var(--text-primary)' }}>
        {valor}
        <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>{unidade}</span>
      </div>
    </div>
  )
}

function Vazio({ to, icone, titulo, children }) {
  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <Card>
        <div style={{ display: 'flex', gap: 'var(--space-5)', alignItems: 'flex-start' }}>
          <Icon name={icone} size={20} color="var(--blue-glow)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-ui)',
                fontSize: 'var(--fs-body)',
                fontWeight: 'var(--fw-medium)',
                color: 'var(--text-primary)',
              }}
            >
              {titulo}
            </div>
            <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
              {children}
            </p>
          </div>
          <Icon name="chevron-right" size={16} color="var(--text-tertiary)" />
        </div>
      </Card>
    </Link>
  )
}
