import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import { Card, Icon, Button, ListRow, Input } from '../design-system/components/index.js'
import IconPicker from '../components/IconPicker.jsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function onceLabel(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function taskWhen(t) {
  const base = t.kind === 'once' ? onceLabel(t.date) : t.weekdays.map((i) => WEEKDAYS[i]).join(', ')
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
  const [form, setForm] = useState({ icon: 'calendar', title: '', kind: 'once', date: '', time: '', weekdays: [] })

  const load = useCallback(() => {
    if (!groupId) return
    api.tasks(groupId, '?all=true').then((d) => {
      setTasks(d.tasks)
      if (d.date) setToday(d.date)
    }).catch((e) => setErr(e.message))
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
      alert('Erro: ' + e.message)
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
    setForm((f) => ({ ...f, weekdays: f.weekdays.includes(i) ? f.weekdays.filter((d) => d !== i) : [...f.weekdays, i] }))
    
  function create() {
    if (!form.title.trim()) return
    if (form.kind === 'once' && !form.date) return alert('Escolha a data.')
    if (form.kind === 'weekly' && form.weekdays.length === 0) return alert('Escolha os dias da semana.')
    run(async () => {
      await api.createTask(groupId, {
        title: form.title.trim(),
        icon: form.icon || 'calendar',
        kind: form.kind,
        date: form.kind === 'once' ? form.date : null,
        time: form.time || null,
        weekdays: form.kind === 'weekly' ? form.weekdays : [],
      })
      setForm({ icon: 'calendar', title: '', kind: 'once', date: '', time: '', weekdays: [] })
      setShow(false)
    })
  }

  const list = tasks || []
  const hoje = list.filter((t) => t.due)
  const agendadas = list.filter((t) => !t.due && t.kind === 'once')
  const recorrentes = list.filter((t) => t.kind === 'weekly')

  const TaskRow = ({ t, canComplete, borderBottom }) => (
    <ListRow
      title={<span style={{ textDecoration: t.checked_today ? 'line-through' : 'none', color: t.checked_today ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>{t.title}</span>}
      subtitle={taskWhen(t)}
      borderBottom={borderBottom}
      left={
        <button 
          onClick={canComplete ? () => toggle(t.id) : undefined}
          style={{ 
            width: 32, height: 32, borderRadius: 'var(--radius-md)', 
            background: t.checked_today ? 'var(--blue-glow)' : 'var(--surface-sunken)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: t.checked_today ? '#fff' : 'var(--text-secondary)',
            border: 'none', cursor: canComplete ? 'pointer' : 'default'
          }}
        >
          {t.checked_today ? <Icon name="check" size={16} /> : <Icon name={t.icon || 'calendar'} size={16} />}
        </button>
      }
      right={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {canComplete && t.image && (
            <img src={t.image} alt="prova" onClick={() => setZoom(t.image)} style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', objectFit: 'cover', cursor: 'pointer', border: '1px solid var(--line-hairline)' }} />
          )}
          {canComplete && (
            <button disabled={busy} onClick={() => attachPhoto(t.id)} style={{ background: 'var(--surface-sunken)', border: 'none', width: 32, height: 32, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Icon name="camera" size={14} />
            </button>
          )}
          <button disabled={busy} onClick={() => remove(t.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', padding: 'var(--space-1)', cursor: 'pointer' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
      }
    />
  )

  return (
    <div className="screen" style={{ paddingTop: 'var(--space-6)', paddingLeft: 'var(--gutter-screen)', paddingRight: 'var(--gutter-screen)', paddingBottom: 'calc(var(--tab-bar-height) + var(--space-8))' }}>
      <header style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)' }}>
          Tarefas
        </h1>
        <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', marginTop: 'var(--space-2)' }}>
          Gerencie seus lembretes e hábitos.
        </p>
      </header>

      {err && <div className="error" style={{ color: 'var(--error)', marginBottom: 'var(--space-4)' }}>{err}</div>}
      {tasks === null && !err && <div className="muted small" style={{ color: 'var(--text-tertiary)' }}>Carregando…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        {tasks && (
          <>
            <Card padding="none">
              <div style={{ padding: 'var(--pad-card-md)', borderBottom: '1px solid var(--line-hairline)' }}>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)' }}>Hoje</div>
              </div>
              {hoje.length === 0 ? (
                <div style={{ padding: 'var(--pad-card-md)', fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
                  Nada agendado para hoje.
                </div>
              ) : (
                <div>
                  {hoje.map((t, i) => <TaskRow key={t.id} t={t} canComplete borderBottom={i < hoje.length - 1} />)}
                </div>
              )}
            </Card>

            {recorrentes.length > 0 && (
              <Card padding="none">
                <div style={{ padding: 'var(--pad-card-md)', borderBottom: '1px solid var(--line-hairline)' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)' }}>Recorrentes</div>
                </div>
                <div>
                  {recorrentes.map((t, i) => <TaskRow key={t.id} t={t} canComplete={t.due} borderBottom={i < recorrentes.length - 1} />)}
                </div>
              </Card>
            )}

            {agendadas.length > 0 && (
              <Card padding="none">
                <div style={{ padding: 'var(--pad-card-md)', borderBottom: '1px solid var(--line-hairline)' }}>
                  <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', color: 'var(--text-primary)' }}>Agendadas</div>
                </div>
                <div>
                  {agendadas.map((t, i) => <TaskRow key={t.id} t={t} canComplete={false} borderBottom={i < agendadas.length - 1} />)}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Flutuante para criar */}
      {!show ? (
        <div style={{ position: 'fixed', bottom: 'calc(var(--tab-bar-height) + var(--space-4))', right: 'var(--space-4)', zIndex: 100 }}>
          <button 
            onClick={() => setShow(true)}
            style={{ 
              width: 56, height: 56, borderRadius: 28, background: 'var(--blue-glow)', color: '#fff', 
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,122,255,0.4)', cursor: 'pointer'
            }}
          >
            <Icon name="plus" size={24} />
          </button>
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'var(--surface-overlay)', display: 'flex', flexDirection: 'column', paddingTop: 'env(safe-area-inset-top)' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'var(--space-4)', borderBottom: '1px solid var(--line-hairline)' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-2)', color: 'var(--text-primary)' }}>Nova Tarefa</h2>
            <button onClick={() => setShow(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><Icon name="x" size={24} /></button>
          </header>
          
          <div style={{ padding: 'var(--space-6) var(--gutter-screen)', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{ background: 'var(--surface-sunken)', border: '1px solid var(--line-hairline)', borderRadius: 'var(--radius-md)' }}>
                <IconPicker icon={form.icon} onPick={({ icon }) => setForm({ ...form, icon })} />
              </div>
              <div style={{ flex: 1 }}>
                <Input placeholder="Título (ex: Consulta Médica)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Tipo</div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button 
                  style={{ 
                    flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid',
                    borderColor: form.kind === 'once' ? 'var(--blue-glow)' : 'var(--line-hairline)',
                    background: form.kind === 'once' ? 'rgba(0,122,255,0.1)' : 'var(--surface-sunken)',
                    color: form.kind === 'once' ? 'var(--blue-glow)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)'
                  }}
                  onClick={() => setForm({ ...form, kind: 'once' })}
                >
                  Data única
                </button>
                <button 
                  style={{ 
                    flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px solid',
                    borderColor: form.kind === 'weekly' ? 'var(--blue-glow)' : 'var(--line-hairline)',
                    background: form.kind === 'weekly' ? 'rgba(0,122,255,0.1)' : 'var(--surface-sunken)',
                    color: form.kind === 'weekly' ? 'var(--blue-glow)' : 'var(--text-secondary)',
                    fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', fontWeight: 'var(--fw-medium)'
                  }}
                  onClick={() => setForm({ ...form, kind: 'weekly' })}
                >
                  Semanal
                </button>
              </div>
            </div>

            {form.kind === 'once' ? (
              <Input label="Data" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            ) : (
              <div>
                <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>Dias da semana</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  {WEEKDAYS.map((w, i) => (
                    <button 
                      key={w} 
                      style={{ 
                        padding: 'var(--space-2) var(--space-4)', borderRadius: 'var(--radius-pill)', border: '1px solid',
                        borderColor: form.weekdays.includes(i) ? 'var(--blue-glow)' : 'var(--line-hairline)',
                        background: form.weekdays.includes(i) ? 'rgba(0,122,255,0.1)' : 'var(--surface-sunken)',
                        color: form.weekdays.includes(i) ? 'var(--blue-glow)' : 'var(--text-secondary)',
                        fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-caption)', fontWeight: 'var(--fw-medium)'
                      }}
                      onClick={() => toggleWeekday(i)}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Input label="Horário (opcional)" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            
            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-8)' }}>
              <Button variant="primary" block disabled={busy || !form.title.trim()} onClick={create}>
                Salvar Tarefa
              </Button>
            </div>
          </div>
        </div>
      )}

      {zoom && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setZoom(null)}>
          <img src={zoom} alt="prova" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: 'var(--radius-lg)' }} />
          <button style={{ position: 'absolute', top: 'var(--space-4)', right: 'var(--space-4)', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={20} />
          </button>
        </div>
      )}
    </div>
  )
}
