/* Minimal offline-first service worker. */
const CACHE = 'roots-of-capitalism-v1';
const CORE = ['./', 'index.html', 'assets/css/styles.css', 'assets/css/fonts.css', 'assets/js/app.js', 'site.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      if (res.ok && new URL(req.url).origin === location.origin) caches.open(CACHE).then(c => c.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
