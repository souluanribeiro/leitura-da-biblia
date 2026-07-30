import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getPermissionState(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied'
  return Notification.permission
}

export async function subscribeToPush(preferredHour: number): Promise<boolean> {
  if (!isPushSupported()) return false

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return false

  const registration = await navigator.serviceWorker.ready

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await existing.unsubscribe()
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })

  const { endpoint } = subscription
  const key = subscription.getKey('p256dh')
  const auth = subscription.getKey('auth')

  if (!key || !auth) return false

  const p256dh = btoa(String.fromCharCode(...new Uint8Array(key)))
  const authStr = btoa(String.fromCharCode(...new Uint8Array(auth)))

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth: authStr,
      preferred_hour: preferredHour,
      timezone,
      active: true,
    },
    { onConflict: 'user_id,endpoint' }
  )

  return !error
}

export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return true

  await subscription.unsubscribe()

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)

  return !error
}

export async function getSubscriptionStatus(): Promise<{
  subscribed: boolean
  preferredHour: number | null
}> {
  if (!isPushSupported()) return { subscribed: false, preferredHour: null }

  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return { subscribed: false, preferredHour: null }

  const user = (await supabase.auth.getUser()).data.user
  if (!user) return { subscribed: false, preferredHour: null }

  const { data } = await supabase
    .from('push_subscriptions')
    .select('preferred_hour')
    .eq('user_id', user.id)
    .eq('endpoint', subscription.endpoint)
    .eq('active', true)
    .maybeSingle()

  return {
    subscribed: true,
    preferredHour: data?.preferred_hour ?? null,
  }
}

export async function updatePreferredHour(hour: number): Promise<boolean> {
  const user = (await supabase.auth.getUser()).data.user
  if (!user) return false

  const { error } = await supabase
    .from('push_subscriptions')
    .update({ preferred_hour: hour })
    .eq('user_id', user.id)
    .eq('active', true)

  return !error
}
