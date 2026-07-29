import { useState } from 'react'
import { useApp } from '../store.jsx'

export default function Auth() {
  const { login, register } = useApp()
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr(null)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register({ email: email.trim(), password, name: name.trim() })
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">
          Questly
        </div>
        <p className="muted small auth-sub">Evolução em dupla (ou em grupo), com constância.</p>

        <div className="auth-tabs">
          <button
            className={'auth-tab ' + (mode === 'login' ? 'active' : '')}
            onClick={() => setMode('login')}
            type="button"
          >
            Entrar
          </button>
          <button
            className={'auth-tab ' + (mode === 'signup' ? 'active' : '')}
            onClick={() => setMode('signup')}
            type="button"
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <label className="field">
              <span>Nome</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamam" required />
            </label>
          )}
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
            />
          </label>

          {err && <div className="auth-err">{err}</div>}

          <button className="btn full btn-primary" disabled={busy} type="submit">
            {busy ? '…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  )
}
