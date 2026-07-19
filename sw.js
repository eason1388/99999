// 離線快取:安裝時快取主檔,之後網路優先、失敗回退快取(確保更新即時、離線可用)
const CACHE='fsc-v6';
const CORE=['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();
e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)))});
self.addEventListener('activate',e=>{e.waitUntil(
caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
if(e.request.method!=='GET')return;
e.respondWith(fetch(e.request).then(r=>{
const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r;
}).catch(()=>caches.match(e.request)))});
