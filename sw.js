// 離線快取:安裝時快取主檔+各功能模組,之後網路優先、失敗回退快取(確保更新即時、離線可用)
const CACHE='fsc-v13';
const CORE=['./index.html','./manifest.json','./icon-192.png','./icon-512.png','./場所佈局.html','./金錢卦.html','./全宅健檢.html',
 './羅盤互動原型.html','./飛星八宅互動原型.html','./擇時飛星互動原型.html','./八字整合互動原型.html',
 './地圖測向互動原型.html','./尋龍模式互動原型.html','./教學中心互動原型.html','./風水分析報告原型.html',
 './平面圖疊盤.html','./勘察流程.html','./使用說明.html'].map(u=>encodeURI(u));
self.addEventListener('install',e=>{self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(
  caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{
    const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp)).catch(()=>{});return r;
  }).catch(()=>caches.match(e.request)))});
