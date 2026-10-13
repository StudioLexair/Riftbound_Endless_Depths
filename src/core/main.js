import {Storage,emptyMeta,defaults} from '../save/storage.js';
import {Audio} from '../audio/synth.js';
import {Game} from '../game/game.js';
import {Renderer} from '../game/renderer.js';
import {Interface} from '../ui/interface.js';
import {bindInput} from '../input/controls.js';

const status=document.querySelector('#status');
const loading=document.querySelector('#loading');
const loadBar=document.querySelector('#load-bar');
const loadText=document.querySelector('#load-text');
const loadPct=document.querySelector('#load-pct');
const loadTip=document.querySelector('#load-tip');
const TIPS=[
 'Cada paso consume un turno. Los enemigos solo se mueven cuando tú lo haces.',
 'Derrota al guardián del sector para abrir el portal y seguir descendiendo.',
 'Las casillas rojizas anuncian el ataque del jefe: sal de ellas antes de su siguiente turno.',
 'En CLASSIC tienes una resurrección por run. En HARDCORE, ninguna.',
 'Equipar, comprar y vender también consumen turno. Piensa antes de abrir la mochila en combate.',
 'Los fragmentos sirven para el Ancla Permanente: +3 de salud inicial por nivel, para siempre.'
];
let tipIndex=0;
const tipTimer=setInterval(()=>{tipIndex=(tipIndex+1)%TIPS.length;if(loadTip)loadTip.textContent=TIPS[tipIndex];},2600);
let progress=0;
function setProgress(value,text){
 progress=Math.max(progress,Math.min(100,value));
 if(loadBar)loadBar.style.width=progress+'%';
 if(loadPct)loadPct.textContent=Math.round(progress)+'%';
 if(text&&loadText)loadText.textContent=text;
}
function loadingError(title,message){
 clearInterval(tipTimer);
 if(loading){loading.classList.add('error');loading.style.display='flex';}
 if(loadText)loadText.textContent=title;
 if(loadTip)loadTip.textContent=message;
 if(loadPct)loadPct.textContent='';
}
function finishLoading(){
 clearInterval(tipTimer);
 setProgress(100,'La grieta está abierta');
 setTimeout(()=>{
  if(!loading)return;
  loading.classList.add('done');
  setTimeout(()=>{loading.style.display='none';},650);
 },350);
}
function waitImage(img){
 return new Promise(resolve=>{
  if(!img||(img.complete&&img.naturalWidth))return resolve();
  const done=()=>resolve();
  img.addEventListener('load',done,{once:true});
  img.addEventListener('error',done,{once:true});
  setTimeout(done,2500);
 });
}
window.__loadingError=loadingError;

async function boot(){
 setProgress(6,'Abriendo la grieta…');
 if(location.protocol==='file:'){
  loadingError('Este juego necesita un origen web','Los módulos, IndexedDB y el modo PWA no funcionan abriendo directamente index.html. Usa el servidor local incluido (serve.py) o sirve esta carpeta por HTTPS.');
  return;
 }
 setProgress(18,'Leyendo tu guardado…');
 let storage=new Storage(),saved=null,persistent=true;
 try{await storage.init();saved=await storage.load();}catch(error){persistent=false;storage={save:async()=>{},clear:async()=>{},load:async()=>null};status.textContent='Guardado no disponible en este navegador: la sesión no persistirá.';}
 setProgress(38,'Tejiendo el mundo…');
 const settings={...defaults(),...saved?.settings},meta=saved?.meta||emptyMeta();meta.characters=meta.characters||[];const audio=new Audio(settings),game=new Game(meta,audio,settings);game.run=saved?.run||null;if(game.run){game.run.lastTime=Date.now();game.markSeen();}
 const renderer=new Renderer(document.querySelector('#world'),game);let pending=false,saving=false,again=false;
 const save=async()=>{if(!persistent)return;if(saving){again=true;return;}saving=true;try{await storage.save({meta:game.meta,settings,run:game.run});status.textContent='Guardado local · '+(navigator.onLine?'con conexión':'sin conexión');}catch(e){status.textContent='No se pudo guardar: '+e.message;}finally{saving=false;if(again){again=false;save();}}};
 const schedule=()=>{if(pending)return;pending=true;setTimeout(()=>{pending=false;save();},250);};
 const ui=new Interface(game,renderer,storage,settings,schedule);ui.applySettings();bindInput(game,ui,renderer);
 if(persistent)status.textContent=storage.recovered?'Guardado recuperado desde la copia de seguridad.':storage.corrupt?'Guardado inválido: se ha iniciado un perfil limpio.':'Guardado local preparado.';
 window.addEventListener('online',()=>status.textContent='Conexión restaurada · juego local');window.addEventListener('offline',()=>status.textContent='Sin conexión · juego local');
 document.addEventListener('visibilitychange',()=>{if(document.hidden){save();audio.pause();}else if(game.run)game.run.lastTime=Date.now();});
 setProgress(62,'Cargando sprites y tiles…');
 await Promise.all([waitImage(renderer.atlas),waitImage(renderer.tilesImg),waitImage(renderer.propsImg)]);
 setProgress(82,'Preparando el modo sin conexión…');
 if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;status.textContent+=' · PWA preparada';}catch(e){status.textContent+=' · modo offline no disponible';}}
 finishLoading();
}
boot().catch(error=>{
 loadingError('No se pudo iniciar','Recarga la página. Si persiste, consulta el archivo VALIDATION.md del paquete.');
 status.textContent=error.message;console.error(error);
});
