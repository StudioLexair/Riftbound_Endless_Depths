export const SAVE_VERSION=1;
const NAME='riftbound-depths';
export function emptyMeta(){return {shards:0,upgrade:0,unlocked:[0,1,2],achievements:[],stats:{},records:[],characters:[]};}
export function defaults(){return {music:true,sfx:true,volume:.35,haptics:false,reduced:false,quality:'normal',ui:1,language:'es'};}
function finite(n,min,max){return Number.isFinite(n)&&n>=min&&n<=max;}
export function validate(save){
 if(!save||save.version!==SAVE_VERSION||!save.meta||!save.settings)throw Error('Formato o versión desconocida');
 const m=save.meta;if(!finite(m.shards,0,1e9)||!finite(m.upgrade,0,100)||!Array.isArray(m.records)||!Array.isArray(m.achievements)||!Array.isArray(m.unlocked)||!m.stats)throw Error('Metaprogreso inválido');
 if(m.unlocked.some(n=>!Number.isInteger(n)||n<0||n>6)||m.records.length>30)throw Error('Desbloqueos inválidos');
 for(const value of Object.values(m.stats))if(!finite(value,0,1e12))throw Error('Estadísticas inválidas');
 if(!finite(save.settings.volume,0,1)||!finite(save.settings.ui,.8,1.4))throw Error('Ajustes inválidos');
 const r=save.run;if(!r)return save;
 if(!r.player||!r.world||!finite(r.depth,1,1e5)||!Number.isInteger(r.classIndex)||r.classIndex<0||r.classIndex>6||typeof r.seed!=='string'||r.seed.length>100||!['classic','hardcore'].includes(r.mode))throw Error('Partida inválida');
 const p=r.player;if(!finite(p.hp,0,1e8)||!finite(p.mp,0,1e8)||!finite(p.level,1,1e5)||!finite(p.x,0,35)||!finite(p.y,0,35)||!finite(p.gold,0,1e12)||!Array.isArray(p.inventory)||p.inventory.length>60||!p.equipment||!Array.isArray(p.skillRanks)||p.skillRanks.length!==6)throw Error('Personaje inválido');
 const checkItem=i=>{if(!i||!/^i\d+$/.test(i.base)||!finite(Number(i.base.slice(1)),0,59)||!Number.isInteger(i.rarity)||!finite(i.rarity,0,5)||!finite(i.power,.5,10000)||typeof i.uid!=='string'||!finite(i.count,1,9999))throw Error('Objeto inválido');};
 p.inventory.forEach(checkItem);Object.values(p.equipment).filter(Boolean).forEach(checkItem);
 if(!Number.isInteger(p.x)||!Number.isInteger(p.y)||!finite(p.xp,0,1e12)||!finite(p.points,0,1e9)||!finite(p.shield,0,1e9)||!finite(p.summon,0,1e6))throw Error('Recursos inválidos');
 if(!p.statuses||!p.cooldowns||!r.metrics||!r.questProgress||!Array.isArray(r.claimed)||!Array.isArray(r.zones))throw Error('Datos faltantes');
 if(p.skillRanks.some(v=>!Number.isInteger(v)||v<0||v>5))throw Error('Habilidades inválidas');
 for(const value of Object.values(p.cooldowns))if(!finite(value,0,1000))throw Error('Recarga inválida');
 const statusCheck=entity=>{for(const [name,value] of Object.entries(entity.statuses)){if(!['burn','poison','bleed','freeze','stun','weak','regen','guard','evade','empower'].includes(name)||!value||!finite(value.turns,1,1000)||!finite(value.power,0,1e6))throw Error('Estado inválido');}};statusCheck(p);
 for(const value of Object.values(r.metrics))if(!finite(value,0,1e12))throw Error('Métrica inválida');
 if(!finite(r.randomState,0,4294967295)||!finite(r.turn,0,1e12)||!finite(r.elapsed,0,1e12)||!finite(r.revives,0,1))throw Error('Run inválida');
 const w=r.world;if(!Number.isInteger(w.biome)||w.biome<0||w.biome>5||!w.start||!finite(w.start.x,1,34)||!finite(w.start.y,1,34)||!finite(w.nextId,1,1e9))throw Error('Sector inválido');
 if(w.depth!==r.depth||!Array.isArray(w.tiles)||w.tiles.length!==36||w.tiles.some(row=>!Array.isArray(row)||row.length!==36||row.some(t=>t!==0&&t!==1))||!Array.isArray(w.enemies)||w.enemies.length>180||!Array.isArray(w.objects)||w.objects.length>250||!Array.isArray(w.seen))throw Error('Mundo inválido');
 if(w.tiles[p.y]?.[p.x]!==1)throw Error('Posición inválida');
 for(const e of w.enemies){if(!/^[eb]\d+$/.test(e.def)||!Number.isInteger(Number(e.def.slice(1)))||Number(e.def.slice(1))>(e.def[0]==='e'?29:5)||!finite(e.hp,0,1e8)||!finite(e.maxHp,1,1e8)||!finite(e.x,0,35)||!finite(e.y,0,35)||!Number.isInteger(e.x)||!Number.isInteger(e.y)||!e.statuses||!finite(e.clock,0,10)||!finite(e.turns,0,1e12))throw Error('Enemigo inválido');statusCheck(e);}
 for(const o of w.objects){if(!['exit','npc','chest','trap','event','door','loot'].includes(o.type)||!Number.isInteger(o.x)||!Number.isInteger(o.y)||!finite(o.x,0,35)||!finite(o.y,0,35))throw Error('Objeto de mundo inválido');if(o.type==='loot'){if(!Array.isArray(o.items)||o.items.length>100)throw Error('Botín inválido');o.items.forEach(checkItem);}if(o.type==='npc'&&!['merchant','healer','smith','trainer','story','secret'].includes(o.npc))throw Error('NPC inválido');}
 if(w.seen.length>1296||w.seen.some(k=>typeof k!=='string'||!/^\d{1,2},\d{1,2}$/.test(k)))throw Error('Exploración inválida');
 return save;
}
export class Storage{
 async init(){this.db=await new Promise((ok,no)=>{const request=indexedDB.open(NAME,1);request.onupgradeneeded=()=>request.result.createObjectStore('saves');request.onsuccess=()=>ok(request.result);request.onerror=()=>no(request.error);});}
 request(mode,fn){return new Promise((ok,no)=>{const tx=this.db.transaction('saves',mode);let value;fn(tx.objectStore('saves'),v=>value=v);tx.oncomplete=()=>ok(value);tx.onerror=()=>no(tx.error);tx.onabort=()=>no(tx.error);});}
 async load(){const data=await this.request('readonly',(store,set)=>{const req=store.get('main');req.onsuccess=()=>set(req.result);});if(!data)return null;try{return validate(data);}catch(error){const backup=await this.request('readonly',(store,set)=>{const req=store.get('backup');req.onsuccess=()=>set(req.result);});try{this.recovered=true;return validate(backup);}catch{this.corrupt=true;return null;}}}
 async save(state){const snapshot=JSON.parse(JSON.stringify({version:SAVE_VERSION,...state}));validate(snapshot);return this.request('readwrite',store=>{const get=store.get('main');get.onsuccess=()=>{if(get.result){try{validate(get.result);store.put(get.result,'backup');}catch{}}store.put(snapshot,'main');};});}
 async clear(){return this.request('readwrite',store=>store.clear());}
}
