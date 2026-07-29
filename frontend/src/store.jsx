import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from './api.js'

const AppCtx = createContext(null)

// Estado global leve: payload agregado (/api/state) + jogador selecionado.
export function AppProvider({ children }) {
  const [state, setState] = useState(null)
  const [playerId, setPlayerId] = useState(
    () => Number(localStorage.getItem('questly.player')) || null,
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    try {
      const s = await api.state()
      setState(s)
      setError(null)
      setPlayerId((prev) =>
        prev && s.players.some((p) => p.id === prev) ? prev : s.players[0]?.id ?? null,
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    if (playerId) localStorage.setItem('questly.player', String(playerId))
  }, [playerId])

  const me = state?.players.find((p) => p.id === playerId) ?? null

  return (
    <AppCtx.Provider value={{ state, me, playerId, setPlayerId, refresh, loading, error }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)
