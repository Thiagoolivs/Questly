import { useState } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'

// Tela de escolha/criação de grupo (mostrada quando o usuário ainda não tem
// grupo selecionado). Um "casal" é só um grupo de 2 pessoas.
export default function Grupos() {
  const { user, groups, refreshGroups, selectGroup, logout } = useApp()
  const [tab, setTab] = useState('create') // create | join
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function run(fn) {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const g = await fn()
      await refreshGroups()
      selectGroup(g.id)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const create = () => run(() => api.createGroup({ name: name.trim() }))
  const join = () => run(() => api.joinGroup({ invite_code: code.trim() }))

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand"><span className="brand-mark">👥</span> Seus grupos</div>
        <p className="muted small auth-sub">
          Olá, {user?.name || 'você'}! Crie um grupo e convide seu par, ou entre com um código.
        </p>

        {groups.length > 0 && (
          <div className="group-list">
            {groups.map((g) => (
              <button key={g.id} className="group-row" onClick={() => selectGroup(g.id)}>
                <span className="group-emoji">👥</span>
                <span className="group-main">
                  <span className="group-name">{g.name}</span>
                  <span className="muted xsmall">{g.member_count} membro(s) · {g.role === 'owner' ? 'dono' : 'membro'}</span>
                </span>
                <span className="group-go">→</span>
              </button>
            ))}
          </div>
        )}

        <div className="auth-tabs">
          <button className={'auth-tab ' + (tab === 'create' ? 'active' : '')} onClick={() => setTab('create')} type="button">
            Criar grupo
          </button>
          <button className={'auth-tab ' + (tab === 'join' ? 'active' : '')} onClick={() => setTab('join')} type="button">
            Entrar com código
          </button>
        </div>

        {tab === 'create' ? (
          <>
            <label className="field">
              <span>Nome do grupo</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Nós dois 💞" />
            </label>
            <button className="btn full btn-primary" disabled={busy || !name.trim()} onClick={create}>
              {busy ? '…' : 'Criar grupo'}
            </button>
          </>
        ) : (
          <>
            <label className="field">
              <span>Código de convite</span>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: 25NGVV"
                maxLength={12}
                style={{ textTransform: 'uppercase', letterSpacing: '2px' }}
              />
            </label>
            <button className="btn full btn-primary" disabled={busy || !code.trim()} onClick={join}>
              {busy ? '…' : 'Entrar no grupo'}
            </button>
          </>
        )}

        {err && <div className="auth-err">{err}</div>}

        <button className="link-btn logout-link" onClick={logout}>Sair da conta</button>
      </div>
    </div>
  )
}
