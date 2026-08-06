// Convite por link: /entrar?convite=ABC123 (ou ?convite= em qualquer rota).
// O código é capturado no boot, guardado na sessão e consumido na tela de grupos
// — assim o fluxo sobrevive ao login/cadastro de quem ainda não tem conta.
const KEY = 'questly.invite'

export function captureInviteFromUrl() {
  try {
    const url = new URL(window.location.href)
    const code = (url.searchParams.get('convite') || url.searchParams.get('code') || '').trim().toUpperCase()
    if (code) {
      sessionStorage.setItem(KEY, code)
      url.searchParams.delete('convite')
      url.searchParams.delete('code')
      const path = url.pathname === '/entrar' ? '/' : url.pathname
      window.history.replaceState({}, '', path + url.search + url.hash)
    }
  } catch {
    /* ignore */
  }
  return pendingInvite()
}

export const pendingInvite = () => sessionStorage.getItem(KEY) || null
export const clearInvite = () => sessionStorage.removeItem(KEY)

export function inviteLink(code) {
  return `${window.location.origin}/entrar?convite=${encodeURIComponent(code || '')}`
}

// Compartilha o link (menu nativo no celular) ou copia. Devolve 'shared'|'copied'.
export async function shareInvite(code, groupName) {
  const url = inviteLink(code)
  const text = `Bora evoluir junto no Questly? Entre no grupo "${groupName || 'nosso grupo'}":`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Questly', text, url })
      return 'shared'
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled'
    }
  }
  await navigator.clipboard?.writeText(url)
  return 'copied'
}
