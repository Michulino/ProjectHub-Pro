/* ProjectHub Pro — Service Worker v30
   Estrategia: network-first con fallback a caché.
   La app siempre intenta cargar la versión más reciente de GitHub Pages;
   si no hay internet, sirve la última copia cacheada (modo offline). */

const CACHE_NAME = 'projecthub-v30';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Solo cachear GET del mismo origen (no APIs de Google, fonts, etc.)
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return; // dejar pasar directo a la red
  }

  // Network-first: intenta red, guarda copia, fallback a caché si offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match('./index.html')
        )
      )
  );
});
