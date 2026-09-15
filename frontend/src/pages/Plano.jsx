import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useApp } from '../store.jsx'
import { Card, Chip, Icon, ListRow } from '../design-system/components/index.js'

/**
 * Meu Plano — onde se planeja, e não onde se executa (isso é o Meu Dia).
 *
 * Treino e nutrição ficam lado a lado de propósito: são a mesma conta vista de
 * dois lados, e separá-los em abas distantes é o que faz parecerem assuntos
 * diferentes.
 */
export default function Plano() {
  const { group } = useApp()
  const [dia, setDia] = useState(null)
  const [planos, setPlanos] = useState([])
  const [nutricao, setNutricao] = useState(null)

  const carregar = useCallback(async () => {
    const [d, t] = await Promise.allSettled([api.today(), api.trainingPlans()])
    if (d.status === 'fulfilled') setDia(d.value)
    if (t.status === 'fulfilled') setPlanos(t.value.plans)

    if (group) {
      const e = await Promise.allSettled([api.state(group.id)])
      if (e[0].status === 'fulfilled') setNutricao(e[0].value?.nutrition ?? null)
    }
  }, [group])

  useEffect(() => {
    carregar()
  }, [carregar])

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
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-1)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-primary)',
          }}
        >
          Meu Plano
        </h1>
        <p
          style={{
            margin: 'var(--space-2) 0 0',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body)',
            color: 'var(--text-secondary)',
          }}
        >
          Treino e alimentação puxam o mesmo objetivo.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Bloco titulo="Treino" verTudo="/treino">
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
                  {ativo.progress.done} de {ativo.progress.total} sessões
                </div>
              </Card>
            </Link>
          ) : (
            <Vazio to="/treino" icone="sparkles" titulo="Montar um plano de treino">
              A IA monta as semanas e sessões a partir da sua modalidade e objetivo.
            </Vazio>
          )}
        </Bloco>

        <Bloco titulo="Alimentação" verTudo={group ? '/nutricao' : null}>
          {nutricao ? (
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--space-5)' }}>
                <Metrica rotulo="Calorias" valor={nutricao.calories ?? 0} meta={nutricao.calories_goal} />
                <Metrica rotulo="Proteína" valor={nutricao.protein_g ?? 0} meta={nutricao.protein_goal_g} unidade="g" />
                <Metrica rotulo="Água" valor={((nutricao.water_ml ?? 0) / 1000).toFixed(1)} meta={nutricao.water_goal_l} unidade="L" />
              </div>
            </Card>
          ) : (
            <Vazio to={group ? '/nutricao' : '/grupo'} icone="utensils" titulo="Acompanhar a alimentação">
              Registre refeições por foto ou texto e veja como elas conversam com o treino.
            </Vazio>
          )}
        </Bloco>

        <Bloco titulo="Rotinas e hábitos">
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
                divider={false}
              />
            </Link>
          </Card>
        </Bloco>

        <Bloco titulo="Acompanhar">
          <Card pad="0 var(--pad-card)">
            <Link to="/tarefas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow icon="list-check" title="Tarefas" subtitle="To-dos e backlog" onClick={() => {}} />
            </Link>
            <Link to="/conquistas" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <ListRow icon="trophy" title="Conquistas" subtitle="Medalhas e recordes" onClick={() => {}} divider={false} />
            </Link>
          </Card>
        </Bloco>
      </div>
    </div>
  )
}

function Bloco({ titulo, verTudo, children }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
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
        {verTudo && (
          <Link
            to={verTudo}
            style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--blue-glow)', textDecoration: 'none' }}
          >
            Ver tudo
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function Metrica({ rotulo, valor, meta, unidade = '' }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>{rotulo}</div>
      <div style={{ marginTop: 2, fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
        {valor}
        {unidade}
      </div>
      {meta ? (
        <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-micro)', color: 'var(--text-tertiary)' }}>
          de {meta}
          {unidade}
        </div>
      ) : null}
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
