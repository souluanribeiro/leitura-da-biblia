/// <reference types="vite/client" />

import { precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute } from 'workbox-routing'

declare const self: ServiceWorkerGlobalScope & typeof globalThis

precacheAndRoute(self.__WB_MANIFEST)
registerRoute(new NavigationRoute())

self.addEventListener('push', (event: PushEvent) => {
  let data = { title: 'Ler a Bíblia', body: 'Hora da leitura de hoje!', url: '/' }
  if (event.data) {
    try { data = event.data.json() } catch { /* keep default */ }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: data.url },
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList: readonly WindowClient[]) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
