/* Service worker: يخلّي التطبيق يفتح من غير نت */
const CACHE='accounts-v5';
const SHELL=['./','./index.html','./costing.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(/supabase\.(co|in)$/.test(url.hostname)||url.protocol.startsWith('ws'))return; // قاعدة البيانات: أونلاين بس
  const same=url.origin===self.location.origin;
  const cdn=/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.hostname);
  if(!same&&!cdn)return;
  // نرجّع النسخة المحفوظة على طول، ونحدّثها في الخلفية
  e.respondWith(caches.open(CACHE).then(async c=>{
    const key=req.mode==='navigate'?new Request(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname):req;
    const hit=await c.match(key,{ignoreSearch:true});
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque'))c.put(key,r.clone());return r}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    const r=await net;return r||new Response('أوفلاين',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }));
});
