const CACHE_NAME = 'rapidfireqr-v1.3';
const ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/fountain.js',
  '/qrcode.min.js',
  '/jsqr.js',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/analytics.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never intercept analytics or non-GET requests
  if (event.request.method !== 'GET' || event.request.url.includes('/_vercel/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});
