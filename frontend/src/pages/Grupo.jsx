import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'
import Icon from '../components/Icon.jsx'

/**
 * Grupo — Ranking e Visão Geral (Fase 3).
 * Exibe: Ranking Detalhado, Links para Chat, Mural, Config.
 */
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

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">{group?.name || 'Grupo'}</div>
        <div className="streak-chip">
          <Icon name="users" size={14} />
          {group?.member_count ?? '—'}
        </div>
      </header>

      <PlayerSwitch />

      {rankingData && (
        <div className="card">
          <div className="card-title">Ranking do Mês</div>
          <div className="muted xsmall" style={{ marginBottom: 15 }}>{rankingData.period}</div>
          
          <div className="ranking-list">
            {rankingData.ranking.map((r, i) => (
              <div key={r.id} className="ranking-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="rank-pos" style={{ fontWeight: 'bold', fontSize: '1.2rem', width: 24 }}>#{i+1}</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.name} <span className="muted xsmall">🔥 {r.stats?.streak || 0} dias</span></div>
                    <div className="muted xsmall">
                      Dias Concluídos: {r.stats?.completed_days || 0} | Perfeitos: {r.stats?.perfect_days || 0}
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                  {r.stats?.total || 0} pts
                </div>
              </div>
            ))}
            {rankingData.ranking.length === 0 && (
              <p className="muted xsmall">Nenhum dado de ranking neste período.</p>
            )}
          </div>
        </div>
      )}

      <Link to="/chat" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="message" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Chat do grupo</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/mural" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="image" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Mural de fotos</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>

      <Link to="/config" className="card" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="row between">
          <div className="row" style={{ gap: 10 }}>
            <Icon name="settings" size={20} />
            <span className="card-title" style={{ margin: 0 }}>Configurações do grupo</span>
          </div>
          <Icon name="chevronRight" size={18} className="muted" />
        </div>
      </Link>
    </div>
  )
}
