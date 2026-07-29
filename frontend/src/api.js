// Cliente HTTP do Questly. A URL da API vem de VITE_API_URL (padrão: localhost:8000).
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(`HTTP ${res.status} — ${detail}`)
  }
  return res.json()
}

const qs = (day) => (day ? `?day=${encodeURIComponent(day)}` : '')

export const api = {
  BASE,
  state: () => req('/api/state'),
  settings: () => req('/api/settings'),
  updateSettings: (body) => req('/api/settings', { method: 'PUT', body: JSON.stringify(body) }),
  players: () => req('/api/players'),
  player: (id) => req(`/api/players/${id}`),
  updatePlayer: (id, body) => req(`/api/players/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  day: (id, day) => req(`/api/day/${id}${qs(day)}`),
  toggle: (id, body) => req(`/api/day/${id}/toggle`, { method: 'POST', body: JSON.stringify(body) }),
  setMood: (id, body) => req(`/api/day/${id}/mood`, { method: 'POST', body: JSON.stringify(body) }),
  setProof: (id, body) => req(`/api/day/${id}/proof`, { method: 'POST', body: JSON.stringify(body) }),
  history: (id) => req(`/api/history/${id}`),
  achievements: (id) => req(`/api/achievements/${id}`),
  ranking: () => req('/api/ranking'),
  challengesToday: (day) => req(`/api/challenges/today${qs(day)}`),
  messages: (afterId = 0) => req(`/api/messages${afterId ? `?after_id=${afterId}` : ''}`),
  sendMessage: (body) => req('/api/messages', { method: 'POST', body: JSON.stringify(body) }),
}
