import {generate,isFloor,lineClear} from '../src/world/generator.js';
import {DATA} from '../data/content.js';
import {Game} from '../src/game/game.js';
import {emptyMeta,defaults,validate,SAVE_VERSION,Storage} from '../src/save/storage.js';
const out=document.querySelector('#out');let pass=0,fail=0;out.textContent='';
function test(name,fn){try{fn();pass++;out.textContent+='OK '+name+'\n';}catch(e){fail++;out.textContent+='ERROR '+name+': '+e.message+'\n';}}
const assert=(x,m='Aserción fallida')=>{if(!x)throw Error(m);};
function reachable(w){const q=[w.start],v=new Set([`${w.start.x},${w.start.y}`]);for(let i=0;i<q.length;i++){const p=q[i];for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(isFloor(w,x,y)&&!v.has(k)){v.add(k);q.push({x,y});}}}return v;}
test('Catálogo: clases, enemigos, jefes, objetos y logros',()=>{assert(DATA.classes.length===7);assert(DATA.enemies.length===30);assert(DATA.bosses.length===6);assert(DATA.items.length>=50);assert(DATA.achievements.length>=30);});
test('Determinismo de generación',()=>assert(JSON.stringify(generate('test',7))===JSON.stringify(generate('test',7))));
test('200 sectores: conectividad y posiciones',()=>{for(let n=1;n<=200;n++){const w=generate(`seed-${n}`,n),v=reachable(w);assert(v.has(`${w.exit.x},${w.exit.y}`),'Portal desconectado');for(const e of w.enemies)assert(v.has(`${e.x},${e.y}`),'Enemigo desconectado');for(const o of w.objects)assert(v.has(`${o.x},${o.y}`),'Objeto desconectado');assert(w.enemies.filter(e=>e.boss).length===1);}});
const audio={sound(){},mode:'menu'};const g=new Game(emptyMeta(),audio,defaults());
test('Inicio de siete clases y save válido',()=>{for(let i=0;i<7;i++){g.start(i,'classic','test');validate({version:SAVE_VERSION,meta:g.meta,settings:g.settings,run:g.run});assert(g.stats().hp>=DATA.classes[i].hp);}});
test('Colisión no consume turno',()=>{g.start(0,'classic','test');g.w.enemies=[];g.p.x=0;g.p.y=0;const before=g.run.turn;assert(!g.move(-1,0));assert(g.run.turn===before);});
test('Esperar sí consume turno',()=>{g.start(0,'classic','test');g.w.enemies=[];g.wait();assert(g.run.turn===1);});
test('Ataque, XP y bajas',()=>{g.start(0,'classic','test');const e=g.w.enemies[0];e.hp=1;g.hit(e,10);assert(e.hp===0);assert(g.run.metrics.kills===1);});
test('Equipo, venta y economía',()=>{g.start(0,'classic','test');g.w.enemies=[];const item=g.createItem('i18',2);g.p.inventory.push(item);g.equip(item.uid);assert(g.p.equipment.armor.uid===item.uid);const sell=g.createItem('i36',1);g.p.inventory.push(sell);const gold=g.p.gold;g.sell(sell.uid);assert(g.p.gold>gold);});
test('Habilidad y cooldown',()=>{g.start(0,'classic','test');g.w.enemies=[];g.skill(0);assert(g.p.cooldowns[0]>0);assert(g.p.shield>0);});
test('Árbol funcional',()=>{g.p.points=2;g.train(1);assert(g.p.skillRanks[1]===1);assert(g.p.points===1);});
test('Classic: una resurrección',()=>{g.start(0,'classic','test');g.p.hp=0;g.die();assert(!g.run.over);assert(g.run.revives===0);g.p.hp=0;g.die();assert(g.run.over);assert(g.meta.records.length===1);});
test('Hardcore: muerte definitiva',()=>{g.start(0,'hardcore','test');g.p.hp=0;g.die();assert(g.run.over);});
test('Rechazo de save corrupto y versión futura',()=>{g.start(0,'classic','test');const s={version:SAVE_VERSION,meta:g.meta,settings:g.settings,run:g.run};let rejected=false;try{validate({...s,version:999});}catch{rejected=true;}assert(rejected);const bad=structuredClone(s);bad.run.player.hp=NaN;rejected=false;try{validate(bad);}catch{rejected=true;}assert(rejected);});
test('Loot, consumibles, misiones y metaprogreso',()=>{g.start(0,'classic','test');g.w.enemies=[];g.p.hp=10;const potion=g.p.inventory.find(i=>i.base==='i54');g.consume(potion.uid);assert(g.p.hp>10);g.run.questProgress.kills=8;g.claimQuest('hunt');assert(g.run.claimed.includes('hunt'));g.meta.stats.kills=160;g.checkMeta();assert(g.meta.unlocked.length===7);assert(g.meta.achievements.length>0);});
test('Cambio de sector y seis biomas',()=>{g.start(0,'classic','test');for(let i=0;i<6;i++){assert(g.w.biome===i);if(i<5)g.nextDepth();}assert(g.run.zones.length===6);validate({version:SAVE_VERSION,meta:g.meta,settings:g.settings,run:g.run});});
out.textContent+=`\n${pass} pruebas correctas; ${fail} fallos.\nEstas pruebas se ejecutan en el navegador, no prueban UX ni dispositivos físicos.\n`;
