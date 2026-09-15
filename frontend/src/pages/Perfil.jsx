import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../store.jsx'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { getPushState, enablePush, disablePush } from '../utils/push.js'
import { forceUpdate } from '../utils/pwa.js'
import { startTour } from '../components/Onboarding.jsx'
import InstallGuide from '../components/InstallGuide.jsx'
import { shareInvite } from '../utils/invite.js'
import { Avatar, Button, Card, Chip, Icon, Input, ListRow, SegmentedControl } from '../design-system/components/index.js'

const AVATARS = ['smile', 'heart', 'star', 'zap', 'sun', 'moon', 'music', 'camera', 'coffee', 'award', 'gift', 'flag']
const ATIVIDADES = [
  { value: '', label: 'Não informar' },
  { value: 'sedentario', label: 'Sedentário' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'intenso', label: 'Intenso' },
  { value: 'muito_intenso', label: 'Muito intenso' },
]

const BMI_LABEL = { abaixo: 'abaixo do peso', normal: 'peso normal', sobrepeso: 'sobrepeso', obesidade: 'obesidade' }
const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export default function Perfil() {
  const { user, me, group, groups, selectGroup, updateUser, logout, loading } = useApp()
  const [form, setForm] = useState(null)
  const [saved, setSaved] = useState(false)
  const [savedN, setSavedN] = useState(false)
  const [copied, setCopied] = useState(false)
  const [linkShared, setLinkShared] = useState(false)
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

  if (loading || !user || !form) return <div className="screen center muted" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', color: 'var(--text-tertiary)', textAlign: 'center' }}>Carregando…</div>

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

  async function shareLink() {
    if (!group?.invite_code) return
    const r = await shareInvite(group.invite_code, group.name)
    if (r === 'copied' || r === 'shared') {
      setLinkShared(true)
      setTimeout(() => setLinkShared(false), 1800)
    }
  }

  const s = me?.stats
  const stats = s
    ? [
        { label: 'Dias concluídos', value: s.completed_days, icon: 'check-circle' },
        { label: 'Sequência', value: s.streak, icon: 'flame' },
        { label: 'Pontos', value: s.total, icon: 'target' },
      ]
    : []

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Perfil
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          {user.email}
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {/* IDENTITY */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <Avatar src={form.photo || form.avatar} name={form.name} size={120} />
          
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="secondary" size="sm" onClick={changePhoto} disabled={photoBusy}>
              <Icon name="camera" size={16} /> {photoBusy ? '…' : form.photo ? 'Trocar' : 'Enviar foto'}
            </Button>
            {form.photo && (
              <Button variant="danger" size="sm" onClick={removePhoto} disabled={photoBusy}>
                Remover
              </Button>
            )}
          </div>
          
          {!form.photo && (
            <div style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 'var(--space-3)' }}>
                ou escolha um ícone
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--space-2)', maxWidth: 300, margin: '0 auto' }}>
                <button
                  style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: !form.avatar ? 'var(--blue-glow)' : 'var(--surface-sunken)',
                    color: !form.avatar ? '#fff' : 'var(--text-primary)',
                    border: 'none', borderRadius: '50%', fontSize: 18, cursor: 'pointer', fontFamily: 'var(--font-ui)', fontWeight: 'var(--fw-bold)'
                  }}
                  onClick={() => setForm({ ...form, avatar: '' })}
                >
                  {(form.name || '?').charAt(0).toUpperCase()}
                </button>
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    style={{
                      aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: form.avatar === a ? 'var(--blue-glow)' : 'var(--surface-sunken)',
                      color: form.avatar === a ? '#fff' : 'var(--text-secondary)',
                      border: 'none', borderRadius: '50%', cursor: 'pointer'
                    }}
                    onClick={() => setForm({ ...form, avatar: a })}
                  >
                    <Icon name={a} size={20} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* STATS */}
        {stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
            {stats.map((st) => (
              <Card key={st.label} padding="md" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Icon name={st.icon} size={24} color="var(--blue-glow)" />
                <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-title-3)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
                  {st.value}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                  {st.label}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* BASIC INFO */}
        <Card padding="md">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <Input 
              label="Nome" 
              value={form.name} 
              onChange={(e) => setForm({ ...form, name: e.target.value })} 
            />
            <Input 
              label="Objetivo" 
              placeholder="Ex: evoluir com constância" 
              value={form.objetivo} 
              onChange={(e) => setForm({ ...form, objetivo: e.target.value })} 
            />
            <Button variant="primary" block onClick={save}>
              {saved ? 'Salvo' : 'Salvar perfil'}
            </Button>
          </div>
        </Card>

        {/* NUTRITION */}
        <NutritionCard form={form} setForm={setForm} nt={user.nutrition_targets} onSave={saveNutrition} saved={savedN} />

        {/* GROUP */}
        <Card padding="none">
          <div style={{ padding: 'var(--pad-card-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
                Grupo
              </div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                {group?.name} <span style={{ color: 'var(--text-tertiary)' }}>· {group?.member_count ?? '—'} membro(s)</span>
              </div>
            </div>

            <div style={{ background: 'var(--surface-sunken)', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)' }}>Código de convite</div>
                <div style={{ fontFamily: 'var(--font-ui)', fontVariantNumeric: 'tabular-nums', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', letterSpacing: 1 }}>
                  {group?.invite_code}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={copyCode}>
                <Icon name={copied ? 'check' : 'copy'} size={16} /> {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>

            <Button variant="primary" block onClick={shareLink}>
              <Icon name={linkShared ? 'check' : 'users'} size={18} /> {linkShared ? 'Link pronto!' : 'Convidar por link'}
            </Button>
          </div>

          {groups.length > 1 && (
            <div style={{ borderTop: '1px solid var(--line-hairline)' }}>
              {groups.map((g, i) => (
                <ListRow
                  key={g.id}
                  title={g.name}
                  subtitle={`${g.member_count} membro(s)`}
                  left={<Icon name="users" color="var(--text-tertiary)" size={20} />}
                  right={<Icon name={g.id === group?.id ? 'check' : 'chevron-right'} color={g.id === group?.id ? 'var(--blue-glow)' : 'var(--text-tertiary)'} size={16} />}
                  borderBottom={i < groups.length - 1}
                  onClick={() => selectGroup(g.id)}
                  style={{ cursor: 'pointer', background: g.id === group?.id ? 'rgba(0,122,255,0.05)' : 'transparent' }}
                />
              ))}
            </div>
          )}
          
          <div style={{ borderTop: '1px solid var(--line-hairline)', padding: 'var(--pad-card-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <Button variant="secondary" block onClick={() => selectGroup(null)}>
              Mudar de grupo
            </Button>
            <Link to="/config" style={{ textDecoration: 'none' }}>
              <Button variant="glass" block>
                <Icon name="settings" size={16} /> Configurações do grupo
              </Button>
            </Link>
          </div>
        </Card>

        {/* SYSTEM PREFS */}
        <Card padding="none">
          <ListRow
            title="Notificações"
            subtitle={
              pushState === 'denied' ? 'Bloqueadas no navegador.'
              : pushState === 'unsupported' ? 'Não suportadas.'
              : 'Lembretes e avisos do grupo.'
            }
            icon="bell"
            right={
              pushState !== 'unsupported' && pushState !== 'denied' && (
                <button
                  className={'toggle ' + (pushState === 'on' ? 'on' : '')}
                  onClick={togglePush}
                  disabled={pushBusy}
                  aria-pressed={pushState === 'on'}
                >
                  <span className="knob" />
                </button>
              )
            }
            borderBottom={true}
          />
          <div style={{ padding: 'var(--pad-card-md)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', marginBottom: 'var(--space-3)' }}>
              App na tela inicial
            </div>
            <InstallGuide />
          </div>
        </Card>

        {/* ACTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
          <Button variant="secondary" block onClick={startTour}>
            <Icon name="help-circle" size={16} /> Rever tour do app
          </Button>
          <Button variant="secondary" block onClick={forceUpdate}>
            <Icon name="refresh-cw" size={16} /> Buscar atualização
          </Button>
          <Button variant="danger" block onClick={logout}>
            <Icon name="log-out" size={16} /> Sair da conta
          </Button>
        </div>
      </div>
    </div>
  )
}

function NutritionCard({ form, setForm, nt, onSave, saved }) {
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const est = (nt && (nt.auto || nt.targets)) || {}
  const rows = [
    ['meta_kcal', 'Calorias (kcal)', est.kcal],
    ['meta_proteina_g', 'Proteína (g)', est.protein_g],
    ['meta_carbo_g', 'Carboidrato (g)', est.carbs_g],
    ['meta_gordura_g', 'Gordura (g)', est.fat_g],
    ['meta_agua_l', 'Água (L)', est.water_l],
  ]

  return (
    <Card padding="md">
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
        Metas de Nutrição
      </div>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
        Estimativas com base no seu perfil — <strong style={{ color: 'var(--text-primary)' }}>não substituem um nutricionista</strong>. Ajuste os valores como quiser.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input 
            label="Peso (kg)" 
            type="number" 
            inputMode="decimal" 
            value={form.peso} 
            onChange={(e) => set({ peso: e.target.value })} 
          />
          <Input 
            label="Altura (cm)" 
            type="number" 
            inputMode="numeric" 
            value={form.altura_cm} 
            onChange={(e) => set({ altura_cm: e.target.value })} 
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input 
            label="Idade" 
            type="number" 
            inputMode="numeric" 
            value={form.idade} 
            onChange={(e) => set({ idade: e.target.value })} 
          />
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
              Sexo
            </div>
            <SegmentedControl
              options={[{ label: 'Masculino', value: 'M' }, { label: 'Feminino', value: 'F' }]}
              value={form.sexo}
              onChange={(val) => set({ sexo: val === form.sexo ? '' : val })}
            />
          </div>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            Nível de atividade
          </div>
          <select 
            value={form.nivel_atividade} 
            onChange={(e) => set({ nivel_atividade: e.target.value })}
            style={{
              width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line-hairline)', background: 'var(--surface-sunken)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)',
              appearance: 'none', WebkitAppearance: 'none'
            }}
          >
            {ATIVIDADES.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>

        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
            Objetivo
          </div>
          <SegmentedControl
            options={[
              { label: 'Perder', value: 'perder' },
              { label: 'Manter', value: 'manter' },
              { label: 'Ganhar', value: 'ganhar' }
            ]}
            value={form.objetivo_tipo}
            onChange={(val) => set({ objetivo_tipo: val === form.objetivo_tipo ? '' : val })}
          />
        </div>

        {nt?.bmi != null && (
          <div style={{ background: 'var(--surface-sunken)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-1)', marginTop: 'var(--space-2)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              IMC <strong style={{ color: 'var(--text-primary)' }}>{nt.bmi}</strong> · {BMI_LABEL[nt.bmi_class] || nt.bmi_class}
            </div>
            {nt.tdee && (
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
                Gasto diário estimado: <strong style={{ color: 'var(--text-primary)' }}>~{nt.tdee} kcal</strong>
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--line-hairline)', margin: 'var(--space-4) 0' }} />

        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Metas Diárias Personalizadas
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            {rows.map(([key, label, estv]) => (
              <Input
                key={key}
                label={label}
                type="number"
                inputMode="decimal"
                value={form[key]}
                placeholder={estv != null ? `~${estv}` : ''}
                onChange={(e) => set({ [key]: e.target.value })}
              />
            ))}
          </div>
        </div>

        <Button variant="primary" block onClick={onSave} style={{ marginTop: 'var(--space-4)' }}>
          {saved ? 'Salvo' : 'Salvar metas'}
        </Button>
      </div>
    </Card>
  )
}
