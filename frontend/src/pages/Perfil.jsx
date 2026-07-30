import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { getPushState, enablePush, disablePush } from '../utils/push.js'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'

const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🐯', '🐸', '🐵', '🦉', '🔥', '⚡', '🌟', '💜']
const ATIVIDADES = [
  ['sedentario', 'Sedentário'],
  ['leve', 'Leve'],
  ['moderado', 'Moderado'],
  ['intenso', 'Intenso'],
  ['muito_intenso', 'Muito intenso'],
]
const OBJETIVOS = [['perder', 'Perder peso'], ['manter', 'Manter'], ['ganhar', 'Ganhar massa']]
const BMI_LABEL = { abaixo: 'abaixo do peso', normal: 'peso normal', sobrepeso: 'sobrepeso', obesidade: 'obesidade' }
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function Perfil() {
  const { user, me, group, groups, selectGroup, updateUser, logout, loading } = useApp()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [savedN, setSavedN] = useState(false)
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
        altura_cm: user.altura_cm ?? '',
        sexo: user.sexo ?? '',
        idade: user.idade ?? '',
        nivel_atividade: user.nivel_atividade ?? '',
        objetivo_tipo: user.objetivo_tipo ?? '',
        meta_kcal: user.meta_kcal ?? '',
        meta_proteina_g: user.meta_proteina_g ?? '',
        meta_carbo_g: user.meta_carbo_g ?? '',
        meta_gordura_g: user.meta_gordura_g ?? '',
        meta_agua_l: user.meta_agua_l ?? '',
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
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  async function saveNutrition() {
    await updateUser({
      peso: numOrNull(form.peso),
      altura_cm: numOrNull(form.altura_cm),
      sexo: form.sexo || null,
      idade: numOrNull(form.idade),
      nivel_atividade: form.nivel_atividade || null,
      objetivo_tipo: form.objetivo_tipo || null,
      meta_kcal: numOrNull(form.meta_kcal),
      meta_proteina_g: numOrNull(form.meta_proteina_g),
      meta_carbo_g: numOrNull(form.meta_carbo_g),
      meta_gordura_g: numOrNull(form.meta_gordura_g),
      meta_agua_l: numOrNull(form.meta_agua_l),
    })
    setSavedN(true)
    setTimeout(() => setSavedN(false), 1800)
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
        <div className="brand">Perfil</div>
        <div className="muted small">{user.email}</div>
      </header>

      <section className="card center">
        <div className="avatar-big">
          <Avatar photo={form.photo} avatar={form.avatar} name={form.name} size={104} />
        </div>
        <div className="photo-actions">
          <button className="btn ghost small-btn icon-btn" disabled={photoBusy} onClick={changePhoto}>
            <Icon name="camera" size={15} /> {photoBusy ? '…' : form.photo ? 'Trocar foto' : 'Enviar foto'}
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
              <button
                className={'avatar-opt mono-opt ' + (!form.avatar ? 'active' : '')}
                title="Monograma (inicial)"
                onClick={() => setForm({ ...form, avatar: '' })}
              >
                {(form.name || '?').charAt(0).toUpperCase()}
              </button>
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
        <button className="btn full btn-primary" onClick={save}>
          {saved ? '✓ Salvo!' : 'Salvar perfil'}
        </button>
      </section>

      {/* Metas de nutrição (estimativa por perfil, ajustável) */}
      <NutritionCard form={form} setForm={setForm} nt={user.nutrition_targets} onSave={saveNutrition} saved={savedN} />

      {/* Grupo atual + convite */}
      <section className="card">
        <div className="card-title">Grupo</div>
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
          <button className="btn ghost small-btn icon-btn" onClick={copyCode}>
            <Icon name={copied ? 'check' : 'copy'} size={14} /> {copied ? 'Copiado' : 'Copiar'}
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
                <span className="group-emoji"><Icon name="users" size={18} /></span>
                <span className="group-main">
                  <span className="group-name">{g.name}</span>
                  <span className="muted xsmall">{g.member_count} membro(s)</span>
                </span>
                <span className="group-go"><Icon name={g.id === group?.id ? 'check' : 'chevronRight'} size={16} /></span>
              </button>
            ))}
          </div>
        )}

        <button className="btn ghost full" onClick={() => selectGroup(null)}>
          Criar / entrar em outro grupo
        </button>
        <Link to="/config" className="btn ghost full config-link icon-btn">
          <Icon name="settings" size={15} /> Configurações do grupo
        </Link>
      </section>

      {/* Notificações push */}
      <section className="card">
        <div className="row between">
          <div>
            <div className="card-title no-margin">Notificações</div>
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
                <div className="stat-value">{st.value}</div>
                <div className="muted xsmall">{st.label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <button className="btn full logout-btn icon-btn" onClick={logout}><Icon name="logout" size={15} /> Sair da conta</button>
    </div>
  )
}

