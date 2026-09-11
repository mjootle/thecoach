/* The Coach — offline service worker.
   Strategy:
   - navigation (the app document): network-first, cache fallback. Online coaches
     always get the newest build; offline they get the last one that loaded.
   - same-origin assets (icons, manifest): cache-first, filled on first use.
   - Google Fonts (Archivo): cache-first, filled on first online load, so the
     typeface survives with no data.
   Everything else the app needs (drills, diagrams, translations, timers) is
   already inside the single-file document, so this worker is all that stands
   between the app and a pitch with no signal. */

const VERSION = 'coach-v1';
const SHELL = 'coach-shell-' + VERSION;
const FONTS = 'coach-fonts-' + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(SHELL);
    // Individually, so one 404 can't fail the whole install.
    await Promise.all(PRECACHE.map((u) => cache.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== SHELL && k !== FONTS).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function isFontHost(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (err) {
        const cache = await caches.open(SHELL);
        return (await cache.match('./index.html')) || (await cache.match('./')) ||
          new Response('<h1>Offline</h1><p>Open the app once while connected to install it.</p>',
            { headers: { 'Content-Type': 'text/html' } });
      }
    })());
    return;
  }

  if (isFontHost(url)) {
    e.respondWith((async () => {
      const cache = await caches.open(FONTS);
      const hit = await cache.match(req);
      if (hit) return hit;
      try {
        const res = await fetch(req);
        cache.put(req, res.clone());
        return res;
      } catch (err) {
        return new Response('', { status: 504 });
      }
    })());
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch (err) {
        return new Response('', { status: 504 });
      }
    })());
  }
});
