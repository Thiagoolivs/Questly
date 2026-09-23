import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../design-system/components/core/Icon.jsx'

/**
 * Avisos do rodapé — e o lugar onde mora o "Desfazer" do app.
 *
 * Toda ação que muda alguma coisa passa por aqui: a pessoa vê o que aconteceu
 * (inclusive os pontos ganhos, que antes não apareciam em lugar nenhum) e tem
 * a volta a um toque, sem precisar caçar a tela onde aquilo foi feito.
 *
 * O desfazer executa a ação inversa de verdade — não é um "cancelar" que segura
 * a chamada por alguns segundos e falha se a pessoa sair da tela.
 */
const ToastCtx = createContext(() => {})

const DURACAO_PADRAO = 4000
const DURACAO_COM_DESFAZER = 7000  // desfazer precisa de tempo para ser lido e tocado

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const timers = useRef(new Map())
  const seq = useRef(0)

  const fechar = useCallback((id) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
    setAvisos((atual) => atual.filter((a) => a.id !== id))
  }, [])

  const mostrar = useCallback((aviso) => {
    // String solta é o caso mais comum ("Apagado"); objeto é para o resto.
    const dados = typeof aviso === 'string' ? { text: aviso } : aviso
    const id = ++seq.current
    const duracao = dados.duration ?? (dados.onUndo ? DURACAO_COM_DESFAZER : DURACAO_PADRAO)
    setAvisos((atual) => [...atual.slice(-2), { ...dados, id }])
    timers.current.set(id, setTimeout(() => fechar(id), duracao))
    return id
  }, [fechar])

  useEffect(() => {
    const t = timers.current
    return () => {
      t.forEach(clearTimeout)
      t.clear()
    }
  }, [])

  const valor = useMemo(() => mostrar, [mostrar])

  return (
    <ToastCtx.Provider value={valor}>
      {children}
      <div
        aria-live="polite"
        style={{
          position: 'fixed',
          // Acima da TabBar (56px de altura, a 16px do fim) para não tapar a
          // navegação nem ficar debaixo dela.
          bottom: 'calc(88px + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: '0 var(--gutter-screen)',
          pointerEvents: 'none',
          zIndex: 300,
        }}
      >
        {avisos.map((a) => (
          <Aviso key={a.id} aviso={a} onFechar={() => fechar(a.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

function Aviso({ aviso, onFechar }) {
  const [desfazendo, setDesfazendo] = useState(false)

  const desfazer = async () => {
    if (desfazendo) return
    setDesfazendo(true)
    try {
      await aviso.onUndo()
      onFechar()
    } catch {
      setDesfazendo(false)
    }
  }

  const cor =
    aviso.tone === 'danger' ? 'var(--danger)'
      : aviso.tone === 'success' ? 'var(--success)'
        : 'var(--text-tertiary)'

  return (
    <div
      role="status"
      style={{
        pointerEvents: 'auto',
        width: '100%',
        maxWidth: 480,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-5) var(--space-6)',
        borderRadius: 'var(--radius-pill)',
        background: 'var(--surface-raised)',
        border: '1px solid var(--line-hairline)',
        boxShadow: 'var(--shadow-sheet)',
        animation: 'questly-toast-in var(--dur-base) var(--ease-out)',
      }}
    >
      {aviso.icon ? <Icon name={aviso.icon} size={16} color={cor} /> : null}
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-ui)',
          fontSize: 'var(--fs-body-sm)',
          color: 'var(--text-primary)',
        }}
      >
        {aviso.text}
      </span>
      {aviso.onUndo ? (
        <button
          type="button"
          onClick={desfazer}
          disabled={desfazendo}
          style={{
            flex: 'none',
            background: 'transparent',
            border: 'none',
            padding: '4px 6px',
            cursor: desfazendo ? 'default' : 'pointer',
            fontFamily: 'var(--font-ui)',
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 'var(--fw-semibold)',
            color: 'var(--blue-glow)',
            opacity: desfazendo ? 0.5 : 1,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {desfazendo ? 'Desfazendo…' : 'Desfazer'}
        </button>
      ) : (
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar aviso"
          style={{
            flex: 'none', background: 'transparent', border: 'none', padding: 2,
            cursor: 'pointer', display: 'inline-flex', WebkitTapHighlightColor: 'transparent',
          }}
        >
          <Icon name="x" size={14} color="var(--text-tertiary)" />
        </button>
      )}
    </div>
  )
}

/** `const aviso = useToast()` → `aviso('Apagado')` ou `aviso({ text, onUndo })`. */
export const useToast = () => useContext(ToastCtx)
