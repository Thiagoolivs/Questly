// Instalação do app na tela inicial (PWA) — detecção de aparelho e passo a passo.
// O evento `beforeinstallprompt` dispara cedo, então capturamos já no import.
let deferredPrompt = null
const listeners = new Set()

const notify = () => listeners.forEach((fn) => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export function onInstallChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const canPromptInstall = () => !!deferredPrompt

// Abre o instalador nativo (Android/desktop). Devolve 'accepted'|'dismissed'|null.
export async function promptInstall() {
  if (!deferredPrompt) return null
  const p = deferredPrompt
  deferredPrompt = null
  notify()
  p.prompt()
  const { outcome } = await p.userChoice
  return outcome
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

// Escotilha de emergência: joga fora o service worker e os caches e recarrega.
// Serve para quando o app instalado ficou preso numa versão antiga.
export async function forceUpdate() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) || []
    await Promise.all(regs.map((r) => r.unregister()))
    if (window.caches) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    // se falhar, o reload abaixo já ajuda
  }
  window.location.reload()
}

// Identifica o aparelho/navegador para dar o passo a passo certo.
export function detectPlatform() {
  const ua = navigator.userAgent || ''
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isAndroid = /Android/.test(ua)
  const isFirefox = /Firefox|FxiOS/i.test(ua)
  const isEdge = /Edg\//i.test(ua)
  // No iOS todo navegador usa o motor do Safari; só o Safari "de verdade" instala.
  const iosOtherBrowser = isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
  if (isIOS) return iosOtherBrowser ? 'ios-other' : 'ios'
  if (isAndroid) return isFirefox ? 'android-firefox' : 'android'
  if (isEdge) return 'desktop-edge'
  if (isFirefox) return 'desktop-firefox'
  return 'desktop'
}

// Passo a passo por plataforma. `native` = dá para abrir o instalador do sistema.
export function installGuide(platform = detectPlatform()) {
  switch (platform) {
    case 'ios':
      return {
        title: 'Adicionar à Tela de Início',
        subtitle: 'No iPhone/iPad, pelo Safari:',
        steps: [
          'Toque no botão Compartilhar (o quadradinho com a seta ↑), na barra de baixo.',
          'Role a lista e toque em "Adicionar à Tela de Início".',
          'Confirme em "Adicionar", no canto superior direito.',
        ],
        note: 'Pronto! O Questly vira um ícone como qualquer outro app.',
      }
    case 'ios-other':
      return {
        title: 'Abra no Safari primeiro',
        subtitle: 'No iPhone, só o Safari consegue instalar o app:',
        steps: [
          'Toque nos "..." (ou no menu) deste navegador.',
          'Escolha "Abrir no Safari".',
          'No Safari: Compartilhar ↑ → "Adicionar à Tela de Início".',
        ],
        note: 'É uma limitação do iPhone, não do Questly. 🙂',
      }
    case 'android':
      return {
        title: 'Instalar o app',
        subtitle: 'No Android (Chrome):',
        steps: [
          'Toque nos três pontinhos (⋮), no canto superior direito.',
          'Escolha "Instalar app" (ou "Adicionar à tela inicial").',
          'Confirme em "Instalar".',
        ],
        note: 'Se aparecer o botão abaixo, é ainda mais rápido: um toque e pronto.',
      }
    case 'android-firefox':
      return {
        title: 'Adicionar à tela inicial',
        subtitle: 'No Firefox (Android):',
        steps: [
          'Toque nos três pontinhos (⋮), no canto inferior direito.',
          'Escolha "Instalar" ou "Adicionar à tela inicial".',
          'Confirme.',
        ],
      }
    case 'desktop-edge':
      return {
        title: 'Instalar o app',
        subtitle: 'No Edge (computador):',
        steps: [
          'Clique no ícone de instalar (⊕) na barra de endereço, à direita.',
          'Ou: menu "..." → Aplicativos → "Instalar este site como um aplicativo".',
          'Confirme em "Instalar".',
        ],
      }
    case 'desktop-firefox':
      return {
        title: 'Fixe o Questly',
        subtitle: 'O Firefox no computador não instala sites como app:',
        steps: [
          'Salve esta página nos favoritos (Ctrl+D).',
          'Ou abra o Questly no Chrome/Edge para instalar de verdade.',
        ],
      }
    default:
      return {
        title: 'Instalar o app',
        subtitle: 'No Chrome (computador):',
        steps: [
          'Clique no ícone de instalar (⊕) na barra de endereço, à direita.',
          'Ou: menu ⋮ → "Instalar Questly".',
          'Confirme em "Instalar".',
        ],
      }
  }
}
