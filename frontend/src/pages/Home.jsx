import { useState } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import ProgressRing from '../components/ProgressRing.jsx'
import Avatar from '../components/Avatar.jsx'
import AreaRings from '../components/AreaRings.jsx'

function timeAgo(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'agora'
  if (s < 3600) return `${Math.floor(s / 60)}min`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

export default function Home() {
  const { state, me, groupId, refresh, loading, error } = useApp()
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(null)
  const [jointForm, setJointForm] = useState({ emoji: '💞', label: '' })
  const [jointPhoto, setJointPhoto] = useState(null)

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

  const moodEmoji = (key) => state.moods.find((m) => m.key === key)?.emoji
  const streaks = me.stats.category_streaks || {}

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

  const toggleHabit = (habit_key) =>
    run(() => api.toggle(groupId, { date: state.date, type: 'habit', habit_key }))
  const setMood = (key) =>
    run(() => api.setMood(groupId, { date: state.date, mood: today.mood === key ? null : key }))
  const rerollChallenge = (category) => run(() => api.reroll(groupId, { date: state.date, category }))
  const removeChallenge = (category) =>
    run(() => api.setChallenge(groupId, { date: state.date, category, image: null }))
  async function proveChallenge(category, together = false) {
    const f = await pickImage()
    if (!f) return
    const image = await fileToCompressedDataURL(f)
    await run(() => api.setChallenge(groupId, { date: state.date, category, image, together }))
  }
  const toggleTogether = (c) =>
    run(() => api.setChallenge(groupId, { date: state.date, category: c.category, image: c.proof, together: !c.together }))

  const joint = state.joint || { points_each: 20, activities: [], suggestions: [] }
  const removeJoint = (aid) => run(() => api.jointRemove(groupId, aid))
  async function attachJointPhoto() {
    const f = await pickImage()
    if (!f) return
    setJointPhoto(await fileToCompressedDataURL(f))
  }
  function addJoint() {
    if (!jointForm.label.trim()) return
    run(async () => {
      await api.jointAdd(groupId, {
        date: state.date,
        label: jointForm.label.trim(),
        emoji: jointForm.emoji || '💞',
        image: jointPhoto,
      })
      setJointForm({ emoji: '💞', label: '' })
      setJointPhoto(null)
    })
  }

  const someoneLeads =
    state.leaderboard.length > 1 &&
    state.leaderboard[0].stats.total > state.leaderboard[1].stats.total

  const diffClass = (d) => 'diff-badge diff-' + d

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

      {/* Anel das 5 áreas */}
      <AreaRings challenges={today.challenges} streaks={streaks} />

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

      {/* Feed de atividades */}
      {state.activities?.length > 0 && (
        <section className="card">
          <div className="card-title">📣 Atividades</div>
          <div className="feed">
            {state.activities.map((a) => (
              <div className="feed-item" key={a.id}>
                <span className="feed-emoji">{a.emoji}</span>
                <span className="feed-text">{a.text}</span>
                <span className="muted xsmall feed-time">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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

      {/* Desafios do dia (um por área) */}
      <section className="card">
        <div className="card-title">
          Desafios do dia <span className="muted small">({today.areas_done}/{today.areas_total})</span>
          {today.rerolls_left > 0 && <span className="reroll-hint muted xsmall"> · 🔁 {today.rerolls_left} troca</span>}
        </div>
        <p className="muted xsmall proof-note">📷 Só pontua anexando a foto que comprova o desafio.</p>
        <div className="challenge-list">
          {today.challenges.map((c) => (
            <div className={'challenge-item ' + (c.done ? 'done' : '')} key={c.category}>
              <div className="challenge-head">
                <span className="tag">{c.emoji} {c.category}</span>
                <span className={diffClass(c.difficulty)}>{c.difficulty_label}</span>
                <span className="pts">+{c.points}</span>
              </div>
              <p className="challenge-text">{c.text}</p>

              {c.done ? (
                <div className="proof done-proof">
                  {c.proof && (
                    <img className="proof-thumb" src={c.proof} alt="comprovação" onClick={() => setZoom(c.proof)} />
                  )}
                  <span className="challenge-ok">✓ Concluído</span>
                  <button
                    className={'together-btn ' + (c.together ? 'on' : '')}
                    disabled={busy}
                    onClick={() => toggleTogether(c)}
                  >
                    💞 {c.together ? 'Juntos +10' : 'Fizemos juntos?'}
                  </button>
                  <button className="link-btn" disabled={busy} onClick={() => proveChallenge(c.category, c.together)}>trocar foto</button>
                  <button className="link-btn danger" disabled={busy} onClick={() => removeChallenge(c.category)}>desfazer</button>
                </div>
              ) : (
                <div className="challenge-actions">
                  <button className="btn btn-primary small-btn" disabled={busy} onClick={() => proveChallenge(c.category)}>
                    📷 Provar e concluir
                  </button>
                  {today.rerolls_left > 0 && (
                    <button className="btn ghost small-btn" disabled={busy} onClick={() => rerollChallenge(c.category)}>
                      🔁 Trocar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {today.completed && (
          <div className="perfect-banner">⚖️ Todas as áreas fechadas! +{today.balance_bonus} de bônus</div>
        )}
      </section>

      {/* Atividades em dupla */}
      <section className="card">
        <div className="card-title">
          💞 Atividades em dupla <span className="muted small">(+{joint.points_each} pra cada)</span>
        </div>
        <p className="muted xsmall proof-note">Fizeram algo juntos além dos desafios? Registrem — os dois pontuam.</p>

        {joint.activities.length > 0 && (
          <div className="joint-list">
            {joint.activities.map((a) => (
              <div className="joint-item" key={a.id}>
                {a.image ? (
                  <img className="joint-thumb" src={a.image} alt="" onClick={() => setZoom(a.image)} />
                ) : (
                  <span className="joint-emoji">{a.emoji}</span>
                )}
                <span className="joint-main">
                  <span className="joint-label">{a.label}</span>
                  <span className="muted xsmall">+{a.points} · por {a.author}</span>
                </span>
                <button className="link-btn danger" disabled={busy} onClick={() => removeJoint(a.id)}>remover</button>
              </div>
            ))}
          </div>
        )}

        {joint.suggestions?.length > 0 && (
          <div className="joint-suggestions">
            {joint.suggestions.map((sug) => (
              <button
                key={sug.label}
                className="chip"
                onClick={() => setJointForm({ emoji: sug.emoji, label: sug.label })}
              >
                {sug.emoji} {sug.label}
              </button>
            ))}
          </div>
        )}

        <div className="add-habit">
          <input
            className="add-habit-emoji"
            value={jointForm.emoji}
            maxLength={2}
            onChange={(e) => setJointForm({ ...jointForm, emoji: e.target.value })}
            aria-label="emoji"
          />
          <input
            className="add-habit-label"
            placeholder="O que fizeram juntos?"
            value={jointForm.label}
            onChange={(e) => setJointForm({ ...jointForm, label: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addJoint()}
          />
          <button className="chat-attach" title="Foto (opcional)" onClick={attachJointPhoto}>📷</button>
        </div>
        {jointPhoto && (
          <div className="chat-preview">
            <img src={jointPhoto} alt="prévia" />
            <button className="chat-preview-x" onClick={() => setJointPhoto(null)}>✕</button>
          </div>
        )}
        <button className="btn full btn-primary small-btn" disabled={busy || !jointForm.label.trim()} onClick={addJoint}>
          + Registrar atividade em dupla
        </button>
      </section>

      {/* Hábitos */}
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
                onClick={() => toggleHabit(h.key)}
              >
                <span className="habit-emoji">{h.emoji}</span>
                <span className="habit-label">{h.label}</span>
                <span className={'check ' + (done ? 'on' : '')}>{done ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
        {today.perfect && <div className="perfect-banner">⭐ Dia perfeito! +{today.perfect_bonus} de bônus</div>}
      </section>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="comprovação" />
        </div>
      )}
    </div>
  )
}
