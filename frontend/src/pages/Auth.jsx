import { useState, useEffect, useRef } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { Button, Input, SegmentedControl, Card, Icon } from '../design-system/components/index.js'


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
        await register({ email: email.trim(), password, name: name.trim(), avatar: '' })
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
    <div
      // O login fica fora do Shell, então carrega o próprio inset da status bar.
      className="screen"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--gutter-screen)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + var(--space-9))',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--space-9))',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-1)', fontWeight: 'var(--fw-bold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Questly
          </h1>
          <p style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)', color: 'var(--text-secondary)' }}>
            Evolução em dupla (ou em grupo), com constância.
          </p>
        </div>

        <Card style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {isAuthTabs && (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <SegmentedControl
                options={[
                  { value: 'login', label: 'Entrar' },
                  { value: 'signup', label: 'Criar conta' }
                ]}
                value={mode}
                onChange={(v) => { setMode(v); setErr(null); setNotice(null) }}
              />
            </div>
          )}
          
          {title && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-title-3)', fontWeight: 'var(--fw-semibold)', color: 'var(--text-primary)', textAlign: 'center' }}>{title}</div>}

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {mode === 'signup' && (
              <>
                <Input
                  label="Nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como te chamam"
                  required
                />
              </>
            )}

            {mode !== 'reset' && (
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                autoComplete="email"
                required
              />
            )}

            {mode !== 'forgot' && (
              <Input
                label={mode === 'reset' ? 'Nova senha' : 'Senha'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'login' ? '••••••••' : 'Mínimo 6 caracteres'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
            )}

            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setErr(null); setNotice(null) }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)',
                  textAlign: 'right', marginTop: '-var(--space-2)', textDecoration: 'underline'
                }}
              >
                Esqueci minha senha
              </button>
            )}

            {err && (
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--danger)', padding: 'var(--space-3)', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)' }}>
                {err}
              </div>
            )}
            {notice && (
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body-sm)', color: 'var(--success)', padding: 'var(--space-3)', background: 'rgba(50, 215, 75, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                {notice}
              </div>
            )}

            <Button type="submit" variant="primary" disabled={busy} style={{ width: '100%', marginTop: 'var(--space-2)' }}>
              {busy ? '…' : submitLabel}
            </Button>
          </form>

          {isAuthTabs && cfg?.google_enabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 'var(--space-3)' }}>
                <div style={{ flex: 1, height: 1, background: 'var(--line-hairline)' }} />
                <span style={{ fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                  ou
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--line-hairline)' }} />
              </div>
              <div ref={googleDiv} style={{ width: '100%', display: 'flex', justifyContent: 'center' }} />
            </div>
          )}

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => { setMode('login'); setErr(null); setNotice(null) }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-label)', color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)',
                marginTop: 'var(--space-2)'
              }}
            >
              <Icon name="arrow-left" size={16} /> Voltar para o login
            </button>
          )}
        </Card>
      </div>
    </div>
  )
}
