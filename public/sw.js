/*
 * Muslim Guide Thailand — service worker (hand-written, bundler-agnostic).
 * Runtime caching only (cache-on-view, per the MVP plan) — no build-time
 * precache manifest, so it works identically under Turbopack.
 *
 * Strategy:
 *   - navigations (HTML)        → network-first, fall back to cached page, then /offline.html
 *   - Next static (_next/static)→ cache-first (content-hashed, immutable)
 *   - map tiles / fonts (cross) → cache-first (opaque ok)
 *   - /api/v1 GET               → stale-while-revalidate
 * Bump CACHE_VERSION to invalidate everything on deploy.
 */
const CACHE_VERSION = 'v1';
const SHELL_CACHE = `mgt-shell-${CACHE_VERSION}`;
const PAGE_CACHE = `mgt-pages-${CACHE_VERSION}`;
const ASSET_CACHE = `mgt-assets-${CACHE_VERSION}`;
const TILE_CACHE = `mgt-tiles-${CACHE_VERSION}`;
const API_CACHE = `mgt-api-${CACHE_VERSION}`;

const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png'];

const TILE_HOSTS = ['tiles.openfreemap.org', 'fonts.gstatic.com', 'fonts.googleapis.com'];
const MAX_PAGES = 60;
const MAX_TILES = 300;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('mgt-') && !k.endsWith(CACHE_VERSION))
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > max) {
    for (const k of keys.slice(0, keys.length - max)) await cache.delete(k);
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trim(PAGE_CACHE, MAX_PAGES);
    }
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const shell = await caches.open(SHELL_CACHE);
    return (await shell.match(OFFLINE_URL)) ?? Response.error();
  }
}

async function cacheFirst(request, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  // opaque (cross-origin no-cors) responses have status 0 but are cacheable
  if (res && (res.ok || res.type === 'opaque')) {
    cache.put(request, res.clone());
    if (max) trim(cacheName, max);
  }
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached ?? network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // HTML navigations
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // cross-origin map tiles / fonts
  if (TILE_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, TILE_CACHE, MAX_TILES));
    return;
  }

  // same-origin only below
  if (url.origin !== self.location.origin) return;

  // Next static assets (content-hashed → safe to cache-first)
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  // API reads
  if (url.pathname.startsWith('/api/v1/')) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});

// allow the page to trigger an immediate update
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// --- Web Push -------------------------------------------------------------
// Payload is JSON: { title, body, url, icon, tag }. Announcements only
// (Ramadan/Eid) — every notification is user-visible per userVisibleOnly.
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Muslim Guide Thailand';
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      lang: data.lang,
      tag: data.tag,
      renotify: Boolean(data.tag),
      data: { url: data.url || '/' },
    }),
  );
});

// Focus an already-open tab on the target URL if there is one, else open it.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if (client.url.includes(target) && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target);
    })(),
  );
});
