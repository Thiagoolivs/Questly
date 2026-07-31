import { useState, useEffect, useRef } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'

const AVATARS = ['🦊', '🐨', '🐼', '🦁', '🐯', '🐸', '🐵', '🦉', '🔥', '⚡', '🌟', '💜']

function readResetToken() {
  const token = new URLSearchParams(window.location.search).get('token')
  const isReset = window.location.pathname.replace(/\/+$/, '') === '/reset'
  return isReset && token ? token : null
}

export default function Auth() {
  const { login, register, googleLogin, resetPassword } = useApp()
  const [resetToken] = useState(readResetToken)
  const [mode, setMode] = useState(resetToken ? 'reset' : 'login') // login | signup | forgot | reset
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState('🦊')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(null)
  const [notice, setNotice] = useState(null)
  const [cfg, setCfg] = useState(null)
  const googleDiv = useRef(null)

  useEffect(() => {
    api.authConfig().then(setCfg).catch(() => setCfg({ google_enabled: false }))
  }, [])

  // Renderiza o botão do Google (Google Identity Services) nas telas de login/cadastro.
  useEffect(() => {
    if (!cfg?.google_enabled || !cfg.google_client_id) return
    if (mode !== 'login' && mode !== 'signup') return
    let cancelled = false
    const render = () => {
      if (cancelled || !window.google?.accounts?.id || !googleDiv.current) return
      window.google.accounts.id.initialize({
        client_id: cfg.google_client_id,
        callback: async (resp) => {
          setErr(null)
          setBusy(true)
          try {
            await googleLogin(resp.credential)
          } catch (e) {
            setErr(e.message)
          } finally {
            setBusy(false)
          }
        },
      })
      googleDiv.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleDiv.current, {
        theme: 'filled_black', size: 'large', text: 'continue_with', shape: 'pill', locale: 'pt-BR',
      })
    }
    if (window.google?.accounts?.id) {
      render()
    } else {
      let s = document.getElementById('gsi-script')
      if (s) {
        s.addEventListener('load', render)
      } else {
        s = document.createElement('script')
        s.src = 'https://accounts.google.com/gsi/client'
        s.async = true
        s.defer = true
        s.id = 'gsi-script'
        s.onload = render
        document.head.appendChild(s)
      }
    }
    return () => {
      cancelled = true
    }
  }, [cfg, mode, googleLogin])

  async function submit(e) {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setErr(null)
    setNotice(null)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else if (mode === 'signup') {
        await register({ email: email.trim(), password, name: name.trim(), avatar })
      } else if (mode === 'forgot') {
        await api.forgotPassword({ email: email.trim() })
        setNotice('Se existe uma conta com esse e-mail, enviamos um link para redefinir a senha. Confira a caixa de entrada (e o spam).')
      } else if (mode === 'reset') {
        await resetPassword(resetToken, password)
        window.history.replaceState({}, '', '/')
      }
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  const isAuthTabs = mode === 'login' || mode === 'signup'
  const title = mode === 'forgot' ? 'Recuperar senha' : mode === 'reset' ? 'Criar nova senha' : null
  const submitLabel =
    mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : mode === 'forgot' ? 'Enviar link' : 'Redefinir e entrar'

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-brand">Questly</div>
        <p className="muted small auth-sub">Evolução em dupla (ou em grupo), com constância.</p>

        {isAuthTabs && (
          <div className="auth-tabs">
            <button className={'auth-tab ' + (mode === 'login' ? 'active' : '')} onClick={() => { setMode('login'); setErr(null); setNotice(null) }} type="button">Entrar</button>
            <button className={'auth-tab ' + (mode === 'signup' ? 'active' : '')} onClick={() => { setMode('signup'); setErr(null); setNotice(null) }} type="button">Criar conta</button>
          </div>
        )}
        {title && <div className="card-title auth-title">{title}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label className="field">
                <span>Nome</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como te chamam" required />
              </label>
              <div className="field">
                <span>Avatar</span>
                <div className="avatar-picker">
                  {AVATARS.map((a) => (
                    <button key={a} type="button" className={'avatar-opt ' + (a === avatar ? 'active' : '')} onClick={() => setAvatar(a)}>{a}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <label className="field">
              <span>E-mail</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" autoComplete="email" required />
            </label>
          )}

          {mode !== 'forgot' && (
            <label className="field">
              <span>{mode === 'reset' ? 'Nova senha' : 'Senha'}</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            </label>
          )}

          {mode === 'login' && (
            <button type="button" className="auth-link auth-forgot" onClick={() => { setMode('forgot'); setErr(null); setNotice(null) }}>
              Esqueci minha senha
            </button>
          )}

          {err && <div className="auth-err">{err}</div>}
          {notice && <div className="auth-notice">{notice}</div>}

          <button className="btn full btn-primary" disabled={busy} type="submit">
            {busy ? '…' : submitLabel}
          </button>
        </form>

        {isAuthTabs && cfg?.google_enabled && (
          <>
            <div className="auth-or"><span>ou</span></div>
            <div className="google-btn" ref={googleDiv} />
          </>
        )}

        {(mode === 'forgot' || mode === 'reset') && (
          <button type="button" className="auth-link auth-back" onClick={() => { setMode('login'); setErr(null); setNotice(null) }}>
            ← Voltar para o login
          </button>
        )}
      </div>
    </div>
  )
}
