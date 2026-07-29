import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import PlayerSwitch from '../components/PlayerSwitch.jsx'

const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🐯', '🐸', '🐵', '🦉', '🔥', '⚡', '🌟', '💜']

export default function Perfil() {
  const { me, playerId, refresh, loading } = useApp()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (me)
      setForm({
        name: me.name,
        avatar: me.avatar,
        objetivo: me.objetivo || '',
        peso: me.peso ?? '',
      })
  }, [me?.id, me?.name, me?.avatar, me?.objetivo, me?.peso])

  if (loading || !me || !form) return <div className="screen center muted">Carregando…</div>

  async function save() {
    await api.updatePlayer(playerId, {
      name: form.name,
      avatar: form.avatar,
      objetivo: form.objetivo,
      peso: form.peso === '' ? null : Number(form.peso),
    })
    await refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const s = me.stats
  const stats = [
    { label: 'Dias concluídos', value: s.completed_days, emoji: '✅' },
    { label: 'Sequência atual', value: s.streak, emoji: '🔥' },
    { label: 'Melhor sequência', value: s.best_streak, emoji: '🏅' },
    { label: 'Dias perfeitos', value: s.perfect_days, emoji: '⭐' },
    { label: 'Pontos totais', value: s.total, emoji: '💎' },
    { label: 'Conclusão', value: s.completion_pct + '%', emoji: '📈' },
  ]

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">👤</span> Perfil</div>
      </header>
      <PlayerSwitch />

      <section className="card center">
        <div className="avatar-big">{form.avatar}</div>
        <div className="avatar-picker">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={'avatar-opt ' + (a === form.avatar ? 'active' : '')}
              onClick={() => setForm({ ...form, avatar: a })}
            >
              {a}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <label className="field">
          <span>Nome</span>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Objetivo</span>
          <input
            value={form.objetivo}
            placeholder="Ex: evoluir com constância"
            onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Peso (kg) — opcional</span>
          <input
            type="number"
            inputMode="decimal"
            value={form.peso}
            onChange={(e) => setForm({ ...form, peso: e.target.value })}
          />
        </label>
        <button className="btn full btn-primary" onClick={save}>
          {saved ? '✓ Salvo!' : 'Salvar perfil'}
        </button>
      </section>

      <section className="card">
        <div className="card-title">Estatísticas</div>
        <div className="stat-grid">
          {stats.map((st) => (
            <div className="stat-box" key={st.label}>
              <div className="stat-emoji">{st.emoji}</div>
              <div className="stat-value">{st.value}</div>
              <div className="muted xsmall">{st.label}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
