const CACHE = 'firewatch-v1.0.0';
const CORE = ['/', '/index.html', '/manifest.webmanifest'];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));self.skipWaiting();});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('firewatch-') && k !== CACHE).map(k => caches.delete(k)))));self.clients.claim();});
self.addEventListener('fetch', event => {
  const req=event.request,url=new URL(req.url); if(req.method!=='GET'||url.origin!==self.location.origin)return;
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put('/index.html',copy));return r}).catch(()=>caches.match('/index.html')));return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));}return r})));
});