function NutritionCard({ form, setForm, nt, onSave, saved }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const est = (nt && (nt.auto || nt.targets)) || {}
  const rows = [
    ['meta_kcal', 'Calorias', 'kcal', est.kcal],
    ['meta_proteina_g', 'Proteína', 'g', est.protein_g],
    ['meta_carbo_g', 'Carboidrato', 'g', est.carbs_g],
    ['meta_gordura_g', 'Gordura', 'g', est.fat_g],
    ['meta_agua_l', 'Água', 'L', est.water_l],
  ]
  return (
    <section className="card">
      <div className="card-title">Metas de nutrição</div>
      <p className="muted xsmall" style={{ marginTop: -4, marginBottom: 10 }}>
        Estimativas com base no seu perfil — <b>não substituem um nutricionista</b>. Ajuste os valores como quiser.
      </p>

      <div className="nutri-form">
        <label className="field"><span>Peso (kg)</span>
          <input type="number" inputMode="decimal" value={form.peso} onChange={(e) => set({ peso: e.target.value })} /></label>
        <label className="field"><span>Altura (cm)</span>
          <input type="number" inputMode="numeric" value={form.altura_cm} onChange={(e) => set({ altura_cm: e.target.value })} /></label>
        <label className="field"><span>Idade</span>
          <input type="number" inputMode="numeric" value={form.idade} onChange={(e) => set({ idade: e.target.value })} /></label>
      </div>

      <div className="field"><span>Sexo <span className="muted xsmall">(opcional, melhora a estimativa)</span></span>
        <div className="chips">
          <button className={'chip ' + (form.sexo === 'M' ? 'active' : '')} onClick={() => set({ sexo: form.sexo === 'M' ? '' : 'M' })}>Masculino</button>
          <button className={'chip ' + (form.sexo === 'F' ? 'active' : '')} onClick={() => set({ sexo: form.sexo === 'F' ? '' : 'F' })}>Feminino</button>
        </div>
      </div>

      <label className="field"><span>Nível de atividade <span className="muted xsmall">(opcional)</span></span>
        <select value={form.nivel_atividade} onChange={(e) => set({ nivel_atividade: e.target.value })}>
          <option value="">Não informar</option>
          {ATIVIDADES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>

      <div className="field"><span>Objetivo</span>
        <div className="chips">
          {OBJETIVOS.map(([v, l]) => (
            <button key={v} className={'chip ' + (form.objetivo_tipo === v ? 'active' : '')}
              onClick={() => set({ objetivo_tipo: form.objetivo_tipo === v ? '' : v })}>{l}</button>
          ))}
        </div>
      </div>

      {nt?.bmi != null && (
        <div className="nutri-imc muted small">
          IMC <b>{nt.bmi}</b> · {BMI_LABEL[nt.bmi_class] || nt.bmi_class}
          {nt.tdee ? ` · gasto estimado ~${nt.tdee} kcal/dia` : ''}
        </div>
      )}

      <div className="muted xsmall" style={{ margin: '12px 0 6px' }}>
        Metas diárias — deixe em branco para usar a estimativa (mostrada como sugestão):
      </div>
      <div className="nutri-targets-edit">
        {rows.map(([key, label, unit, estv]) => (
          <label className="field row nutri-target-row" key={key}>
            <span>{label} <span className="muted xsmall">({unit})</span></span>
            <input type="number" inputMode="decimal" value={form[key]}
              placeholder={estv != null ? `~${estv}` : ''}
              onChange={(e) => set({ [key]: e.target.value })} />
          </label>
        ))}
      </div>

      <button className="btn full btn-primary" onClick={onSave}>{saved ? '✓ Salvo!' : 'Salvar metas'}</button>
    </section>
  )
}
