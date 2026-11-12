/* PWA estática. Cache de recursos locais; JSON atualizado preferencialmente pela rede. */
const VERSION = 'cardapio3d-v1.3.0';
const STATIC_CACHE = `${VERSION}-static`;
const RUNTIME_CACHE = `${VERSION}-runtime`;
const MODEL_VIEWER_CDN = 'https://unpkg.com/@google/model-viewer@4.1.0/dist/model-viewer.min.js';
const SHELL = [
  './','./index.html','./css/style.css','./js/app.js','./manifest.webmanifest',
  './icon-192.png','./icon-512.png','./assets/logo.svg','./data/menu.json',
  './assets/img/pratos/prato-executivo-real.webp',
  './assets/img/pratos/prato-especial-real-movimento.webp',
  './assets/posters/burger.svg','./assets/posters/pizza.svg',
  './assets/posters/poke.svg','./assets/posters/brownie.svg',
  './assets/models/burger.glb','./assets/models/pizza.glb',
  './assets/models/prato-executivo-reconstruido.glb',
  './assets/models/poke.glb','./assets/models/brownie.glb'
];
self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    await (await caches.open(STATIC_CACHE)).addAll(SHELL);
    // Opcional: tenta disponibilizar o componente 3D offline após a primeira instalação.
    try {await (await caches.open(RUNTIME_CACHE)).add(MODEL_VIEWER_CDN);} catch(err){console.warn('3D offline não pré-carregado', err);}
    await self.skipWaiting();
  })());
});
self.addEventListener('activate',event=>{
  event.waitUntil(Promise.all([
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('cardapio3d-')&&!k.startsWith(VERSION)).map(k=>caches.delete(k)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin){
    // Dependência model-viewer / fontes podem ser guardadas depois de carregadas online.
    if(/^https:\/\/(unpkg\.com|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(url.origin)){
      event.respondWith(caches.open(RUNTIME_CACHE).then(async cache=>{
        const cached=await cache.match(req);
        const online=fetch(req).then(res=>{if(res.ok||res.type==='opaque')cache.put(req,res.clone());return res}).catch(()=>cached);
        return cached||online;
      }));
    }
    return;
  }
  if(url.pathname.endsWith('/data/menu.json')){
    event.respondWith(fetch(req).then(async res=>{
      if(res.ok)(await caches.open(RUNTIME_CACHE)).put(req,res.clone());return res;
    }).catch(async()=>await caches.match(req)||Response.error()));
    return;
  }
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(async res=>{if(res.ok)(await caches.open(RUNTIME_CACHE)).put(req,res.clone());return res}).catch(async()=>await caches.match(req)||await caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(async res=>{if(res.ok)(await caches.open(RUNTIME_CACHE)).put(req,res.clone());return res})));
});
