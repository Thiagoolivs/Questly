// Cliente HTTP do Questly. Em produção o backend serve o próprio frontend, então
// a API fica na mesma origem (BASE vazio → caminhos relativos /api/...). Em dev,
// o padrão aponta para o backend local. VITE_API_URL sobrescreve quando definido.
const BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:8000' : '')

const TOKEN_KEY = 'questly.token'
let TOKEN = localStorage.getItem(TOKEN_KEY) || null
let onAuthFail = null

export function setToken(t) {
  TOKEN = t || null
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}
export const getToken = () => TOKEN
export function setOnAuthFail(fn) {
  onAuthFail = fn
}

async function req(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && TOKEN) headers.Authorization = `Bearer ${TOKEN}`
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    if (res.status === 401 && auth && onAuthFail) onAuthFail()
    const err = new Error(prettyError(res.status, detail))
    err.status = res.status
    throw err
  }
  return res.json()
}

// Extrai a mensagem "detail" do FastAPI, quando houver.
function prettyError(status, raw) {
  try {
    const j = JSON.parse(raw)
    if (typeof j.detail === 'string') return j.detail
  } catch {
    /* ignore */
  }
  return `HTTP ${status}${raw ? ' — ' + raw : ''}`
}

const qs = (day) => (day ? `?day=${encodeURIComponent(day)}` : '')

export const api = {
  BASE,
  // --- auth ---
  register: (b) => req('/api/auth/register', { method: 'POST', body: b, auth: false }),
  login: (b) => req('/api/auth/login', { method: 'POST', body: b, auth: false }),
  me: () => req('/api/auth/me'),
  updateMe: (b) => req('/api/users/me', { method: 'PUT', body: b }),
  // --- grupos ---
  groups: () => req('/api/groups'),
  createGroup: (b) => req('/api/groups', { method: 'POST', body: b }),
  joinGroup: (b) => req('/api/groups/join', { method: 'POST', body: b }),
  // --- por grupo ---
  state: (g) => req(`/api/groups/${g}/state`),
  settings: (g) => req(`/api/groups/${g}/settings`),
  updateSettings: (g, b) => req(`/api/groups/${g}/settings`, { method: 'PUT', body: b }),
  member: (g, mid) => req(`/api/groups/${g}/members/${mid}`),
  day: (g, mid, day) => req(`/api/groups/${g}/day/${mid}${qs(day)}`),
  toggle: (g, b) => req(`/api/groups/${g}/day/toggle`, { method: 'POST', body: b }),
  setMood: (g, b) => req(`/api/groups/${g}/day/mood`, { method: 'POST', body: b }),
  setChallenge: (g, b) => req(`/api/groups/${g}/day/challenge`, { method: 'POST', body: b }),
  reroll: (g, b) => req(`/api/groups/${g}/day/reroll`, { method: 'POST', body: b }),
  jointList: (g, day) => req(`/api/groups/${g}/joint${qs(day)}`),
  jointAdd: (g, b) => req(`/api/groups/${g}/joint`, { method: 'POST', body: b }),
  jointRemove: (g, aid) => req(`/api/groups/${g}/joint/${aid}`, { method: 'DELETE' }),
  // --- push ---
  pushKey: () => req('/api/push/key', { auth: false }),
  pushSubscribe: (b) => req('/api/push/subscribe', { method: 'POST', body: b }),
  pushUnsubscribe: (b) => req('/api/push/unsubscribe', { method: 'POST', body: b }),
  history: (g, mid) => req(`/api/groups/${g}/history/${mid}`),
  achievements: (g, mid) => req(`/api/groups/${g}/achievements/${mid}`),
  ranking: (g) => req(`/api/groups/${g}/ranking`),
  challengesToday: (g, day) => req(`/api/groups/${g}/challenges/today${qs(day)}`),
  messages: (g, afterId = 0) => req(`/api/groups/${g}/messages${afterId ? `?after_id=${afterId}` : ''}`),
  sendMessage: (g, b) => req(`/api/groups/${g}/messages`, { method: 'POST', body: b }),
  activities: (g) => req(`/api/groups/${g}/activities`),
}
