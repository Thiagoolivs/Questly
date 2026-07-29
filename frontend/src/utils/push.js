// Inscrição em Web Push do lado do cliente.
import { api } from '../api.js'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const arr = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPushState() {
  if (!pushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    return sub ? 'on' : 'off'
  } catch {
    return 'off'
  }
}

export async function enablePush() {
  if (!pushSupported()) throw new Error('Notificações não são suportadas neste navegador.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Permissão de notificação negada.')
  const { enabled, public_key } = await api.pushKey()
  if (!enabled || !public_key) throw new Error('Notificações não estão configuradas no servidor.')
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(public_key),
  })
  const json = sub.toJSON()
  await api.pushSubscribe({ endpoint: sub.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } })
  return 'on'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    const json = sub.toJSON()
    await api
      .pushUnsubscribe({ endpoint: sub.endpoint, keys: { p256dh: json.keys?.p256dh || '', auth: json.keys?.auth || '' } })
      .catch(() => {})
    await sub.unsubscribe()
  }
  return 'off'
}
