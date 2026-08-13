import { registerSW } from 'virtual:pwa-register'

// O service worker está em modo autoUpdate: quando uma versão nova é publicada
// ele assume sozinho e a página recarrega. O problema é *quando* ele procura por
// atualização — por padrão, só no carregamento da página. Num app instalado na
// tela inicial a aba fica aberta por dias, então o usuário continua rodando o
// bundle velho (foi o que aconteceu com o onboarding antigo).
// Aqui pedimos a verificação também ao voltar pro app e de tempos em tempos.
const EVERY_MS = 30 * 60 * 1000

export function setupPwaUpdates() {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => {
        if (navigator.onLine === false) return
        reg.update().catch(() => {})
      }
      setInterval(check, EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) check()
      })
      window.addEventListener('online', check)
    },
  })
}
