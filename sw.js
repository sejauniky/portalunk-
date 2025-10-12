const CACHE_NAME = 'unk-portal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open('runtime-cache');
    // opcional: pré-cache itens se desejar
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();
  })());
});

// Intercepta fetchs; evita usar await fora de função async e trata manifest.json separadamente
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Ignora métodos que não sejam GET
  if (req.method !== 'GET') return;

  const reqUrl = new URL(req.url);

  // Tratar manifest.json: tenta buscar e, se falhar, tenta devolver do cache ou um manifest vazio
  if (reqUrl.pathname.endsWith('/manifest.json')) {
    event.respondWith(
      fetch(req).catch(async () => {
        const cache = await caches.open('runtime-cache');
        const cached = await cache.match('/manifest.json');
        if (cached) return cached;
        return new Response(JSON.stringify({}), { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // Handler genérico: tenta network -> cache fallback; protege cache.put com try/catch
  event.respondWith((async () => {
    const cache = await caches.open('runtime-cache');
    try {
      const networkResponse = await fetch(req);
      if (networkResponse && networkResponse.ok && networkResponse.type !== 'opaque') {
        try {
          await cache.put(req, networkResponse.clone());
        } catch (err) {
          // falha no cache não deve quebrar a resposta ao cliente
        }
      }
      return networkResponse;
    } catch (err) {
      const cached = await cache.match(req);
      if (cached) return cached;
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  })());
});
