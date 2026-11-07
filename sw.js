'use strict';
const PACKAGE={"version":"f0d1ebc2427aa91e","assets":[{"file":"index.html","bytes":19796489,"sha256":"255a4d321e589c35f1c339d264b204cc110f0534aca74565a40dd19307b36a4b"},{"file":"manifest.webmanifest","bytes":770,"sha256":"f13e8ba257e54cf136c54a2855f583d0afcaf3108a623f737adec2e183ff7b8d"},{"file":"pwa.js","bytes":2788,"sha256":"d1db4aa82b6b59c0e223d680eff62da60f68ef166fa91bc8c853fc4c2dda8ca6"},{"file":"icons/icon-192.png","bytes":3221,"sha256":"cfc68c7bc6829c6ceadb0ade04f77acea20b78c6bba8da3a9e4fb25c78f70cc9"},{"file":"icons/icon-512.png","bytes":12614,"sha256":"8ca15e3069c5e7f11031634cbe9d5c2a75f8c54f5194d4747c5ad414f84dd6fa"},{"file":"icons/maskable-512.png","bytes":12614,"sha256":"8ca15e3069c5e7f11031634cbe9d5c2a75f8c54f5194d4747c5ad414f84dd6fa"},{"file":"icons/icon.svg","bytes":425,"sha256":"1e49d70707b52bf50421812f1d5364aecbcae0717aacdd4862cc9d28a91edc65"}]};
const BASE=self.registration.scope;
const PREFIX='lewis-short:'+new URL(BASE).pathname+':';
const CACHE=PREFIX+PACKAGE.version;
const urlFor=name=>new URL(name,BASE).href;
const READY=urlFor('__offline_ready__');
const URLS=new Map(PACKAGE.assets.map(a=>[urlFor(a.file),a]));
async function sha256(buffer){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buffer))].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function saveOffline(){
 const cache=await caches.open(CACHE);
 try{
  for(const asset of PACKAGE.assets){const request=new Request(urlFor(asset.file),{cache:'reload',credentials:'same-origin'}),response=await fetch(request);if(!response.ok||response.redirected)throw Error('Offline asset unavailable: '+asset.file);const bytes=await response.clone().arrayBuffer();if(bytes.byteLength!==asset.bytes||await sha256(bytes)!==asset.sha256)throw Error('Offline asset failed verification: '+asset.file);await cache.put(urlFor(asset.file),response);}
  await cache.put(READY,new Response(JSON.stringify({version:PACKAGE.version,entries:51645}),{headers:{'Content-Type':'application/json'}}));
  await self.skipWaiting();
 }catch(error){await caches.delete(CACHE);throw error;}
}
async function offlineStatus(){const cache=await caches.open(CACHE);if(!await cache.match(READY))return {ready:false,version:PACKAGE.version};for(const asset of PACKAGE.assets)if(!await cache.match(urlFor(asset.file)))return {ready:false,version:PACKAGE.version};return {ready:true,version:PACKAGE.version,entries:51645};}
self.addEventListener('install',event=>event.waitUntil(saveOffline()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{if(!(await offlineStatus()).ready)throw Error('Offline package incomplete');for(const key of await caches.keys())if(key.startsWith(PREFIX)&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='GET_OFFLINE_STATUS')event.waitUntil((async()=>{const status=await offlineStatus();event.ports?.[0]?.postMessage(status);})());});
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==new URL(BASE).origin)return;
 const root=new URL(BASE).pathname,index=new URL('index.html',BASE).pathname;const isMainPage=request.mode==='navigate'&&(url.pathname===root||url.pathname===index);
 const canonical=isMainPage?urlFor('index.html'):url.origin+url.pathname;if(!isMainPage&&!URLS.has(canonical))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),cached=await cache.match(canonical);if(cached)return cached;try{return await fetch(request);}catch{return new Response('The offline dictionary is not saved yet. Reconnect and open the app once to finish the download.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}})());
});
