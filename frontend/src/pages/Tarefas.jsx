import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { Button, Card, Chip, Icon, IconButton, Input, ListRow, Select } from '../design-system/components/index.js'
import CheckControl from '../components/CheckControl.jsx'
import IconPicker from '../components/IconPicker.jsx'
import VoltarPara from '../components/VoltarPara.jsx'
import Sheet from '../components/Sheet.jsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FORM_VAZIO = { icon: 'calendar', title: '', kind: 'once', date: '', time: '', weekdays: [] }

function onceLabel(iso) {
  if (!iso) return 'Sem data'
  return new Date(iso + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function taskWhen(t) {
  const base = t.kind === 'once' ? onceLabel(t.date) : (t.weekdays || []).map((i) => WEEKDAYS[i]).join(' · ')
  return t.time ? `${base} · ${t.time}` : base
}

export default function Tarefas() {
  const { groupId } = useApp()
  const [tasks, setTasks] = useState(null)
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10))
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(null)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(FORM_VAZIO)

  const load = useCallback(() => {
    if (!groupId) return
    api
      .tasks(groupId, '?all=true')
      .then((d) => {
        setTasks(d.tasks)
        if (d.date) setToday(d.date)
      })
      .catch((e) => setErr(e.message))
  }, [groupId])

  useEffect(() => {
    load()
  }, [load])

  async function run(fn) {
    if (busy) return
    setBusy(true)
    try {
      await fn()
      load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const toggle = (id) => run(() => api.completeTask(groupId, id, { date: today }))

  const remove = (id) => {
    if (!confirm('Remover esta tarefa?')) return
    run(() => api.deleteTask(groupId, id))
  }

  async function attachPhoto(id) {
    const f = await pickImage()
    if (!f) return
    const image = await fileToCompressedDataURL(f)
    await run(() => api.completeTask(groupId, id, { date: today, image }))
  }

  const toggleWeekday = (i) =>
    setForm((f) => ({
      ...f,
      weekdays: f.weekdays.includes(i) ? f.weekdays.filter((d) => d !== i) : [...f.weekdays, i].sort(),
    }))

  function create() {
    if (!form.title.trim()) return
    if (form.kind === 'once' && !form.date) return setErr('Escolha a data da tarefa.')
    if (form.kind === 'weekly' && form.weekdays.length === 0) return setErr('Escolha ao menos um dia da semana.')
    setErr(null)
    run(async () => {
      await api.createTask(groupId, {
        title: form.title.trim(),
        icon: form.icon || 'calendar',
        kind: form.kind,
        date: form.kind === 'once' ? form.date : null,
        time: form.time || null,
        weekdays: form.kind === 'weekly' ? form.weekdays : [],
      })
      setForm(FORM_VAZIO)
      setShow(false)
    })
  }

  const list = tasks || []
  const hoje = list.filter((t) => t.due)
  const recorrentes = list.filter((t) => t.kind === 'weekly' && !t.due)
  const agendadas = list.filter((t) => t.kind === 'once' && !t.due)
  const feitasHoje = hoje.filter((t) => t.checked_today).length

  function Linha({ t, podeConcluir, ultima }) {
    return (
      <ListRow
        divider={!ultima}
        chevron={false}
        leading={
          podeConcluir ? (
            <CheckControl checked={!!t.checked_today} onChange={() => toggle(t.id)} label={t.title} />
          ) : (
            <Icon name={t.icon || 'calendar'} size={16} color="var(--text-tertiary)" />
          )
        }
        title={t.title}
        muted={!!t.checked_today}
        subtitle={taskWhen(t)}
        trailing={
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            {t.image ? (
              <img
                src={t.image}
                alt="prova"
                onClick={() => setZoom(t.image)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: '1px solid var(--line-hairline)',
                }}
              />
            ) : null}
            {podeConcluir ? (
              <IconButton icon="camera" label="Anexar foto" size={32} disabled={busy} onClick={() => attachPhoto(t.id)} />
            ) : null}
            <IconButton icon="x" tone="bare" label="Remover tarefa" size={32} disabled={busy} onClick={() => remove(t.id)} />
          </div>
        }
      />
    )
  }

  return (
    <div
      className="screen"
      style={{
        paddingTop: 'var(--space-7)',
        paddingLeft: 'var(--gutter-screen)',
        paddingRight: 'var(--gutter-screen)',
        paddingBottom: 'calc(var(--space-11) + var(--control-h-lg))',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', marginBottom: 'var(--space-7)' }}>
        <VoltarPara para="/plano" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-title-2)',
              fontWeight: 'var(--fw-bold)',
              color: 'var(--text-primary)',
            }}
          >
            Tarefas
          </h1>
          <p
            style={{
              margin: '2px 0 0',
              fontFamily: 'var(--font-ui)',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            {hoje.length ? `${feitasHoje} de ${hoje.length} para hoje` : 'Compromissos e lembretes'}
          </p>
        </div>
        <Button size="sm" variant="accent" iconLeft="plus" onClick={() => setShow(true)}>
          Nova
        </Button>
      </header>

      {err ? (
        <p style={{ margin: '0 0 var(--space-5)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--danger)' }}>
          {err}
        </p>
      ) : null}

      {tasks === null ? (
        <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-tertiary)' }}>
          Carregando…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-7)' }}>
          {/* Com a lista inteira vazia só o cartão de boas-vindas aparece: dizer
              "nada para hoje" logo acima dele era a mesma frase duas vezes. */}
          {list.length > 0 && (
            <Secao titulo="Hoje" contagem={hoje.length ? `${feitasHoje}/${hoje.length}` : null}>
              {hoje.length === 0 ? (
                <Vazio>Nada marcado para hoje.</Vazio>
              ) : (
                hoje.map((t, i) => <Linha key={t.id} t={t} podeConcluir ultima={i === hoje.length - 1} />)
              )}
            </Secao>
          )}

          {recorrentes.length > 0 && (
            <Secao titulo="Toda semana">
              {recorrentes.map((t, i) => (
                <Linha key={t.id} t={t} podeConcluir={false} ultima={i === recorrentes.length - 1} />
              ))}
            </Secao>
          )}

          {agendadas.length > 0 && (
            <Secao titulo="Próximas">
              {agendadas.map((t, i) => (
                <Linha key={t.id} t={t} podeConcluir={false} ultima={i === agendadas.length - 1} />
              ))}
            </Secao>
          )}

          {list.length === 0 && (
            <Card pad="var(--pad-card-lg)">
              <p style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--text-secondary)' }}>
                Nada aqui ainda. Tarefas são os compromissos de data marcada — consulta, conta a pagar, prova. O que se
                repete todo dia vira hábito ou rotina.
              </p>
              <div style={{ marginTop: 'var(--space-6)' }}>
                <Button variant="accent" iconLeft="plus" onClick={() => setShow(true)}>
                  Criar a primeira
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {show && (
        <Sheet
          title="Nova tarefa"
          onClose={() => setShow(false)}
          footer={
            <>
              <Button variant="ghost" fullWidth onClick={() => setShow(false)} disabled={busy}>
                Cancelar
              </Button>
              <Button variant="accent" fullWidth disabled={busy || !form.title.trim()} onClick={create}>
                {busy ? 'Salvando…' : 'Salvar'}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-end' }}>
            <div
              style={{
                flex: 'none',
                background: 'var(--surface-input)',
                border: 'var(--border-input)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <IconPicker icon={form.icon} onPick={({ icon }) => setForm({ ...form, icon })} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <Input
                label="O quê"
                placeholder="Consulta, pagar conta…"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                autoFocus
              />
            </div>
          </div>

          <Select
            label="Quando"
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value })}
            options={[
              { value: 'once', label: 'Em uma data' },
              { value: 'weekly', label: 'Toda semana' },
            ]}
          />

          {form.kind === 'once' ? (
            <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          ) : (
            <div>
              <span
                style={{
                  display: 'block',
                  marginBottom: 'var(--space-3)',
                  fontFamily: 'var(--font-ui)',
                  fontSize: 'var(--fs-label)',
                  fontWeight: 'var(--fw-medium)',
                  color: 'var(--text-primary)',
                }}
              >
                Dias
              </span>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {WEEKDAYS.map((w, i) => (
                  <Chip
                    key={w}
                    selected={form.weekdays.includes(i)}
                    onClick={() => toggleWeekday(i)}
                    style={{ flex: 1, minWidth: 0, padding: 0 }}
                  >
                    {w}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          <Input
            label="Horário (opcional)"
            type="time"
            value={form.time}
            onChange={(e) => setForm({ ...form, time: e.target.value })}
          />
        </Sheet>
      )}

      {zoom && (
        <div
          onClick={() => setZoom(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 300,
            background: 'rgba(0,0,0,.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--gutter-screen)',
          }}
        >
          <img
            src={zoom}
            alt="prova"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }}
          />
        </div>
      )}
    </div>
  )
}

function Secao({ titulo, contagem, children }) {
  return (
    <section>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-4)',
        }}
      >
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-title-3)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--text-primary)',
          }}
        >
          {titulo}
        </h2>
        {contagem ? (
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontVariantNumeric: 'tabular-nums',
              fontSize: 'var(--fs-body-sm)',
              color: 'var(--text-tertiary)',
            }}
          >
            {contagem}
          </span>
        ) : null}
      </div>
      <Card pad="0 var(--pad-card)">{children}</Card>
    </section>
  )
}

function Vazio({ children }) {
  return (
    <p
      style={{
        margin: 0,
        padding: 'var(--pad-card) 0',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-body-sm)',
        color: 'var(--text-tertiary)',
      }}
    >
      {children}
    </p>
  )
}
