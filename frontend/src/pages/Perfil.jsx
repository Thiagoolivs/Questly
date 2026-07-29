import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { getPushState, enablePush, disablePush } from '../utils/push.js'

const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🐯', '🐸', '🐵', '🦉', '🔥', '⚡', '🌟', '💜']

export default function Perfil() {
  const { user, me, group, groups, selectGroup, updateUser, logout, loading } = useApp()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [pushState, setPushState] = useState('off')
  const [pushBusy, setPushBusy] = useState(false)

  useEffect(() => {
    getPushState().then(setPushState).catch(() => setPushState('off'))
  }, [])

  async function togglePush() {
    if (pushBusy) return
    setPushBusy(true)
    try {
      setPushState(pushState === 'on' ? await disablePush() : await enablePush())
    } catch (e) {
      alert(e.message)
    } finally {
      setPushBusy(false)
    }
  }

  useEffect(() => {
    if (user)
      setForm({
        name: user.name,
        avatar: user.avatar,
        photo: user.photo || null,
        objetivo: user.objetivo || '',
        peso: user.peso ?? '',
      })
  }, [user?.id, user?.name, user?.avatar, user?.photo, user?.objetivo, user?.peso])

  async function changePhoto() {
    if (photoBusy) return
    const f = await pickImage()
    if (!f) return
    setPhotoBusy(true)
    try {
      const photo = await fileToCompressedDataURL(f, 320, 0.8)
      await updateUser({ photo })
    } catch (e) {
      alert('Não consegui enviar a foto: ' + e.message)
    } finally {
      setPhotoBusy(false)
    }
  }

  async function removePhoto() {
    if (photoBusy) return
    setPhotoBusy(true)
    try {
      await updateUser({ photo: null })
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading || !user || !form) return <div className="screen center muted">Carregando…</div>

  async function save() {
    await updateUser({
      name: form.name,
      avatar: form.avatar,
      objetivo: form.objetivo,
      peso: form.peso === '' ? null : Number(form.peso),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  function copyCode() {
    if (!group?.invite_code) return
    navigator.clipboard?.writeText(group.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  const s = me?.stats
  const stats = s
    ? [
        { label: 'Dias concluídos', value: s.completed_days, emoji: '✅' },
        { label: 'Sequência atual', value: s.streak, emoji: '🔥' },
        { label: 'Melhor sequência', value: s.best_streak, emoji: '🏅' },
        { label: 'Dias perfeitos', value: s.perfect_days, emoji: '⭐' },
        { label: 'Pontos totais', value: s.total, emoji: '💎' },
        { label: 'Conclusão', value: s.completion_pct + '%', emoji: '📈' },
      ]
    : []

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand"><span className="brand-mark">👤</span> Perfil</div>
        <div className="muted small">{user.email}</div>
      </header>

      <section className="card center">
        <div className="avatar-big">
          {form.photo ? <img className="avatar-big-photo" src={form.photo} alt="foto de perfil" /> : form.avatar}
        </div>
        <div className="photo-actions">
          <button className="btn ghost small-btn" disabled={photoBusy} onClick={changePhoto}>
            {photoBusy ? '…' : form.photo ? '📷 Trocar foto' : '📷 Enviar foto'}
          </button>
          {form.photo && (
            <button className="link-btn danger" disabled={photoBusy} onClick={removePhoto}>
              remover foto
            </button>
          )}
        </div>
        {!form.photo && (
          <>
            <div className="muted xsmall" style={{ marginTop: 4 }}>ou escolha um emoji</div>
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
          </>
        )}
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

      {/* Grupo atual + convite */}
      <section className="card">
        <div className="card-title">👥 Grupo</div>
        <div className="row between">
          <div>
            <div className="group-name">{group?.name}</div>
            <div className="muted xsmall">{group?.member_count ?? '—'} membro(s)</div>
          </div>
        </div>
        <div className="invite-box">
          <div>
            <div className="muted xsmall">Código de convite</div>
            <div className="invite-code">{group?.invite_code}</div>
          </div>
          <button className="btn ghost small-btn" onClick={copyCode}>
            {copied ? '✓ Copiado' : '📋 Copiar'}
          </button>
        </div>
        <p className="muted xsmall">Compartilhe esse código para alguém entrar no grupo.</p>

        {groups.length > 1 && (
          <div className="group-list">
            {groups.map((g) => (
              <button
                key={g.id}
                className={'group-row ' + (g.id === group?.id ? 'active' : '')}
                onClick={() => selectGroup(g.id)}
              >
                <span className="group-emoji">👥</span>
                <span className="group-main">
                  <span className="group-name">{g.name}</span>
                  <span className="muted xsmall">{g.member_count} membro(s)</span>
                </span>
                <span className="group-go">{g.id === group?.id ? '✓' : '→'}</span>
              </button>
            ))}
          </div>
        )}

        <button className="btn ghost full" onClick={() => selectGroup(null)}>
          Criar / entrar em outro grupo
        </button>
      </section>

      {/* Notificações push */}
      <section className="card">
        <div className="row between">
          <div>
            <div className="card-title no-margin">🔔 Notificações</div>
            <div className="muted small">
              {pushState === 'denied'
                ? 'Bloqueadas no navegador — libere nas permissões do site.'
                : pushState === 'unsupported'
                ? 'Não suportadas neste navegador.'
                : 'Lembretes do dia, avisos do par e do chat.'}
            </div>
          </div>
          {pushState !== 'unsupported' && pushState !== 'denied' && (
            <button
              className={'toggle ' + (pushState === 'on' ? 'on' : '')}
              onClick={togglePush}
              disabled={pushBusy}
              aria-pressed={pushState === 'on'}
            >
              <span className="knob" />
            </button>
          )}
        </div>
      </section>

      {stats.length > 0 && (
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
      )}

      <button className="btn full logout-btn" onClick={logout}>Sair da conta</button>
    </div>
  )
}
