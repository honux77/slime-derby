const CACHE_VERSION = 'slime-derby-v1';
const ASSETS = [
  './',
  './index.html',
  './favicon.ico',
  './og-image.png',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './mp3/bg.mp3',
  './mp3/bg2.mp',
  './mp3/victory.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request))
  );
});
