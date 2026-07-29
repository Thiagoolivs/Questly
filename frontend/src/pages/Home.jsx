import { useState } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import ProgressRing from '../components/ProgressRing.jsx'
import Avatar from '../components/Avatar.jsx'

export default function Home() {
  const { state, me, groupId, refresh, loading, error } = useApp()
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(null)

  if (loading) return <div className="screen center muted">Carregando…</div>
  if (error)
    return (
      <div className="screen center">
        <p className="error">Não consegui falar com a API 😕</p>
        <p className="muted small">{error}</p>
        <p className="muted small">Confira se o backend está rodando em {api.BASE}</p>
        <button className="btn" onClick={refresh}>Tentar de novo</button>
      </div>
    )
  if (!state || !me) return <div className="screen center muted">Sem dados.</div>

  const today = me.today
  if (!today)
    return (
      <div className="screen center">
        <p className="brand">🏁 Desafio concluído!</p>
        <p className="muted small">Parabéns pela jornada. Ajuste a duração em Config para continuar.</p>
      </div>
    )

  const daily = today.daily
  const surprise = today.surprise
  const moodEmoji = (key) => state.moods.find((m) => m.key === key)?.emoji

  async function run(fn) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      await refresh()
    } catch (e) {
      alert('Erro: ' + e.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (body) => run(() => api.toggle(groupId, { date: state.date, ...body }))
  const setMood = (key) =>
    run(() => api.setMood(groupId, { date: state.date, mood: today.mood === key ? null : key }))
  const removeProof = (type) => run(() => api.setProof(groupId, { date: state.date, type, image: null }))
  async function attachProof(type) {
    const f = await pickImage()
    if (!f) return
    const image = await fileToCompressedDataURL(f)
    await run(() => api.setProof(groupId, { date: state.date, type, image }))
  }

  const someoneLeads =
    state.leaderboard.length > 1 &&
    state.leaderboard[0].stats.total > state.leaderboard[1].stats.total

  const Proof = ({ type, done, proof }) =>
    !done ? null : (
      <div className="proof">
        {proof ? (
          <>
            <img className="proof-thumb" src={proof} alt="comprovação" onClick={() => setZoom(proof)} />
            <span className="muted xsmall">Comprovação ✓</span>
            <button className="link-btn" disabled={busy} onClick={() => attachProof(type)}>trocar</button>
            <button className="link-btn danger" disabled={busy} onClick={() => removeProof(type)}>remover</button>
          </>
        ) : (
          <button className="btn ghost small-btn" disabled={busy} onClick={() => attachProof(type)}>
            📷 Anexar comprovação
          </button>
        )}
      </div>
    )

  return (
    <div className="screen">
      <header className="topbar">
        <div>
          <div className="brand"><span className="brand-mark">🎯</span> {state.group?.name || 'Questly'}</div>
          <div className="muted small">
            Dia {state.day_number} de {state.duration_days} ·{' '}
            {new Date(state.date + 'T00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'short',
            })}
          </div>
        </div>
        <div className="streak-chip" title="Sequência atual">🔥 {me.stats.streak}</div>
      </header>

      {/* Mensagem do dia */}
      <section className="card motd">
        <div className="motd-icon">✨</div>
        <div>
          <div className="muted xsmall">Mensagem do dia</div>
          <div className="motd-text">{state.motd}</div>
        </div>
      </section>

      {/* Incentivo / lembrete */}
      {me.nudge && <div className="nudge">{me.nudge.emoji} {me.nudge.text}</div>}

      {/* Ranking */}
      <section className="card leaderboard">
        <div className="card-title">🏆 Ranking</div>
        {state.leaderboard.map((p, i) => (
          <div className="rank-row" key={p.id}>
            <div className="rank-pos">{i === 0 && someoneLeads ? '👑' : i + 1}</div>
            <div className="rank-avatar"><Avatar photo={p.photo} avatar={p.avatar} size={34} /></div>
            <div className="rank-main">
              <div className="rank-name">
                {p.name} {p.today?.mood && <span className="rank-mood">{moodEmoji(p.today.mood)}</span>}
              </div>
              <div className="bar">
                <div className="bar-fill" style={{ width: `${p.stats.possible ? (p.stats.total / p.stats.possible) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="rank-meta">
              <div className="rank-total">{p.stats.total}</div>
              <div className="muted xsmall">🔥 {p.stats.streak} · ⭐ {p.stats.perfect_days}</div>
            </div>
          </div>
        ))}
        {state.casal_perfect_days > 0 && (
          <div className="couple-note">💞 Casal Inabalável: {state.casal_perfect_days} dia(s) perfeito(s) juntos!</div>
        )}
      </section>

      {/* Humor */}
      <section className="card">
        <div className="card-title">Como você está hoje?</div>
        <div className="mood-row">
          {state.moods.map((m) => (
            <button
              key={m.key}
              className={'mood ' + (today.mood === m.key ? 'active' : '')}
              disabled={busy}
              onClick={() => setMood(m.key)}
            >
              <span className="mood-emoji">{m.emoji}</span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Progresso de hoje */}
      <section className="card center">
        <div className="card-title self-start">Progresso de hoje</div>
        <ProgressRing value={today.points} max={today.max_points}>
          <div className="ring-value">{today.points}</div>
          <div className="muted xsmall">de {today.max_points} pts</div>
        </ProgressRing>
        <div className="mini-stats">
          <div><b>{me.stats.today}</b><span className="muted xsmall">hoje</span></div>
          <div><b>{me.stats.weekly}</b><span className="muted xsmall">semana</span></div>
          <div><b>{me.stats.total}</b><span className="muted xsmall">total</span></div>
          <div><b>{me.stats.completion_pct}%</b><span className="muted xsmall">conclusão</span></div>
        </div>
      </section>

      {/* Desafio do dia */}
      <section className={'card challenge ' + (today.daily_done ? 'done' : '')}>
        <div className="challenge-head">
          <span className="tag">{daily.emoji} {daily.category}</span>
          <span className="pts">+30 pts</span>
        </div>
        <div className="card-title">Desafio do dia</div>
        <p className="challenge-text">{daily.text}</p>
        <button
          className={'btn full ' + (today.daily_done ? 'btn-done' : 'btn-primary')}
          disabled={busy}
          onClick={() => toggle({ type: 'daily' })}
        >
          {today.daily_done ? '✓ Concluído' : 'Marcar como concluído'}
        </button>
        <Proof type="daily" done={today.daily_done} proof={today.daily_proof} />
      </section>

      {/* Surpresa */}
      {surprise && (
        <section className={'card surprise ' + (today.surprise_done ? 'done' : '')}>
          <div className="challenge-head">
            <span className="tag hot">🔥 Surpresa</span>
            <span className="pts">+20 pts</span>
          </div>
          <p className="challenge-text">{surprise.text}</p>
          <button
            className={'btn full ' + (today.surprise_done ? 'btn-done' : 'btn-hot')}
            disabled={busy}
            onClick={() => toggle({ type: 'surprise' })}
          >
            {today.surprise_done ? '✓ Encarada!' : 'Aceitar desafio'}
          </button>
          <Proof type="surprise" done={today.surprise_done} proof={today.surprise_proof} />
        </section>
      )}

      {/* Hábitos fixos */}
      <section className="card">
        <div className="card-title">
          Hábitos de hoje <span className="muted small">({today.n_done}/{today.n_habits})</span>
        </div>
        <div className="habits">
          {today.habits.map((h) => {
            const done = today.habits_done.includes(h.key)
            return (
              <button
                key={h.key}
                className={'habit ' + (done ? 'done' : '')}
                disabled={busy}
                onClick={() => toggle({ type: 'habit', habit_key: h.key })}
              >
                <span className="habit-emoji">{h.emoji}</span>
                <span className="habit-label">{h.label}</span>
                <span className={'check ' + (done ? 'on' : '')}>{done ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
        {today.perfect && <div className="perfect-banner">⭐ Dia perfeito! +{today.bonus} de bônus</div>}
      </section>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="comprovação" />
        </div>
      )}
    </div>
  )
}
