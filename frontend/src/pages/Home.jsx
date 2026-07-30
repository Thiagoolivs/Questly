import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import ProgressRing from '../components/ProgressRing.jsx'
import Avatar from '../components/Avatar.jsx'
import AreaRings from '../components/AreaRings.jsx'
import Section from '../components/Section.jsx'
import Icon, { categoryIconName, moodIconName } from '../components/Icon.jsx'
import IconPicker from '../components/IconPicker.jsx'

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
  const [jointForm, setJointForm] = useState({ emoji: '💞', icon: null, label: '' })
  const [jointPhoto, setJointPhoto] = useState(null)
  const [moodNote, setMoodNote] = useState('')
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [goalForm, setGoalForm] = useState({ emoji: '🎯', icon: null, title: '', duration_days: 30 })
  const [mealBusy, setMealBusy] = useState(false)
  const [editMeal, setEditMeal] = useState(null)

  useEffect(() => {
    setMoodNote(me?.today?.mood_note || '')
  }, [me?.today?.mood_note])

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
  async function attachHabitPhoto(habit_key) {
    const f = await pickImage()
    if (!f) return
    const image = await fileToCompressedDataURL(f)
    await run(() => api.habitPhoto(groupId, { date: state.date, habit_key, image }))
  }
  const removeHabitPhoto = (habit_key) =>
    run(() => api.habitPhoto(groupId, { date: state.date, habit_key, image: null }))
  const toggleMood = (key) => {
    const cur = today.moods || []
    const next = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    return run(() => api.setMood(groupId, { date: state.date, moods: next, note: moodNote }))
  }
  const saveMoodNote = () => run(() => api.setMood(groupId, { date: state.date, moods: today.moods || [], note: moodNote }))
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

  const goals = state.goals || []
  const toggleGoalCheckin = (goalId) => run(() => api.goalCheckin(groupId, goalId, { date: state.date }))
  const endGoal = (goalId) => {
    if (!window.confirm('Encerrar esta meta? Ela sai da lista e não pode ser reativada.')) return
    run(() => api.endGoal(groupId, goalId))
  }
  function createGoal() {
    if (!goalForm.title.trim()) return
    run(async () => {
      await api.createGoal(groupId, {
        title: goalForm.title.trim(),
        emoji: goalForm.emoji || '🎯',
        icon: goalForm.icon,
        duration_days: Number(goalForm.duration_days) || 30,
      })
      setGoalForm({ emoji: '🎯', icon: null, title: '', duration_days: 30 })
      setShowGoalForm(false)
    })
  }

  const tasks = state.tasks || []
  const tasksDone = tasks.filter((t) => t.checked_today).length
  const toggleTask = (id) => run(() => api.completeTask(groupId, id, { date: state.date }))
  const deleteTask = (id) => {
    if (!window.confirm('Remover esta tarefa agendada? Ela deixa de aparecer para o grupo.')) return
    run(() => api.deleteTask(groupId, id))
  }
  async function attachTaskPhoto(id) {
    const f = await pickImage()
    if (!f) return
    const image = await fileToCompressedDataURL(f)
    await run(() => api.completeTask(groupId, id, { date: state.date, image }))
  }

  // --- Alimentação (contador de calorias por foto) ---
  const nutrition = state.nutrition || {
    calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0,
    calories_goal: 2000, protein_goal_g: 120, carbs_goal_g: 250, fat_goal_g: 56, water_goal_l: 2.5,
    meals: [],
  }
  const meals = nutrition.meals || []
  const kcalPct = Math.min(100, Math.round((nutrition.calories / (nutrition.calories_goal || 1)) * 100))
  const protPct = Math.min(100, Math.round((nutrition.protein_g / (nutrition.protein_goal_g || 1)) * 100))
  async function addMealPhoto() {
    const f = await pickImage()
    if (!f || mealBusy) return
    const image = await fileToCompressedDataURL(f)
    setMealBusy(true)
    try {
      await api.addMeal(groupId, { date: state.date, image })
      await refresh()
    } catch (e) {
      alert('Erro ao analisar a foto: ' + e.message)
    } finally {
      setMealBusy(false)
    }
  }
  const removeMeal = (id) => {
    if (!window.confirm('Remover esta refeição da contagem?')) return
    run(() => api.deleteMeal(groupId, id))
  }
  async function saveMealEdit() {
    const e = editMeal
    setEditMeal(null)
    if (!e) return
    await run(() =>
      api.updateMeal(groupId, e.id, {
        label: (e.label || '').trim() || 'Refeição',
        calories: Number(e.calories) || 0,
        protein_g: Number(e.protein_g) || 0,
        carbs_g: Number(e.carbs_g) || 0,
        fat_g: Number(e.fat_g) || 0,
      }),
    )
  }

  const joint = state.joint || { points_each: 20, activities: [], suggestions: [] }
  const removeJoint = (aid) => {
    if (!window.confirm('Remover esta atividade em dupla? Os pontos dela saem do placar.')) return
    run(() => api.jointRemove(groupId, aid))
  }
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
        icon: jointForm.icon,
        image: jointPhoto,
      })
      setJointForm({ emoji: '💞', icon: null, label: '' })
      setJointPhoto(null)
    })
  }

  const diffClass = (d) => 'diff-badge diff-' + d

  return (
    <div className="screen">
      <header className="topbar">
        <div>
          <div className="brand">{state.group?.name || 'Questly'}</div>
          <div className="muted small">
            Dia {state.day_number} de {state.duration_days} ·{' '}
            {new Date(state.date + 'T00:00').toLocaleDateString('pt-BR', {
              weekday: 'long', day: '2-digit', month: 'short',
            })}
          </div>
        </div>
        <div className="streak-chip" title="Sequência atual"><Icon name="flame" size={15} /> {me.stats.streak}</div>
      </header>

      {/* Incentivo / lembrete */}
      {me.nudge && <div className="nudge">{me.nudge.text}</div>}

      {/* ======= ZONA 1 · Resumo do dia ======= */}
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

      {/* Anel das 5 áreas */}
      <AreaRings challenges={today.challenges} streaks={streaks} />

      {/* Ranking */}
      <section className="card leaderboard">
        <div className="card-title">Ranking</div>
        {state.leaderboard.map((p, i) => (
          <div className="rank-row" key={p.id}>
            <div className="rank-pos">{i + 1}</div>
            <div className="rank-avatar"><Avatar photo={p.photo} avatar={p.avatar} name={p.name} size={34} /></div>
            <div className="rank-main">
              <div className="rank-name">
                {p.name} {p.today?.mood && <span className="rank-mood"><Icon name={moodIconName(p.today.mood)} size={13} /></span>}
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

      {/* ======= ZONA 2 · Ações de hoje ======= */}
      {/* Desafios do dia (um por área) */}
      <Section
        id="desafios"
        title="Desafios do dia"
        meta={<>({today.areas_done}/{today.areas_total}){today.rerolls_left > 0 && ` · ${today.rerolls_left} troca`}</>}
        defaultOpen
      >
        <p className="muted xsmall proof-note">Só pontua anexando a foto que comprova o desafio.</p>
        <div className="challenge-list">
          {today.challenges.map((c) => (
            <div className={'challenge-item ' + (c.done ? 'done' : '')} key={c.category}>
              <div className="challenge-head">
                <span className="tag"><Icon name={categoryIconName(c.category)} size={14} /> {c.category}</span>
                <span className={diffClass(c.difficulty)}>{c.difficulty_label}</span>
                <span className="pts">+{c.points}</span>
              </div>
              <p className="challenge-text">{c.text}</p>

              {c.done ? (
                <div className="proof done-proof">
                  {c.proof && (
                    <img className="proof-thumb" src={c.proof} alt="comprovação" onClick={() => setZoom(c.proof)} />
                  )}
                  <span className="challenge-ok"><Icon name="check" size={15} /> Concluído</span>
                  <button
                    className={'together-btn ' + (c.together ? 'on' : '')}
                    disabled={busy}
                    onClick={() => toggleTogether(c)}
                  >
                    <Icon name="heart" size={13} /> {c.together ? 'Juntos +10' : 'Fizemos juntos?'}
                  </button>
                  <button className="link-btn" disabled={busy} onClick={() => proveChallenge(c.category, c.together)}>trocar foto</button>
                  <button className="link-btn danger" disabled={busy} onClick={() => removeChallenge(c.category)}>desfazer</button>
                </div>
              ) : (
                <div className="challenge-actions">
                  <button className="btn btn-primary small-btn icon-btn" disabled={busy} onClick={() => proveChallenge(c.category)}>
                    <Icon name="camera" size={15} /> Provar e concluir
                  </button>
                  {today.rerolls_left > 0 && (
                    <button className="btn ghost small-btn icon-btn" disabled={busy} onClick={() => rerollChallenge(c.category)}>
                      <Icon name="refresh" size={14} /> Trocar
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {today.completed && (
          <div className="perfect-banner"><Icon name="scale" size={15} /> Todas as áreas fechadas! +{today.balance_bonus} de bônus</div>
        )}
      </Section>

      {/* Hábitos */}
      <Section id="habitos" title="Hábitos de hoje" meta={`(${today.n_done}/${today.n_habits})`} defaultOpen>
        <p className="muted xsmall proof-note">Marcar vale 10 · com foto-prova vale 12.</p>
        <div className="habits">
          {today.habits.map((h) => {
            const done = today.habits_done.includes(h.key)
            const proof = today.habit_proofs?.[h.key]
            return (
              <div key={h.key} className={'habit-row ' + (done ? 'done' : '')}>
                <button className="habit habit-toggle" disabled={busy} onClick={() => toggleHabit(h.key)}>
                  <span className="habit-emoji">{h.icon ? <Icon name={h.icon} size={18} /> : h.emoji}</span>
                  <span className="habit-label">{h.label}</span>
                  {proof && <span className="habit-bonus">+2</span>}
                  <span className={'check ' + (done ? 'on' : '')}>{done ? <Icon name="check" size={14} /> : ''}</span>
                </button>
                {proof ? (
                  <div className="habit-proof">
                    <img className="habit-thumb" src={proof} alt="prova" onClick={() => setZoom(proof)} />
                    <button className="habit-cam" disabled={busy} title="Remover foto" onClick={() => removeHabitPhoto(h.key)}>
                      <Icon name="x" size={15} />
                    </button>
                  </div>
                ) : (
                  <button className="habit-cam" disabled={busy} title="Foto-prova (+2)" onClick={() => attachHabitPhoto(h.key)}>
                    <Icon name="camera" size={16} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
        {today.perfect && <div className="perfect-banner"><Icon name="star" size={15} /> Dia perfeito! +{today.perfect_bonus} de bônus</div>}
      </Section>

      {/* Alimentação de hoje (contador de calorias por foto) */}
      <Section
        id="alimentacao"
        title="Alimentação de hoje"
        meta={`${nutrition.calories}/${nutrition.calories_goal} kcal`}
        defaultOpen
      >
        <div className="nutri-goals">
          <div className="nutri-metric">
            <div className="nutri-metric-top">
              <span><Icon name="flame" size={14} /> Calorias</span>
              <span className="muted small">{nutrition.calories} / {nutrition.calories_goal} kcal</span>
            </div>
            <div className="nutri-bar"><div className="nutri-fill kcal" style={{ width: kcalPct + '%' }} /></div>
          </div>
          <div className="nutri-metric">
            <div className="nutri-metric-top">
              <span>🥩 Proteína</span>
              <span className="muted small">{nutrition.protein_g} / {nutrition.protein_goal_g} g</span>
            </div>
            <div className="nutri-bar"><div className="nutri-fill prot" style={{ width: protPct + '%' }} /></div>
          </div>
          <div className="muted xsmall nutri-macros">
            Carbo {nutrition.carbs_g}/{nutrition.carbs_goal_g}g · Gordura {nutrition.fat_g}/{nutrition.fat_goal_g}g · Meta de água {nutrition.water_goal_l}L
          </div>
        </div>

        {meals.length > 0 && (
          <div className="meal-list">
            {meals.map((mm) =>
              editMeal && editMeal.id === mm.id ? (
                <div className="meal-edit" key={mm.id}>
                  <input className="meal-edit-label" value={editMeal.label}
                    onChange={(e) => setEditMeal({ ...editMeal, label: e.target.value })} />
                  <div className="meal-edit-nums">
                    <label>kcal<input type="number" value={editMeal.calories}
                      onChange={(e) => setEditMeal({ ...editMeal, calories: e.target.value })} /></label>
                    <label>Prot<input type="number" value={editMeal.protein_g}
                      onChange={(e) => setEditMeal({ ...editMeal, protein_g: e.target.value })} /></label>
                    <label>Carb<input type="number" value={editMeal.carbs_g}
                      onChange={(e) => setEditMeal({ ...editMeal, carbs_g: e.target.value })} /></label>
                    <label>Gord<input type="number" value={editMeal.fat_g}
                      onChange={(e) => setEditMeal({ ...editMeal, fat_g: e.target.value })} /></label>
                  </div>
                  <div className="row" style={{ gap: 8 }}>
                    <button className="btn ghost full" onClick={() => setEditMeal(null)}>Cancelar</button>
                    <button className="btn full btn-primary" disabled={busy} onClick={saveMealEdit}>Salvar</button>
                  </div>
                </div>
              ) : (
                <div className="meal-row" key={mm.id}>
                  {mm.image && <img className="meal-thumb" src={mm.image} alt="" onClick={() => setZoom(mm.image)} />}
                  <div className="meal-info">
                    <span className="meal-label">
                      {mm.label}
                      {mm.confidence && <span className="meal-conf muted xsmall"> · ≈{mm.confidence}</span>}
                    </span>
                    <span className="muted xsmall">{mm.calories} kcal · {mm.protein_g}g P · {mm.carbs_g}g C · {mm.fat_g}g G</span>
                  </div>
                  <button className="habit-cam" title="Ajustar" disabled={busy}
                    onClick={() => setEditMeal({ id: mm.id, label: mm.label, calories: mm.calories, protein_g: mm.protein_g, carbs_g: mm.carbs_g, fat_g: mm.fat_g })}>
                    <Icon name="pencil" size={15} />
                  </button>
                  <button className="habit-cam" title="Remover" disabled={busy} onClick={() => removeMeal(mm.id)}>
                    <Icon name="x" size={15} />
                  </button>
                </div>
              ),
            )}
          </div>
        )}

        {state.ai_enabled ? (
          <button className="btn ghost full icon-btn new-goal-btn" disabled={mealBusy} onClick={addMealPhoto}>
            <Icon name="camera" size={15} /> {mealBusy ? 'Analisando a foto…' : 'Foto da refeição'}
          </button>
        ) : (
          <div className="muted xsmall" style={{ marginTop: 8 }}>
            Contador por IA inativo — configure <code>OPENAI_API_KEY</code> (ou <code>GROQ_API_KEY</code>) no servidor para estimar calorias pela foto.
          </div>
        )}
        <p className="muted xsmall proof-note" style={{ marginTop: 8 }}>
          Estimativa por IA — confira e ajuste os valores se precisar.
        </p>
      </Section>

      {/* Tarefas de hoje */}
      {tasks.length > 0 && (
        <Section id="tarefas" title="Tarefas de hoje" meta={`(${tasksDone}/${tasks.length})`} defaultOpen>
          <div className="habits">
            {tasks.map((t) => (
              <div key={t.id} className={'habit-row ' + (t.checked_today ? 'done' : '')}>
                <button className="habit habit-toggle" disabled={busy} onClick={() => toggleTask(t.id)}>
                  <span className="habit-emoji">{t.icon ? <Icon name={t.icon} size={17} /> : t.emoji}</span>
                  <span className="habit-main-col">
                    <span className="habit-label">{t.title}</span>
                    {t.time && <span className="muted xsmall">{t.time}</span>}
                  </span>
                  <span className={'check ' + (t.checked_today ? 'on' : '')}>{t.checked_today ? <Icon name="check" size={14} /> : ''}</span>
                </button>
                {t.image && <img className="habit-thumb" src={t.image} alt="prova" onClick={() => setZoom(t.image)} />}
                <button className="habit-cam" disabled={busy} title="Foto-prova" onClick={() => attachTaskPhoto(t.id)}>
                  <Icon name="camera" size={16} />
                </button>
                <button className="habit-cam" disabled={busy} title="Remover tarefa" onClick={() => deleteTask(t.id)}>
                  <Icon name="x" size={15} />
                </button>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Atividades em dupla */}
      <Section id="dupla" title="Atividades em dupla" meta={`(+${joint.points_each} pra cada)`} defaultOpen={false}>
        <p className="muted xsmall proof-note">Fizeram algo juntos além dos desafios? Registrem — os dois pontuam.</p>

        {joint.activities.length > 0 && (
          <div className="joint-list">
            {joint.activities.map((a) => (
              <div className="joint-item" key={a.id}>
                {a.image ? (
                  <img className="joint-thumb" src={a.image} alt="" onClick={() => setZoom(a.image)} />
                ) : (
                  <span className="joint-emoji">{a.icon ? <Icon name={a.icon} size={18} /> : a.emoji}</span>
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
          <IconPicker
            emoji={jointForm.emoji}
            icon={jointForm.icon}
            onPick={({ emoji, icon }) => setJointForm({ ...jointForm, emoji: emoji || '💞', icon })}
          />
          <input
            className="add-habit-label"
            placeholder="O que fizeram juntos?"
            value={jointForm.label}
            onChange={(e) => setJointForm({ ...jointForm, label: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addJoint()}
          />
          <button className="chat-attach" title="Foto (opcional)" onClick={attachJointPhoto}><Icon name="camera" size={17} /></button>
        </div>
        {jointPhoto && (
          <div className="chat-preview">
            <img src={jointPhoto} alt="prévia" />
            <button className="chat-preview-x" onClick={() => setJointPhoto(null)}>✕</button>
          </div>
        )}
        <button className="btn full btn-primary small-btn icon-btn" disabled={busy || !jointForm.label.trim()} onClick={addJoint}>
          <Icon name="plus" size={15} /> Registrar atividade em dupla
        </button>
      </Section>

      {/* ======= ZONA 3 · Acompanhar & social ======= */}
      {/* Metas */}
      {goals.map((g) => {
        const pct = g.duration_days ? Math.min(100, ((g.me?.count || 0) / g.duration_days) * 100) : 0
        const others = g.members.filter((m) => m.membership_id !== g.me?.membership_id)
        return (
          <section className={'card goal-card' + (g.me?.done ? ' goal-done' : '')} key={g.id}>
            <div className="row between">
              <div className="goal-title">
                {g.icon ? <Icon name={g.icon} size={17} /> : <span className="goal-emoji">{g.emoji}</span>} {g.title}
              </div>
              <button className="link-btn" disabled={busy} onClick={() => endGoal(g.id)}>encerrar</button>
            </div>
            <div className="muted xsmall">
              Dia {g.day_index} de {g.duration_days} · {g.days_left > 0 ? `faltam ${g.days_left}` : 'último dia'} ·{' '}
              <Icon name="flame" size={11} /> {g.me?.streak || 0}
            </div>
            <div className="bar"><div className="bar-fill" style={{ width: `${pct}%` }} /></div>
            <div className="row between">
              <span className="muted xsmall">{g.me?.count || 0}/{g.duration_days} dias</span>
              {others.map((o) => (
                <span className="muted xsmall" key={o.membership_id}>{o.name}: {o.count}/{g.duration_days}</span>
              ))}
            </div>
            <button
              className={'btn full ' + (g.me?.checked_today ? 'btn-done' : 'btn-primary') + ' icon-btn'}
              disabled={busy}
              onClick={() => toggleGoalCheckin(g.id)}
            >
              <Icon name="check" size={15} /> {g.me?.checked_today ? 'Cumpri hoje' : 'Marcar check-in de hoje'}
            </button>
          </section>
        )
      })}

      {/* Nova meta */}
      {showGoalForm ? (
        <section className="card">
          <div className="card-title">Nova meta</div>
          <div className="add-habit">
            <IconPicker
              emoji={goalForm.emoji}
              icon={goalForm.icon}
              onPick={({ emoji, icon }) => setGoalForm({ ...goalForm, emoji: emoji || '🎯', icon })}
            />
            <input
              className="add-habit-label"
              placeholder="Ex: Sem refrigerante"
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
            />
          </div>
          <div className="chips">
            {[7, 30, 60, 90].map((d) => (
              <button
                key={d}
                className={'chip ' + (Number(goalForm.duration_days) === d ? 'active' : '')}
                onClick={() => setGoalForm({ ...goalForm, duration_days: d })}
              >
                {d} dias
              </button>
            ))}
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn ghost full" onClick={() => setShowGoalForm(false)}>Cancelar</button>
            <button className="btn full btn-primary" disabled={busy || !goalForm.title.trim()} onClick={createGoal}>Criar meta</button>
          </div>
        </section>
      ) : (
        <button className="btn ghost full icon-btn new-goal-btn" onClick={() => setShowGoalForm(true)}>
          <Icon name="plus" size={15} /> Nova meta
        </button>
      )}

      {/* Humor / emoções */}
      <Section id="humor" title="Como você está hoje?" meta="(pode marcar várias)" defaultOpen={false}>
        <div className="mood-grid">
          {state.moods.map((m) => (
            <button
              key={m.key}
              className={'mood ' + ((today.moods || []).includes(m.key) ? 'active' : '')}
              disabled={busy}
              onClick={() => toggleMood(m.key)}
            >
              <span className="mood-emoji"><Icon name={moodIconName(m.key)} size={20} /></span>
              <span className="mood-label">{m.label}</span>
            </button>
          ))}
        </div>
        <input
          className="mood-note"
          placeholder="Quer escrever algo sobre o dia? (opcional)"
          value={moodNote}
          maxLength={280}
          disabled={busy}
          onChange={(e) => setMoodNote(e.target.value)}
          onBlur={saveMoodNote}
          onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
        />
      </Section>

      {/* Feed de atividades */}
      {state.activities?.length > 0 && (
        <Section id="feed" title="Atividades" defaultOpen={false}>
          <div className="feed">
            {state.activities.map((a) => (
              <div className="feed-item" key={a.id}>
                <span className="feed-emoji">{a.emoji}</span>
                <span className="feed-text">{a.text}</span>
                {a.image && <img className="feed-thumb" src={a.image} alt="" onClick={() => setZoom(a.image)} />}
                <span className="muted xsmall feed-time">{timeAgo(a.created_at)}</span>
              </div>
            ))}
          </div>
          <Link to="/feed" className="btn ghost full small-btn" style={{ marginTop: 10 }}>Ver todas no Feed</Link>
        </Section>
      )}

      {/* Mensagem do dia */}
      <section className="card motd">
        <div className="motd-icon"><Icon name="sparkle" size={18} /></div>
        <div>
          <div className="muted xsmall">Mensagem do dia</div>
          <div className="motd-text">{state.motd}</div>
        </div>
      </section>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={zoom} alt="comprovação" />
        </div>
      )}
    </div>
  )
}
