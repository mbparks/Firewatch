const CACHE = 'firewatch-v1.0.1';
const SCOPE = self.registration.scope;
const INDEX = new URL('index.html', SCOPE).href;
const CORE = [SCOPE, INDEX, new URL('manifest.webmanifest', SCOPE).href];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('firewatch-') && k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(response => {
        if (response.ok) caches.open(CACHE).then(c => c.put(INDEX, response.clone()));
        return response;
      }).catch(async () => (await caches.match(INDEX)) || (await caches.match(SCOPE)))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok) caches.open(CACHE).then(c => c.put(req, response.clone()));
      return response;
    }))
  );
});
