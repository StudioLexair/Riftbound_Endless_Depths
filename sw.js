const VERSION='riftbound-v1.0.0';
const FILES=["./", "./index.html", "./style.css", "./manifest.webmanifest", "./src/audio/synth.js", "./src/core/main.js", "./src/core/random.js", "./src/game/game.js", "./src/game/renderer.js", "./src/input/controls.js", "./src/save/storage.js", "./src/ui/interface.js", "./src/world/generator.js", "./data/content.js", "./assets/sprites/atlas.png", "./assets/ui/icon-192.png", "./assets/ui/icon-512.png", "./assets/ui/logo.svg"];
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('riftbound-')&&k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const req=event.request;if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(c=>c.put(req,copy));}return response;}).catch(async()=>await caches.match(req)||await caches.match('./index.html')));return;}
 event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(response=>{if(response.ok){const copy=response.clone();caches.open(VERSION).then(c=>c.put(req,copy));}return response;})));
});
