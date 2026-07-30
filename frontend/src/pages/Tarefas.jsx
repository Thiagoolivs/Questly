import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import Icon from '../components/Icon.jsx'
import IconPicker from '../components/IconPicker.jsx'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function onceLabel(iso) {
  return new Date(iso + 'T00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Tarefas() {
  const { groupId } = useApp()
  const [tasks, setTasks] = useState(null)
  const [today, setToday] = useState(() => new Date().toISOString().slice(0, 10))
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [zoom, setZoom] = useState(null)
  const [show, setShow] = useState(false)
  const [form, setForm] = useState({ emoji: '🗓️', icon: null, title: '', kind: 'once', date: '', weekdays: [] })

  const load = useCallback(() => {
    if (!groupId) return
    api.tasks(groupId, '?all=true').then((d) => {
      setTasks(d.tasks)
      // Data "de hoje" no fuso do grupo (o backend só aceita conclusões nesse dia).
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
        emoji: form.emoji || '🗓️',
        icon: form.icon,
        kind: form.kind,
        date: form.kind === 'once' ? form.date : null,
        weekdays: form.kind === 'weekly' ? form.weekdays : [],
      })
      setForm({ emoji: '🗓️', icon: null, title: '', kind: 'once', date: '', weekdays: [] })
      setShow(false)
    })
  }

  const list = tasks || []
  const hoje = list.filter((t) => t.due)
  const agendadas = list.filter((t) => !t.due && t.kind === 'once')
  const recorrentes = list.filter((t) => t.kind === 'weekly')

  const TaskRow = ({ t, canComplete }) => (
    <div className={'habit-row ' + (t.checked_today ? 'done' : '')}>
      <div className="habit habit-toggle" onClick={canComplete ? () => toggle(t.id) : undefined} style={{ cursor: canComplete ? 'pointer' : 'default' }}>
        <span className="habit-emoji">{t.icon ? <Icon name={t.icon} size={17} /> : t.emoji}</span>
        <span className="habit-main-col">
          <span className="habit-label">{t.title}</span>
          <span className="muted xsmall">
            {t.kind === 'once' ? onceLabel(t.date) : t.weekdays.map((i) => WEEKDAYS[i]).join(', ')}
          </span>
        </span>
        {canComplete && <span className={'check ' + (t.checked_today ? 'on' : '')}>{t.checked_today ? <Icon name="check" size={14} /> : ''}</span>}
      </div>
      {canComplete && t.image && <img className="habit-thumb" src={t.image} alt="" onClick={() => setZoom(t.image)} />}
      {canComplete && (
        <button className="habit-cam" disabled={busy} title="Foto-prova" onClick={() => attachPhoto(t.id)}><Icon name="camera" size={16} /></button>
      )}
      <button className="habit-cam" disabled={busy} title="Remover" onClick={() => remove(t.id)}><Icon name="x" size={15} /></button>
    </div>
  )

  return (
    <div className="screen">
      <header className="topbar">
        <div className="brand">Tarefas</div>
      </header>

      {err && <div className="error">{err}</div>}
      {tasks === null && !err && <div className="muted small">Carregando…</div>}

      {/* Criar */}
      {show ? (
        <section className="card">
          <div className="card-title">Nova tarefa</div>
          <div className="add-habit">
            <IconPicker emoji={form.emoji} icon={form.icon} onPick={({ emoji, icon }) => setForm({ ...form, emoji: emoji || '🗓️', icon })} />
            <input className="add-habit-label" placeholder="Ex: Consulta médica / Treino especial" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="chips">
            <button className={'chip ' + (form.kind === 'once' ? 'active' : '')} onClick={() => setForm({ ...form, kind: 'once' })}>Data única</button>
            <button className={'chip ' + (form.kind === 'weekly' ? 'active' : '')} onClick={() => setForm({ ...form, kind: 'weekly' })}>Semanal</button>
          </div>
          {form.kind === 'once' ? (
            <label className="field"><span>Data</span><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
          ) : (
            <div className="chips">
              {WEEKDAYS.map((w, i) => (
                <button key={w} className={'chip ' + (form.weekdays.includes(i) ? 'active' : '')} onClick={() => toggleWeekday(i)}>{w}</button>
              ))}
            </div>
          )}
          <div className="row" style={{ gap: 8 }}>
            <button className="btn ghost full" onClick={() => setShow(false)}>Cancelar</button>
            <button className="btn full btn-primary" disabled={busy || !form.title.trim()} onClick={create}>Agendar</button>
          </div>
        </section>
      ) : (
        <button className="btn ghost full icon-btn new-goal-btn" onClick={() => setShow(true)}><Icon name="plus" size={15} /> Nova tarefa</button>
      )}

      {tasks && (
        <>
          <section className="card">
            <div className="card-title">Hoje</div>
            {hoje.length === 0 ? <div className="muted small">Nada agendado para hoje.</div> : <div className="habits">{hoje.map((t) => <TaskRow key={t.id} t={t} canComplete />)}</div>}
          </section>

          {recorrentes.length > 0 && (
            <section className="card">
              <div className="card-title">Recorrentes</div>
              <div className="habits">{recorrentes.map((t) => <TaskRow key={t.id} t={t} canComplete={t.due} />)}</div>
            </section>
          )}

          {agendadas.length > 0 && (
            <section className="card">
              <div className="card-title">Agendadas</div>
              <div className="habits">{agendadas.map((t) => <TaskRow key={t.id} t={t} canComplete={false} />)}</div>
            </section>
          )}
        </>
      )}

      {zoom && <div className="lightbox" onClick={() => setZoom(null)}><img src={zoom} alt="" /></div>}
    </div>
  )
}
