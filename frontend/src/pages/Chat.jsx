import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../store.jsx'
import { api } from '../api.js'
import { pickImage, fileToCompressedDataURL } from '../utils/image.js'
import Avatar from '../components/Avatar.jsx'
import Icon from '../components/Icon.jsx'

function timeLabel(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Chat() {
  const { groupId, myId, loading } = useApp()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null)
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState(null)
  const endRef = useRef(null)
  const lastIdRef = useRef(0)

  const merge = useCallback((incoming) => {
    if (!incoming.length) return
    setMessages((cur) => {
      const seen = new Set(cur.map((m) => m.id))
      const next = [...cur, ...incoming.filter((m) => !seen.has(m.id))]
      lastIdRef.current = next.length ? next[next.length - 1].id : 0
      return next
    })
  }, [])

  useEffect(() => {
    if (!groupId) return
    api.messages(groupId)
      .then((d) => merge(d.messages))
      .catch((e) => setErr(e.message))
  }, [merge, groupId])

  // polling leve para chegar perto de tempo real
  useEffect(() => {
    if (!groupId) return
    const t = setInterval(() => {
      api.messages(groupId, lastIdRef.current).then((d) => merge(d.messages)).catch(() => {})
    }, 5000)
    return () => clearInterval(t)
  }, [merge, groupId])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, pending])

  async function attach() {
    const f = await pickImage()
    if (!f) return
    try {
      setPending(await fileToCompressedDataURL(f))
    } catch {
      setErr('Não consegui processar a imagem.')
    }
  }

  async function send() {
    if (sending || (!text.trim() && !pending)) return
    setSending(true)
    try {
      const msg = await api.sendMessage(groupId, { text, image: pending })
      merge([msg])
      setText('')
      setPending(null)
    } catch (e) {
      setErr(e.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="screen center muted">Carregando…</div>

  return (
    <div className="chat-screen">
      <header className="topbar chat-topbar">
        <div className="brand">Chat</div>
      </header>

      <div className="chat-log">
        {messages.length === 0 && (
          <p className="muted small center" style={{ marginTop: 24 }}>
            Sem mensagens ainda. Manda a primeira.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.player_id === myId
          return (
            <div key={m.id} className={'chat-msg ' + (mine ? 'me' : 'them')}>
              {!mine && <div className="chat-av"><Avatar photo={m.photo} avatar={m.avatar} name={m.name} size={30} /></div>}
              <div className="chat-bubble">
                {!mine && <div className="chat-author">{m.name}</div>}
                {m.image && <img className="chat-img" src={m.image} alt="anexo" />}
                {m.text && <div className="chat-text">{m.text}</div>}
                <div className="chat-time">{timeLabel(m.created_at)}</div>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {err && <div className="chat-err">{err}</div>}

      <div className="chat-input">
        {pending && (
          <div className="chat-preview">
            <img src={pending} alt="prévia" />
            <button className="chat-preview-x" onClick={() => setPending(null)}>✕</button>
          </div>
        )}
        <div className="chat-row">
          <button className="chat-attach" onClick={attach} title="Anexar foto"><Icon name="camera" size={19} /></button>
          <input
            className="chat-field"
            placeholder="Mensagem…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="chat-send" onClick={send} disabled={sending}><Icon name="arrowRight" size={18} /></button>
        </div>
      </div>
    </div>
  )
}
