'use strict';
const PREFIX='photo-field-guide:'+self.registration.scope+':';
const CACHE=PREFIX+'v1.0.0-20261030';
const FILES=['./','./index.html','./styles.css','./data.js','./reference.js','./calculators.js','./app.js','./manifest.webmanifest','./icons/icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable.png','./icons/apple-touch-icon.png','./images/night.jpg','./images/landscape.jpg','./images/water.jpg','./images/wildlife.jpg','./images/people.jpg','./images/city.jpg','./images/close.jpg','./images/creative.jpg'];
const URLS=FILES.map(file=>new URL(file,self.registration.scope).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(URLS.map(url=>new Request(url,{cache:'reload'})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  if(event.request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(new URL('index.html',scope).href))||fetch(event.request)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
self.addEventListener('message',event=>{
  if(event.data?.type!=='PFG_CACHE_STATUS'||!event.ports?.[0])return;
  event.waitUntil(caches.open(CACHE).then(async cache=>{const checks=await Promise.all(URLS.map(url=>cache.match(url)));event.ports[0].postMessage({ready:checks.every(Boolean),files:URLS.length,version:CACHE});}));
});
