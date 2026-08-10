const CACHE_NAME = 'leitura-v4'
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') return

  if (url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    )
    return
  }

  if (url.hostname.includes('wol.jw.org')) {
    event.respondWith(
      caches.open('wol-cache').then((cache) =>
        cache.match(request).then((cached) => {
          const fetched = fetch(request).then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          }).catch(() => cached)
          return cached || fetched
        })
      )
    )
    return
  }

  // Navegação (HTML/shell): network-first. O shell referencia bundles JS/CSS com
  // hash de build — servir um index.html velho do cache (stale-while-revalidate)
  // aponta pra arquivos que a Vercel já removeu depois de um novo deploy, quebrando
  // o app até um segundo reload. Cache só entra como fallback offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetched
    })
  )
})

self.addEventListener('push', (event) => {
  let data = {}
  if (event.data) {
    try {
      data = event.data.json()
    } catch (e) {
      data = {}
    }
  }
  const title = data.title || 'Leitura da Bíblia'
  const options = {
    body: data.body || 'Hora da leitura diária!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'leitura-diaria',
    renotify: true,
  }

  self.registration.pushManager.getSubscription().then((sub) => {
    if (sub) {
      const tail = sub.endpoint.slice(-30)
      const anonKey = '__SUPABASE_ANON_KEY__'
      if (!anonKey || anonKey.indexOf('SUPABASE_ANON_KEY') !== -1) return
      fetch('https://lbgztfqgzjmiwvcghnki.supabase.co/functions/v1/log-push-received', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
        },
        body: JSON.stringify({ endpoint_tail: tail }),
      }).catch(() => {})
    }
  })

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        const client = clientList[0]
        client.focus()
        return client.navigate('/')
      }
      return clients.openWindow('/')
    })
  )
})
