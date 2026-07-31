import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { api, setToken, getToken, setOnAuthFail } from './api.js'

const AppCtx = createContext(null)

const GROUP_KEY = 'questly.group'

// Estado global: sessão (token/usuário), grupos, grupo atual e o payload do grupo.
export function AppProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken())
  const [user, setUser] = useState(null)
  const [groups, setGroups] = useState([])
  const [groupId, setGroupId] = useState(() => Number(localStorage.getItem(GROUP_KEY)) || null)
  const [state, setState] = useState(null)
  const [viewId, setViewId] = useState(null) // membro visualizado nas telas de leitura
  const [booting, setBooting] = useState(true) // carregando a sessão inicial
  const [loading, setLoading] = useState(true) // carregando o payload do grupo
  const [error, setError] = useState(null)
  const groupIdRef = useRef(groupId)
  groupIdRef.current = groupId

  const logout = useCallback(() => {
    setToken(null)
    localStorage.removeItem(GROUP_KEY)
    setTokenState(null)
    setUser(null)
    setGroups([])
    setGroupId(null)
    setState(null)
    setViewId(null)
  }, [])

  // Redireciona para o login quando o token expira em qualquer chamada.
  useEffect(() => {
    setOnAuthFail(() => logout())
  }, [logout])

  const selectGroup = useCallback((id) => {
    setGroupId(id)
    if (id) localStorage.setItem(GROUP_KEY, String(id))
    else localStorage.removeItem(GROUP_KEY)
  }, [])

  const loadSession = useCallback(async () => {
    if (!getToken()) {
      setBooting(false)
      return
    }
    try {
      const { user: u, groups: gs } = await api.me()
      setUser(u)
      setGroups(gs)
      setGroupId((prev) => {
        const valid = prev && gs.some((g) => g.id === prev)
        const next = valid ? prev : gs[0]?.id ?? null
        if (next) localStorage.setItem(GROUP_KEY, String(next))
        return next
      })
    } catch (e) {
      if (e.status === 401) logout()
      else setError(e.message)
    } finally {
      setBooting(false)
    }
  }, [logout])

  useEffect(() => {
    loadSession()
  }, [loadSession])

  const refresh = useCallback(async () => {
    const gid = groupIdRef.current
    if (!gid) {
      setState(null)
      setLoading(false)
      return
    }
    // Não ligamos `loading` aqui: em refreshes de fundo (após cada ação) isso
    // desmontaria a página inteira ("Carregando…") e jogaria o scroll pro topo.
    // `loading` cobre só a carga inicial (começa true, desliga no finally).
    try {
      const s = await api.state(gid)
      setState(s)
      setError(null)
      setViewId((prev) => (prev && s.players.some((p) => p.id === prev) ? prev : s.me_id))
    } catch (e) {
      if (e.status === 401) logout()
      else setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [logout])

  useEffect(() => {
    refresh()
  }, [groupId, refresh])

  const refreshGroups = useCallback(async () => {
    const { groups: gs } = await api.groups()
    setGroups(gs)
    return gs
  }, [])

  async function establishSession(t, u) {
    setToken(t)
    setTokenState(t)
    setUser(u)
    const gs = await refreshGroups()
    selectGroup(gs[0]?.id ?? null)
  }

  async function login(email, password) {
    const { token: t, user: u } = await api.login({ email, password })
    await establishSession(t, u)
  }

  async function googleLogin(credential) {
    const { token: t, user: u } = await api.googleAuth({ credential })
    await establishSession(t, u)
  }

  async function resetPassword(token, password) {
    const { token: t, user: u } = await api.resetPassword({ token, password })
    await establishSession(t, u)
  }

  async function register(payload) {
    const { token: t, user: u } = await api.register(payload)
    setToken(t)
    setTokenState(t)
    setUser(u)
    setGroups([])
    selectGroup(null)
  }

  async function updateUser(patch) {
    const u = await api.updateMe(patch)
    setUser(u)
    await refresh() // nome/avatar aparecem no ranking/estado
    return u
  }

  const me = state?.players.find((p) => p.id === state?.me_id) ?? null
  const viewMember = state?.players.find((p) => p.id === viewId) ?? me

  return (
    <AppCtx.Provider
      value={{
        token,
        user,
        groups,
        groupId,
        group: state?.group ?? groups.find((g) => g.id === groupId) ?? null,
        state,
        me,
        myId: state?.me_id ?? null,
        viewId,
        viewMember,
        setViewId,
        selectGroup,
        refresh,
        refreshGroups,
        login,
        googleLogin,
        resetPassword,
        register,
        logout,
        updateUser,
        booting,
        loading,
        error,
      }}
    >
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => useContext(AppCtx)
