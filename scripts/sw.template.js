/* SafeMark service worker — makes the app available offline.
 *
 * It only ever caches the app's own static files. User files are never sent to the network
 * in the first place, so there is nothing else to cache. Generated at build time from
 * scripts/sw.template.js; the placeholders below are replaced with the build manifest.
 */

const VERSION = '__SW_VERSION__'
const PRECACHE = __SW_PRECACHE__
const CACHE_PREFIX = 'safemark-'
const CACHE = `${CACHE_PREFIX}${VERSION}`
// Caches of older versions are kept for a while so that tabs still running an old build can
// lazy-load their (content-hashed) chunks after an update.
const KEEP_OLD_CACHES = 2
// Module scripts are requested with an `Origin` header and precached files without one, so a
// `Vary: Origin` response header (sent by many static hosts) would prevent every match.
const MATCH = { ignoreVary: true }

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = (await caches.keys()).filter(
        (name) => name.startsWith(CACHE_PREFIX) && name !== CACHE,
      )
      // `caches.keys()` returns caches in creation order: drop all but the newest few.
      await Promise.all(names.slice(0, -KEEP_OLD_CACHES).map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // App shell: serve the cached page of this version, fall back to the network.
    event.respondWith(
      caches
        .open(CACHE)
        .then((cache) => cache.match('index.html', MATCH))
        .then((cached) => cached || fetch(request)),
    )
    return
  }

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      let cached = await cache.match(request, MATCH)
      // Content-hashed build output is immutable, so a copy from an older cache is still
      // valid. Other files (e.g. pdf.js data) must come from the current version.
      if (!cached && url.pathname.includes('/assets/')) cached = await caches.match(request, MATCH)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone())
      return response
    })(),
  )
})
