import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, Input, ListRow } from '../design-system/components/index.js'
import IconPicker from '../components/IconPicker.jsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
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
  const [newHabit, setNewHabit] = useState({ icon: 'check', label: '' })
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState(null)
  const [genBusy, setGenBusy] = useState(false)
  const [genMsg, setGenMsg] = useState(null)

  useEffect(() => {
    if (!groupId) return
    api.settings(groupId)
      .then((d) => {
        const menuKeys = new Set((d.habits_menu || []).map((h) => h.key))
        const customs = (d.fixed_habits || []).filter((h) => !menuKeys.has(h.key))
        setMenu([...(d.habits_menu || []), ...customs])
        setS(d)
        setSelected(new Set((d.fixed_habits || []).map((h) => h.key)))
      })
      .catch((e) => setErr(e.message))
  }, [groupId])

  if (err) return <div className="screen center error" style={{ padding: 'var(--space-6)', color: 'var(--error)' }}>{err}</div>
  if (!s) return <div className="screen center muted" style={{ padding: 'var(--space-6)', color: 'var(--text-tertiary)' }}>Carregando…</div>

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
    const h = { key, label, icon: newHabit.icon || 'check', category: 'Personalizado' }
    setMenu([...menu, h])
    setSelected(new Set([...selected, key]))
    setNewHabit({ icon: 'check', label: '' })
  }

  async function save() {
    const fixed_habits = menu.filter((h) => selected.has(h.key))
    await api.updateSettings(groupId, {
      timezone: s.timezone || 'America/Sao_Paulo',
      challenge_start: s.challenge_start,
      challenge_end: s.challenge_end,
      water_goal_l: Number(s.water_goal_l),
      steps_goal: Number(s.steps_goal),
      protein_goal_g: Number(s.protein_goal_g),
      calories_goal: Number(s.calories_goal),
      sleep_goal_h: Number(s.sleep_goal_h),
      rest_days: s.rest_days || [],
      spiritual_enabled: s.spiritual_enabled,
      disabled_areas: s.disabled_areas || [],
      custom_challenges: s.custom_challenges || {},
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
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'var(--space-11)' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Configurações do grupo
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Regras e metas valem para todo mundo aqui.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Quando o desafio acontece
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
            Fora dessa janela ninguém consegue registrar — nem antes de começar,
            nem depois de terminar.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            <Input
              label="Começa em"
              type="datetime-local"
              value={(s.challenge_start || '').slice(0, 16)}
              onChange={(e) => set({ challenge_start: e.target.value })}
            />
            <Input
              label="Termina em"
              type="datetime-local"
              value={(s.challenge_end || '').slice(0, 16)}
              onChange={(e) => set({ challenge_end: e.target.value })}
            />
          </div>
          {s.challenge_status && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <Chip>
                {s.challenge_status === 'active' ? 'Em andamento'
                  : s.challenge_status === 'scheduled' ? 'Ainda não começou' : 'Encerrado'}
              </Chip>
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            Desafios por IA
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Gera um lote novo de desafios variados. O app sorteia desse lote a cada dia — os dois veem o mesmo desafio.
          </p>
          
          {s.ai_enabled ? (
            <>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', background: 'var(--surface-input)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                {s.ai_pool_count > 0
                  ? <><strong style={{ color: 'var(--text-primary)' }}>{s.ai_pool_count} desafios</strong> de IA no lote{aiUpdated ? ` · atualizado em ${aiUpdated}` : ''}.</>
                  : 'Nenhum lote gerado ainda — só os desafios fixos por enquanto.'}
              </div>
              <Button variant="secondary" block disabled={genBusy} onClick={generateAI}>
                <Icon name="refresh-cw" size={16} /> {genBusy ? 'Gerando…' : 'Gerar novos desafios'}
              </Button>
              {genMsg && (
                <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: genMsg.ok ? 'var(--text-secondary)' : 'var(--error)' }}>
                  {genMsg.text}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', background: 'var(--surface-input)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              Indisponível neste servidor. Para ativar, configure a API KEY no backend.
            </div>
          )}
        </Card>

        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
            Metas diárias (Padrão)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <Input label="Água (L)" type="number" step="0.1" value={s.water_goal_l} onChange={(e) => set({ water_goal_l: e.target.value })} />
            <Input label="Passos" type="number" value={s.steps_goal} onChange={(e) => set({ steps_goal: e.target.value })} />
            <Input label="Proteína (g)" type="number" value={s.protein_goal_g} onChange={(e) => set({ protein_goal_g: e.target.value })} />
            <Input label="Calorias" type="number" value={s.calories_goal} onChange={(e) => set({ calories_goal: e.target.value })} />
            <Input label="Sono (h)" type="number" step="0.5" value={s.sleep_goal_h} onChange={(e) => set({ sleep_goal_h: e.target.value })} />
          </div>
        </Card>

        <ChallengesCard s={s} set={set} />

        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
            Fuso horário
          </div>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            Define quando o dia vira à meia-noite (o placar zera no seu horário local).
          </p>
          <select
            value={s.timezone || 'America/Sao_Paulo'}
            onChange={(e) => set({ timezone: e.target.value })}
            style={{
              width: '100%', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--line-hairline)', background: 'var(--surface-input)',
              color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)',
              appearance: 'none', WebkitAppearance: 'none'
            }}
          >
            {(TIMEZONES.some(([tz]) => tz === s.timezone) ? TIMEZONES : [[s.timezone, s.timezone], ...TIMEZONES]).map(
              ([tz, label]) => (
                <option key={tz} value={tz}>{label}</option>
              ),
            )}
          </select>
        </Card>

        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            Dias de descanso
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {WEEKDAYS.map((w, i) => (
              <button
                key={w}
                style={{
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid',
                  borderColor: (s.rest_days || []).includes(i) ? 'var(--blue-glow)' : 'var(--line-hairline)',
                  background: (s.rest_days || []).includes(i) ? 'rgba(0,122,255,0.1)' : 'var(--surface-input)',
                  color: (s.rest_days || []).includes(i) ? 'var(--blue-glow)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)',
                  cursor: 'pointer'
                }}
                onClick={() => toggleRest(i)}
              >
                {w}
              </button>
            ))}
          </div>
        </Card>

        <Card pad="0 var(--pad-card)">
          <div style={{ padding: 'var(--pad-card-md)', paddingBottom: 'var(--space-2)' }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
              Hábitos
            </div>
            <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              10 pts cada · selecione quais estarão disponíveis
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--line-hairline)' }}>
            {menu.map((h, i) => (
              <ListRow
                key={h.key}
                title={h.label}
                left={
                  <div style={{ 
                    width: 32, height: 32, borderRadius: 'var(--radius-md)', 
                    background: selected.has(h.key) ? 'rgba(0,122,255,0.1)' : 'var(--surface-input)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: selected.has(h.key) ? 'var(--blue-glow)' : 'var(--text-tertiary)',
                    fontSize: h.icon ? 18 : 20
                  }}>
                    <Icon name={h.icon || "check-circle"} size={18} />
                  </div>
                }
                right={
                  <button
                    className={'toggle ' + (selected.has(h.key) ? 'on' : '')}
                    onClick={() => toggleHabit(h.key)}
                    aria-pressed={selected.has(h.key)}
                  >
                    <span className="knob" />
                  </button>
                }
                borderBottom={i < menu.length - 1}
              />
            ))}
          </div>

          <div style={{ padding: 'var(--pad-card-md)', borderTop: '1px solid var(--line-hairline)', background: 'var(--surface-input)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <div style={{ background: 'var(--surface-overlay)', border: '1px solid var(--line-hairline)', borderRadius: 'var(--radius-md)' }}>
                <IconPicker icon={newHabit.icon} onPick={({ icon }) => setNewHabit({ ...newHabit, icon })} />
              </div>
              <input
                style={{
                  flex: 1, padding: 'var(--space-2) var(--space-3)', borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--line-hairline)', background: 'var(--surface-overlay)',
                  color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)'
                }}
                placeholder="Novo hábito..."
                value={newHabit.label}
                onChange={(e) => setNewHabit({ ...newHabit, label: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && addHabit()}
              />
              <Button variant="primary" onClick={addHabit} disabled={!newHabit.label.trim()}>
                +
              </Button>
            </div>
            {selected.size === 0 && <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--warning)' }}>Selecione ao menos 1 (senão mantém o padrão).</div>}
          </div>
        </Card>

      </div>
      
      {/* Sticky Save Footer */}
      <div style={{
        position: 'fixed', bottom: 'calc(var(--tab-bar-height) + env(safe-area-inset-bottom))', left: 0, right: 0,
        padding: 'var(--space-4)', background: 'var(--surface-overlay)', borderTop: '1px solid var(--line-hairline)',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.05)', zIndex: 100
      }}>
        <Button variant="primary" block onClick={save}>
          {saved ? 'Configurações salvas' : 'Salvar configurações'}
        </Button>
      </div>
    </div>
  )
}

function ChallengesCard({ s, set }) {
  const areas = s.areas || ['Física', 'Mental', 'Social', 'Relação', 'Espiritual']
  const diffs = [
    { key: 'facil', label: 'Fácil', points: 10 },
    { key: 'medio', label: 'Médio', points: 25 },
    { key: 'dificil', label: 'Difícil', points: 45 },
  ]
  const off = s.disabled_areas || []
  const custom = s.custom_challenges || {}
  const [area, setArea] = useState(areas[0])
  const [diff, setDiff] = useState('facil')
  const [text, setText] = useState('')

  const listOf = (a, d) => (custom[a] && custom[a][d]) || []

  const toggleArea = (a) => {
    const next = off.includes(a) ? off.filter((x) => x !== a) : [...off, a]
    if (next.length >= areas.length) return alert('Deixe pelo menos uma área ativa.')
    set({ disabled_areas: next, spiritual_enabled: !next.includes('Espiritual') })
  }

  const patchArea = (a, patch) =>
    set({ custom_challenges: { ...custom, [a]: { ...(custom[a] || {}), ...patch } } })

  function addChallenge() {
    const t = text.trim()
    if (!t) return
    const cur = listOf(area, diff)
    if (cur.includes(t)) return setText('')
    patchArea(area, { [diff]: [...cur, t] })
    setText('')
  }

  const removeChallenge = (a, d, t) => patchArea(a, { [d]: listOf(a, d).filter((x) => x !== t) })

  const mine = Object.entries(custom).flatMap(([a, block]) =>
    diffs.flatMap((dd) => ((block && block[dd.key]) || []).map((t) => ({ area: a, diff: dd.key, label: dd.label, text: t }))),
  )

  return (
    <Card>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-1)' }}>
        Desafios Pessoais
      </div>
      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
        Áreas ativas — o dia sorteia um desafio de cada área.
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        {areas.map((a) => (
          <button 
            key={a} 
            style={{
              padding: 'var(--space-2) var(--space-4)',
              borderRadius: 'var(--radius-pill)',
              border: '1px solid',
              borderColor: off.includes(a) ? 'var(--line-hairline)' : 'var(--blue-glow)',
              background: off.includes(a) ? 'var(--surface-input)' : 'rgba(0,122,255,0.1)',
              color: off.includes(a) ? 'var(--text-secondary)' : 'var(--blue-glow)',
              fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)',
              cursor: 'pointer'
            }}
            onClick={() => toggleArea(a)}
          >
            {a}
          </button>
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--line-hairline)', margin: '0 -var(--pad-card-md) var(--space-6)' }} />

      <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
        Escreva desafios de vocês (entram no sorteio junto com os do app):
      </p>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        {areas.filter((a) => !off.includes(a)).map((a) => (
          <button 
            key={a} 
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: area === a ? 'var(--text-primary)' : 'var(--surface-input)',
              color: area === a ? 'var(--surface-overlay)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)',
              cursor: 'pointer'
            }}
            onClick={() => setArea(a)}
          >
            {a}
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        {diffs.map((d) => (
          <button 
            key={d.key} 
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: diff === d.key ? 'var(--text-primary)' : 'var(--surface-input)',
              color: diff === d.key ? 'var(--surface-overlay)' : 'var(--text-secondary)',
              fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)',
              cursor: 'pointer'
            }}
            onClick={() => setDiff(d.key)}
          >
            {d.label} · {d.points}pts
          </button>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
        <input
          style={{
            flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)',
            border: '1px solid var(--line-hairline)', background: 'var(--surface-overlay)',
            color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)'
          }}
          placeholder={`Ex: desafio de ${area.toLowerCase()}…`}
          value={text}
          maxLength={160}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addChallenge()}
        />
        <Button variant="primary" disabled={!text.trim()} onClick={addChallenge}>+</Button>
      </div>

      {mine.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-6)' }}>
          {mine.map((c) => (
            <div key={c.area + c.diff + c.text} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)', background: 'var(--surface-input)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 2 }}>
                  {c.area} · {c.label}
                </div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-primary)' }}>
                  {c.text}
                </div>
              </div>
              <button 
                onClick={() => removeChallenge(c.area, c.diff, c.text)}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 'var(--space-1)' }}
              >
                <Icon name="x" size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {areas.filter((a) => !off.includes(a)).map((a) => {
        const has = diffs.some((d) => listOf(a, d.key).length)
        if (!has) return null
        return (
          <div key={a} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-3) 0', borderTop: '1px solid var(--line-hairline)' }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)' }}>
              Em <strong>{a}</strong>, usar só desafios criados
            </span>
            <button
              className={'toggle ' + ((custom[a] && custom[a].only) ? 'on' : '')}
              onClick={() => patchArea(a, { only: !(custom[a] && custom[a].only) })}
              aria-pressed={!!(custom[a] && custom[a].only)}
            >
              <span className="knob" />
            </button>
          </div>
        )
      })}
    </Card>
  )
}
