import { useState, useEffect, useRef } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import Icon from '../components/Icon.jsx'
import { pendingInvite, clearInvite, shareInvite } from '../utils/invite.js'

// Tela de escolha/criação de grupo (mostrada quando o usuário ainda não tem
// grupo selecionado). Um "casal" é só um grupo de 2 pessoas.
export default function Grupos() {
  const { user, groups, refreshGroups, selectGroup, logout } = useApp()
  const invite = pendingInvite()
  const [tab, setTab] = useState(invite ? 'join' : 'create') // create | join
  const [name, setName] = useState('')
  const [code, setCode] = useState(invite || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [shared, setShared] = useState(null)
  const autoTried = useRef(false)

  async function run(fn) {
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      const g = await fn()
      await refreshGroups()
      clearInvite()
      selectGroup(g.id)
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const create = () => run(() => api.createGroup({ name: name.trim() }))
  const join = (c) => run(() => api.joinGroup({ invite_code: (c || code).trim() }))

  // Veio por link de convite: entra automaticamente no grupo.
  useEffect(() => {
    if (invite && !autoTried.current) {
      autoTried.current = true
      join(invite)
    }
  }, [invite]) // eslint-disable-line react-hooks/exhaustive-deps

  async function share(g) {
    const r = await shareInvite(g.invite_code, g.name)
    if (r === 'copied' || r === 'shared') {
      setShared(g.id)
      setTimeout(() => setShared(null), 1800)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Seus grupos</div>
        <p className="muted small auth-sub">
          Olá, {user?.name || 'você'}! Crie um grupo e convide sua família, ou entre com um convite.
        </p>

        {invite && (
          <div className="auth-notice">
            Você foi convidado com o código <b>{invite}</b>{busy ? ' — entrando…' : ''}
          </div>
        )}

        {groups.length > 0 && (
          <div className="group-list">
            {groups.map((g) => (
              <div className="group-row-wrap" key={g.id}>
                <button className="group-row" onClick={() => selectGroup(g.id)}>
                  <span className="group-emoji"><Icon name="users" size={18} /></span>
                  <span className="group-main">
                    <span className="group-name">{g.name}</span>
                    <span className="muted xsmall">{g.member_count} membro(s) · {g.role === 'owner' ? 'dono' : 'membro'}</span>
                  </span>
                  <span className="group-go"><Icon name="chevronRight" size={16} /></span>
                </button>
                <button className="btn ghost small-btn icon-btn group-share" onClick={() => share(g)} title="Convidar por link">
                  <Icon name={shared === g.id ? 'check' : 'users'} size={14} /> {shared === g.id ? 'Link copiado' : 'Convidar'}
                </button>
              </div>
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Família 💜" />
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
            <button className="btn full btn-primary" disabled={busy || !code.trim()} onClick={() => join()}>
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
