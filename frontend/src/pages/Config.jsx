import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import IconPicker from '../components/IconPicker.jsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const DURATIONS = [30, 60, 75, 90]
const TIMEZONES = [
  ['America/Sao_Paulo', 'Brasília (São Paulo)'],
  ['America/Bahia', 'Salvador (Bahia)'],
  ['America/Fortaleza', 'Fortaleza'],
  ['America/Recife', 'Recife'],
  ['America/Manaus', 'Manaus (AM)'],
  ['America/Cuiaba', 'Cuiabá (MT)'],
  ['America/Rio_Branco', 'Rio Branco (AC)'],
  ['America/Noronha', 'Fernando de Noronha'],
  ['America/New_York', 'Nova York (EUA Leste)'],
  ['America/Los_Angeles', 'Los Angeles (EUA Oeste)'],
  ['Europe/Lisbon', 'Lisboa'],
  ['Europe/London', 'Londres'],
  ['UTC', 'UTC'],
]

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

export default function Config() {
  const { groupId, refresh } = useApp()
  const [s, setS] = useState(null)
  const [menu, setMenu] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [newHabit, setNewHabit] = useState({ emoji: '✅', icon: null, label: '' })
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState(null)
  const [genBusy, setGenBusy] = useState(false)
  const [genMsg, setGenMsg] = useState(null)

  useEffect(() => {
    if (!groupId) return
    api.settings(groupId)
      .then((d) => {
        // Junta o menu de sugestões com hábitos personalizados já salvos.
        const menuKeys = new Set((d.habits_menu || []).map((h) => h.key))
        const customs = (d.fixed_habits || []).filter((h) => !menuKeys.has(h.key))
        setMenu([...(d.habits_menu || []), ...customs])
        setS(d)
        setSelected(new Set((d.fixed_habits || []).map((h) => h.key)))
      })
      .catch((e) => setErr(e.message))
  }, [groupId])

  if (err) return <div className="screen center error">{err}</div>
  if (!s) return <div className="screen center muted">Carregando…</div>

  const set = (patch) => setS({ ...s, ...patch })
  const toggleHabit = (key) => {
    const next = new Set(selected)
    next.has(key) ? next.delete(key) : next.add(key)
    setSelected(next)
  }
  const toggleRest = (i) => {
    const days = new Set(s.rest_days || [])
    days.has(i) ? days.delete(i) : days.add(i)
    set({ rest_days: [...days].sort() })
  }

  function addHabit() {
    const label = newHabit.label.trim()
    if (!label) return
    let key = slug(label) || 'habito'
    const keys = new Set(menu.map((h) => h.key))
    while (keys.has(key)) key += '_' + Math.floor(Math.random() * 1000)
    const h = { key, label, emoji: (newHabit.emoji || '✅').trim() || '✅', icon: newHabit.icon || null, category: 'Personalizado' }
    setMenu([...menu, h])
    setSelected(new Set([...selected, key]))
    setNewHabit({ emoji: '✅', icon: null, label: '' })
  }

  async function save() {
    const fixed_habits = menu.filter((h) => selected.has(h.key))
    await api.updateSettings(groupId, {
      timezone: s.timezone || 'America/Sao_Paulo',
      duration_days: Number(s.duration_days),
      water_goal_l: Number(s.water_goal_l),
      steps_goal: Number(s.steps_goal),
      protein_goal_g: Number(s.protein_goal_g),
      calories_goal: Number(s.calories_goal),
      sleep_goal_h: Number(s.sleep_goal_h),
      rest_days: s.rest_days || [],
      spiritual_enabled: s.spiritual_enabled,
      fixed_habits: fixed_habits.length ? fixed_habits : undefined,
    })
    await refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  async function generateAI() {
    if (genBusy) return
    setGenBusy(true)
    setGenMsg(null)
    try {
      const d = await api.generateChallenges(groupId)
      setS((prev) => ({ ...prev, ...d }))
      setGenMsg({ ok: true, text: `Prontos! ${d.count} desafios novos gerados.` })
      await refresh()
    } catch (e) {
      setGenMsg({ ok: false, text: e.message })
    } finally {
      setGenBusy(false)
    }
  }

  const aiUpdated = s.ai_pool_updated
    ? new Date(s.ai_pool_updated).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    : null

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Configurações</div>
      </header>

      <section className="card">
        <div className="card-title">Duração do desafio</div>
        <div className="chips">
          {DURATIONS.map((d) => (
            <button
              key={d}
              className={'chip ' + (Number(s.duration_days) === d ? 'active' : '')}
              onClick={() => set({ duration_days: d })}
            >
              {d} dias
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title">Desafios por IA</div>
        <div className="muted small" style={{ marginBottom: 10 }}>
          Gera um lote novo de desafios variados (misturados aos fixos). O app sorteia
          desse lote a cada dia — os dois veem o mesmo desafio.
        </div>
        {s.ai_enabled ? (
          <>
            <div className="muted small" style={{ marginBottom: 10 }}>
              {s.ai_pool_count > 0
                ? `${s.ai_pool_count} desafios de IA no lote${aiUpdated ? ` · atualizado em ${aiUpdated}` : ''}.`
                : 'Nenhum lote gerado ainda — só os desafios fixos por enquanto.'}
            </div>
            <button className="btn full btn-primary icon-btn" disabled={genBusy} onClick={generateAI}>
              <Icon name="refresh" size={15} /> {genBusy ? 'Gerando…' : 'Gerar novos desafios'}
            </button>
            {genMsg && (
              <div className={'small ' + (genMsg.ok ? 'muted' : 'error')} style={{ marginTop: 8 }}>
                {genMsg.text}
              </div>
            )}
          </>
        ) : (
          <div className="muted small">
            Indisponível neste servidor. Para ativar, configure a variável
            <code> GROQ_API_KEY</code> (ou <code>OPENAI_API_KEY</code>) no backend.
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-title">Metas diárias</div>
        <label className="field row"><span>Água (L)</span>
          <input type="number" step="0.1" value={s.water_goal_l} onChange={(e) => set({ water_goal_l: e.target.value })} /></label>
        <label className="field row"><span>Passos</span>
          <input type="number" value={s.steps_goal} onChange={(e) => set({ steps_goal: e.target.value })} /></label>
        <label className="field row"><span>Proteína (g)</span>
          <input type="number" value={s.protein_goal_g} onChange={(e) => set({ protein_goal_g: e.target.value })} /></label>
        <label className="field row"><span>Calorias</span>
          <input type="number" value={s.calories_goal} onChange={(e) => set({ calories_goal: e.target.value })} /></label>
        <label className="field row"><span>Sono (h)</span>
          <input type="number" step="0.5" value={s.sleep_goal_h} onChange={(e) => set({ sleep_goal_h: e.target.value })} /></label>
      </section>

      <section className="card">
        <div className="row between">
          <div>
            <div className="card-title no-margin">Área espiritual</div>
            <div className="muted small">Inclui a área espiritual nos desafios do dia.</div>
          </div>
          <button
            className={'toggle ' + (s.spiritual_enabled ? 'on' : '')}
            onClick={() => set({ spiritual_enabled: !s.spiritual_enabled })}
            aria-pressed={s.spiritual_enabled}
          >
            <span className="knob" />
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-title">Fuso horário</div>
        <div className="muted small" style={{ marginBottom: 8 }}>
          Define quando o dia vira à meia-noite (o placar zera no seu horário local, não em UTC).
        </div>
        <select
          className="input"
          value={s.timezone || 'America/Sao_Paulo'}
          onChange={(e) => set({ timezone: e.target.value })}
        >
          {(TIMEZONES.some(([tz]) => tz === s.timezone) ? TIMEZONES : [[s.timezone, s.timezone], ...TIMEZONES]).map(
            ([tz, label]) => (
              <option key={tz} value={tz}>{label}</option>
            ),
          )}
        </select>
      </section>

      <section className="card">
        <div className="card-title">Dias de descanso</div>
        <div className="chips">
          {WEEKDAYS.map((w, i) => (
            <button
              key={w}
              className={'chip ' + ((s.rest_days || []).includes(i) ? 'active' : '')}
              onClick={() => toggleRest(i)}
            >
              {w}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-title">Hábitos <span className="muted small">(10 pts cada · adicione quantos quiser)</span></div>
        <div className="habit-picker">
          {menu.map((h) => (
            <button
              key={h.key}
              className={'habit ' + (selected.has(h.key) ? 'done' : '')}
              onClick={() => toggleHabit(h.key)}
            >
              <span className="habit-emoji">{h.icon ? <Icon name={h.icon} size={18} /> : h.emoji}</span>
              <span className="habit-label">{h.label}</span>
              <span className={'check ' + (selected.has(h.key) ? 'on' : '')}>{selected.has(h.key) ? <Icon name="check" size={14} /> : ''}</span>
            </button>
          ))}
        </div>

        <div className="add-habit">
          <IconPicker
            emoji={newHabit.emoji}
            icon={newHabit.icon}
            onPick={({ emoji, icon }) => setNewHabit({ ...newHabit, emoji: emoji || '✅', icon })}
          />
          <input
            className="add-habit-label"
            placeholder="Novo hábito (ex: Tomar sol 10 min)"
            value={newHabit.label}
            onChange={(e) => setNewHabit({ ...newHabit, label: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && addHabit()}
          />
          <button className="btn btn-primary small-btn" onClick={addHabit} disabled={!newHabit.label.trim()}>
            + Add
          </button>
        </div>
        {selected.size === 0 && <div className="muted small">Selecione ao menos 1 (senão mantém o padrão).</div>}
      </section>

      <button className="btn full btn-primary sticky-save" onClick={save}>
        {saved ? '✓ Configurações salvas!' : 'Salvar configurações'}
      </button>
    </div>
  )
}
