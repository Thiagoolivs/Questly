import { useState, useEffect } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Button, Card, Chip, Icon, IconButton, Input, ListRow, Select } from '../design-system/components/index.js'
import IconPicker from '../components/IconPicker.jsx'
import Switch from '../components/Switch.jsx'
import VoltarPara from '../components/VoltarPara.jsx'

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

  if (err) return <div className="screen center error" style={{ padding: 'var(--space-6)', color: 'var(--danger)' }}>{err}</div>
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
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        <VoltarPara para="/grupo" />
        <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Configurações do grupo
        </h1>
        <p style={{ margin: '2px 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
          Valem para todo mundo aqui
        </p>
      </div>
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
              <Button variant="secondary" fullWidth disabled={genBusy} onClick={generateAI}>
                <Icon name="refresh-cw" size={16} /> {genBusy ? 'Gerando…' : 'Gerar novos desafios'}
              </Button>
              {genMsg && (
                <div style={{ marginTop: 'var(--space-3)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: genMsg.ok ? 'var(--text-secondary)' : 'var(--danger)' }}>
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
            Metas diárias do grupo
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-5)' }}>
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
          <Select
            value={s.timezone || 'America/Sao_Paulo'}
            onChange={(e) => set({ timezone: e.target.value })}
            options={(TIMEZONES.some(([tz]) => tz === s.timezone) ? TIMEZONES : [[s.timezone, s.timezone], ...TIMEZONES]).map(
              ([tz, label]) => ({ value: tz, label }),
            )}
          />
        </Card>

        <Card>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            Dias de descanso
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {WEEKDAYS.map((w, i) => (
              <Chip
                key={w}
                selected={(s.rest_days || []).includes(i)}
                onClick={() => toggleRest(i)}
                style={{ flex: 1, minWidth: 0, padding: 0 }}
              >
                {w}
              </Chip>
            ))}
          </div>
        </Card>

        <Card pad="0 var(--pad-card)">
          <div style={{ padding: 'var(--pad-card)', paddingBottom: 'var(--space-2)' }}>
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
                divider={i < menu.length - 1}
                chevron={false}
                leading={
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      flex: 'none',
                      borderRadius: 'var(--radius-md)',
                      background: selected.has(h.key) ? 'var(--surface-accent-soft)' : 'var(--surface-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon
                      name={h.icon || 'check-circle'}
                      size={16}
                      color={selected.has(h.key) ? 'var(--blue-glow)' : 'var(--text-tertiary)'}
                    />
                  </div>
                }
                trailing={
                  <Switch checked={selected.has(h.key)} onChange={() => toggleHabit(h.key)} label={h.label} />
                }
              />
            ))}
          </div>

          <div style={{ padding: 'var(--pad-card) 0', borderTop: '1px solid var(--line-hairline)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
              <div style={{ flex: 'none', background: 'var(--surface-input)', border: 'var(--border-input)', borderRadius: 'var(--radius-md)' }}>
                <IconPicker icon={newHabit.icon} onPick={({ icon }) => setNewHabit({ ...newHabit, icon })} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Input
                  placeholder="Criar um hábito novo"
                  value={newHabit.label}
                  onChange={(e) => setNewHabit({ ...newHabit, label: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addHabit()}
                />
              </div>
              <IconButton
                icon="plus"
                tone="accent"
                label="Adicionar hábito"
                onClick={addHabit}
                disabled={!newHabit.label.trim()}
              />
            </div>
            {selected.size === 0 && (
              <p style={{ margin: 'var(--space-4) 0 0', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--warning)' }}>
                Selecione ao menos 1 — sem nenhum, o app mantém a lista padrão.
              </p>
            )}
          </div>
        </Card>


        {/* `sticky`, não `fixed`: o botão acompanha a rolagem mas continua no
            fluxo, então a página reserva o espaço dele. Fixo e semitransparente
            ele pairava no meio do conteúdo e escondia os campos de trás. */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            zIndex: 1,
            marginLeft: 'calc(-1 * var(--gutter-screen))',
            marginRight: 'calc(-1 * var(--gutter-screen))',
            padding: 'var(--space-5) var(--gutter-screen)',
            paddingBottom: 'calc(var(--space-5) + env(safe-area-inset-bottom, 0px))',
            background: 'var(--surface-page)',
            borderTop: '1px solid var(--line-hairline)',
          }}
        >
          <Button variant="accent" size="lg" fullWidth onClick={save}>
            {saved ? 'Configurações salvas' : 'Salvar configurações'}
          </Button>
        </div>
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
      
      {/* Uma fileira de áreas só: antes havia duas quase idênticas — uma para
          ligar/desligar a área, outra para escolher onde escrever — e não dava
          para saber o que cada clique fazia. Agora a área selecionada é a mesma
          coisa nos dois casos. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-5)' }}>
        {areas.map((a) => (
          <Chip key={a} selected={area === a} onClick={() => setArea(a)}>
            {a}
          </Chip>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          padding: 'var(--space-4) 0',
          borderTop: '1px solid var(--line-hairline)',
          borderBottom: '1px solid var(--line-hairline)',
          marginBottom: 'var(--space-5)',
        }}
      >
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
          Sortear desafios de <strong style={{ color: 'var(--text-primary)' }}>{area}</strong>
        </span>
        <Switch checked={!off.includes(area)} onChange={() => toggleArea(area)} label={`Ativar área ${area}`} />
      </div>

      {off.includes(area) ? (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
          Área desligada — nada de {area.toLowerCase()} aparece no dia.
        </p>
      ) : (
        <>
          <p style={{ margin: '0 0 var(--space-4)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
            Escreva desafios de vocês — eles entram no sorteio junto com os do app.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            {diffs.map((d) => (
              <Chip key={d.key} selected={diff === d.key} onClick={() => setDiff(d.key)}>
                {d.label} · {d.points} pts
              </Chip>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input
                placeholder={`Desafio de ${area.toLowerCase()}…`}
                value={text}
                maxLength={160}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addChallenge()}
              />
            </div>
            <IconButton icon="plus" tone="accent" label="Adicionar desafio" disabled={!text.trim()} onClick={addChallenge} />
          </div>
        </>
      )}

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
            <Switch
              checked={!!(custom[a] && custom[a].only)}
              onChange={() => patchArea(a, { only: !(custom[a] && custom[a].only) })}
              label={`Em ${a}, usar só desafios criados`}
            />
          </div>
        )
      })}
    </Card>
  )
}
