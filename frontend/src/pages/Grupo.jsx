import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Card, ListRow, Icon, Avatar, Chip } from '../design-system/components/index.js'
import Grupos from './Grupos.jsx'

export default function Grupo() {
  const { group } = useApp()
  const [rankingData, setRankingData] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (group?.id) {
      loadRanking()
    }
  }, [group?.id])

  async function loadRanking() {
    setBusy(true)
    try {
      const res = await api.ranking(group.id)
      setRankingData(res)
    } catch (e) {
      console.error('Erro ao carregar ranking:', e)
    } finally {
      setBusy(false)
    }
  }

  if (!group?.id) {
    return <Grupos />
  }

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)' }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
            {group?.name || 'Grupo'}
          </h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
            Ranking e atividades em grupo.
          </p>
        </div>
        <Chip icon="users" label={group?.member_count?.toString() ?? '—'} variant="glass" />
      </header>

      {rankingData && (
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)' }}>
              Ranking
            </h2>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {rankingData.period}
            </span>
          </div>
          
          <Card padding="none">
            {rankingData.ranking.length === 0 ? (
              <div style={{ padding: 'var(--pad-card-lg)', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)' }}>
                Nenhum dado de ranking neste período.
              </div>
            ) : (
              rankingData.ranking.map((r, i) => (
                <ListRow
                  key={r.id}
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      {r.name}
                      {r.stats?.streak > 0 && <span style={{ color: 'var(--warning)', fontSize: 'var(--fs-label)' }}>🔥 {r.stats.streak}</span>}
                    </div>
                  }
                  subtitle={`Concluídos: ${r.stats?.completed_days || 0} · Perfeitos: ${r.stats?.perfect_days || 0}`}
                  left={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ 
                        fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', 
                        color: i === 0 ? 'var(--warning)' : i === 1 ? 'var(--text-secondary)' : i === 2 ? '#b08d57' : 'var(--text-tertiary)',
                        width: 24, textAlign: 'center'
                      }}>
                        #{i + 1}
                      </span>
                      <Avatar name={r.name} size={40} />
                    </div>
                  }
                  right={
                    <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--blue-glow)' }}>
                      {r.stats?.total || 0} pts
                    </div>
                  }
                  borderBottom={i < rankingData.ranking.length - 1}
                />
              ))
            )}
          </Card>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: '-var(--space-2)' }}>
          Ações
        </h2>
        <Card padding="none">
          <Link to="/chat" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Chat do Grupo"
              icon="message-square"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={true}
            />
          </Link>

          <Link to="/mural" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Mural de Fotos"
              icon="image"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={true}
            />
          </Link>

          <Link to="/config" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
            <ListRow
              title="Configurações do Grupo"
              icon="settings"
              right={<Icon name="chevron-right" size={16} color="var(--text-tertiary)" />}
              borderBottom={false}
            />
          </Link>
        </Card>
      </div>
    </div>
  )
}
