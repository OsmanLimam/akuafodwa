/*
 * AkuafoDwa service worker.
 * Deliberately conservative so it never fights the dev server or HMR:
 * - App shells (navigations): network first, cached copy only when offline.
 * - Immutable media (/uploads/, /icons/, logo): cache first.
 * - Everything else (bundles, APIs): passed straight through, untouched.
 */
const VERSION = 'akuafo-v4'
const MEDIA_CACHE = 'akuafo-media-v3'
const PAGE_CACHE = 'akuafo-pages-v1'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION).then((cache) => cache.addAll(['/offline.html']).catch(() => undefined))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== VERSION && k !== MEDIA_CACHE && k !== PAGE_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isMedia(url) {
  return (
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/logo.png'
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Fresh produce photos: cache first, they never change under the same name.
  if (isMedia(url)) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const hit = await cache.match(req)
        if (hit) return hit
        try {
          const res = await fetch(req)
          if (res.ok) cache.put(req, res.clone())
          return res
        } catch {
          return hit || Response.error()
        }
      })
    )
    return
  }

  // Page navigations: always try the network first so updates land fast.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          if (res.ok) {
            const cache = await caches.open(PAGE_CACHE)
            cache.put(req, res.clone())
          }
          return res
        } catch {
          const cache = await caches.open(PAGE_CACHE)
          const cached = (await cache.match(req)) || (await cache.match('/'))
          return (
            cached ||
            caches.match('/offline.html').then((r) => r || Response.error())
          )
        }
      })()
    )
  }
  // Everything else: do not intercept.
})

/*
 * Web push: offer and deal alerts.
 * The server sends a JSON payload { title, body, url, tag }; we surface it as
 * a notification and focus (or open) the app when it is tapped.
 */
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'AkuafoDwa', body: event.data ? event.data.text() : '' }
  }
  const title = typeof data.title === 'string' && data.title ? data.title : 'AkuafoDwa'
  const options = {
    body: typeof data.body === 'string' ? data.body : '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag : undefined,
    renotify: Boolean(data.tag),
    data: { url: typeof data.url === 'string' ? data.url : '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    (async () => {
      const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clientList) {
        if ('focus' in client) {
          try {
            if ('navigate' in client && client.url !== new URL(target, self.location.origin).href) {
              await client.navigate(target)
            }
          } catch {
            /* cross-origin or navigation refused; focusing is still fine */
          }
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })()
  )
})
