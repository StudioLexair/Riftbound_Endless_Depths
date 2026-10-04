import {Storage,emptyMeta,defaults} from '../save/storage.js';
import {Audio} from '../audio/synth.js';
import {Game} from '../game/game.js';
import {Renderer} from '../game/renderer.js';
import {Interface} from '../ui/interface.js';
import {bindInput} from '../input/controls.js';
const status=document.querySelector('#status');
async function boot(){
 if(location.protocol==='file:'){document.querySelector('#home').innerHTML='<h1>Este juego necesita un origen web</h1><p>Los módulos, IndexedDB y el modo PWA no funcionan abriendo directamente index.html. Usa el servidor local incluido o sirve esta carpeta por HTTPS.</p>';return;}
 let storage=new Storage(),saved=null,persistent=true;
 try{await storage.init();saved=await storage.load();}catch(error){persistent=false;storage={save:async()=>{},clear:async()=>{},load:async()=>null};status.textContent='Guardado no disponible en este navegador: la sesión no persistirá.';}
 const settings={...defaults(),...saved?.settings},meta=saved?.meta||emptyMeta();meta.characters=meta.characters||[];const audio=new Audio(settings),game=new Game(meta,audio,settings);game.run=saved?.run||null;if(game.run){game.run.lastTime=Date.now();game.markSeen();}
 const renderer=new Renderer(document.querySelector('#world'),game);let pending=false,saving=false,again=false;
 const save=async()=>{if(!persistent)return;if(saving){again=true;return;}saving=true;try{await storage.save({meta:game.meta,settings,run:game.run});status.textContent='Guardado local · '+(navigator.onLine?'con conexión':'sin conexión');}catch(e){status.textContent='No se pudo guardar: '+e.message;}finally{saving=false;if(again){again=false;save();}}};
 const schedule=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;save();},250);};
 const ui=new Interface(game,renderer,storage,settings,schedule);ui.applySettings();bindInput(game,ui,renderer);
 if(persistent)status.textContent=storage.recovered?'Guardado recuperado desde la copia de seguridad.':storage.corrupt?'Guardado inválido: se ha iniciado un perfil limpio.':'Guardado local preparado.';
 window.addEventListener('online',()=>status.textContent='Conexión restaurada · juego local');window.addEventListener('offline',()=>status.textContent='Sin conexión · juego local');
 document.addEventListener('visibilitychange',()=>{if(document.hidden){save();audio.pause();}else if(game.run)game.run.lastTime=Date.now();});
 if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;status.textContent+=' · PWA preparada';}catch(e){status.textContent+=' · modo offline no disponible';}}
}
boot().catch(error=>{document.querySelector('#home').innerHTML='<h1>No se pudo iniciar</h1><p>Recarga la página. Si persiste, consulta el archivo VALIDATION.md del paquete.</p>';status.textContent=error.message;console.error(error);});
