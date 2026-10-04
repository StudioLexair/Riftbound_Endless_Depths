import {DATA} from '../../data/content.js';
import {generate,isFloor,lineClear,pathStep} from '../world/generator.js';
import {hash,rng,distance,key,clamp} from '../core/random.js';
const byId=(id)=>DATA.items.find(i=>i.id===id);
export class Game{
 constructor(meta,audio,settings){this.meta=meta;this.audio=audio;this.settings=settings;this.run=null;this.messages=[];this.listeners=[];this.fx=[];this.busy=false;}
 notify(){this.listeners.forEach(fn=>fn());}
 log(text){this.messages.unshift(text);this.messages=this.messages.slice(0,8);}
 random(){this.run.randomState=(Math.imul(this.run.randomState,1664525)+1013904223)>>>0;return this.run.randomState/4294967296;}
 start(classIndex,mode,seed){const c=DATA.classes[classIndex];const now=Date.now();
 this.run={seed:seed||String(now),randomState:hash(seed||String(now)),classIndex,mode,depth:1,turn:0,started:now,elapsed:0,lastTime:now,metrics:{kills:0,steps:0,bosses:0,goldEarned:0,events:0,chests:0,loot:0,clean:0},questProgress:{},claimed:[],zones:[0],revives:mode==='classic'?1:0,over:false,player:{x:0,y:0,hp:c.hp+this.meta.upgrade*3,mp:c.resource,level:1,xp:0,gold:20,points:0,skillRanks:[1,0,0,0,0,0],cooldowns:{},statuses:{},inventory:[],equipment:{weapon:null,armor:null,accessory:null},shield:0,summon:0,clean:0}};
 this.run.world=generate(this.run.seed,1);Object.assign(this.p,this.run.world.start);
 const base=DATA.items.find(i=>i.slot==='weapon'&&i.weapon===c.weapon);this.p.equipment.weapon=this.createItem(base.id,0);
 this.p.inventory.push(this.createItem('i54',0),this.createItem('i55',0));this.messages=[];this.log('Cada paso consume un turno. Avanza hacia la corona y libera el portal.');this.markSeen();this.meta.stats.runs=(this.meta.stats.runs||0)+1;this.meta.characters.unshift({classIndex,seed:this.run.seed,mode,date:now});this.meta.characters=this.meta.characters.slice(0,20);this.notify();
 }
 get p(){return this.run?.player;}get w(){return this.run?.world;}get c(){return DATA.classes[this.run.classIndex];}
 enemyDef(e){return DATA.enemies.find(d=>d.id===e.def)||DATA.bosses.find(d=>d.id===e.def);}
 stats(){const p=this.p,c=this.c;const g=c.growth,L=p.level-1;const s={hp:c.hp+L*g.hp+this.meta.upgrade*3,resource:c.resource+L*g.resource,attack:c.attack+L*g.attack,defense:c.defense+L*g.defense,speed:c.speed,crit:c.crit,evasion:c.evasion,regen:c.regen,range:1,critPower:1.6};
 for(const item of Object.values(p.equipment).filter(Boolean)){const def=byId(item.base),mult=DATA.rarities[item.rarity].mult*item.power;for(const [k,v] of Object.entries(def.stats))s[k]=(s[k]||0)+v*mult;}
 s.hp=Math.round(s.hp);s.resource=Math.round(s.resource);s.attack+=p.skillRanks[3]*2;s.defense+=p.skillRanks[4];s.regen+=p.skillRanks[5]*.2;
 const pref=p.equipment.weapon&&byId(p.equipment.weapon.base).weapon===c.weapon;if(pref)s.attack*=1.12;
 if(this.c.id==='Vanguard')s.defense+=p.level*.25;if(this.c.id==='Arcanist')s.resource+=4;if(this.c.id==='Ranger')s.range+=1;if(this.c.id==='Shadow')s.critPower+=.3;if(this.c.id==='Bloodbound')s.regen+=.1;if(this.c.id==='Pyromancer')s.attack+=p.level*.2;
 if(this.hasEffect('evade'))s.evasion+=.04;if(this.hasEffect('reach'))s.range++;if(this.hasEffect('crit'))s.critPower+=.2;
 if(p.statuses.weak)s.attack*=.7;if(p.statuses.empower)s.attack*=1.4;if(p.statuses.guard)s.defense+=6;if(p.statuses.evade)s.evasion+=.5;
 s.evasion=clamp(s.evasion,0,.7);s.crit=clamp(s.crit,0,.8);s.speed=clamp(s.speed,.55,1.8);return s;
 }
 hasEffect(effect){return Object.values(this.p.equipment).some(item=>item&&byId(item.base).effect===effect);}
 createItem(base,rarity=null){if(rarity===null){const n=this.random();rarity=n<.5?0:n<.76?1:n<.91?2:n<.973?3:n<.997?4:5;}return {uid:`${this.run.turn}-${Math.floor(this.random()*1e12)}`,base,rarity,power:1+(this.run.depth-1)*.035,count:1};}
 itemName(item){return `${byId(item.base).name} · ${DATA.rarities[item.rarity].name}`;}
 metric(name,n=1){this.run.metrics[name]=(this.run.metrics[name]||0)+n;const permanent=name==='goldEarned'?'gold':name;this.meta.stats[permanent]=(this.meta.stats[permanent]||0)+n;this.run.questProgress[name]=(this.run.questProgress[name]||0)+n;}
 gold(n){this.p.gold+=n;this.metric('goldEarned',n);}
 gainXP(n){const p=this.p;p.xp+=n;while(p.xp>=this.xpGoal()){p.xp-=this.xpGoal();p.level++;p.points+=2;p.hp=Math.min(this.stats().hp,p.hp+12);p.mp=Math.min(this.stats().resource,p.mp+6);this.log(`Nivel ${p.level}: +2 puntos de habilidad.`);this.audio.sound('level');}this.meta.stats.level=Math.max(this.meta.stats.level||0,p.level);}
 xpGoal(){return 22+this.p.level*16;}
 markSeen(){const seen=new Set(this.w.seen);for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const x=this.p.x+dx,y=this.p.y+dy;if(x<0||y<0||x>=36||y>=36||Math.hypot(dx,dy)>7)continue;if(lineClear(this.w,this.p,{x,y})||Math.abs(dx)+Math.abs(dy)<=2)seen.add(key(x,y));}this.w.seen=[...seen];}
 visible(e){return distance(this.p,e)<=8&&lineClear(this.w,this.p,e);}
 haptic(pattern){if(this.settings.haptics)navigator.vibrate?.(pattern);}
 nearest(max=6){return this.w.enemies.filter(e=>e.hp>0&&distance(e,this.p)<=max&&lineClear(this.w,this.p,e)).sort((a,b)=>distance(a,this.p)-distance(b,this.p))[0];}
 move(dx,dy){if(!this.canAct())return false;this.facing={dx,dy};if(this.p.statuses.stun||this.p.statuses.freeze){this.log('No puedes moverte: espera a recuperar el control.');this.endTurn();return true;}
 const x=this.p.x+dx,y=this.p.y+dy;if(!isFloor(this.w,x,y))return false;const enemy=this.w.enemies.find(e=>e.x===x&&e.y===y&&e.hp>0);if(enemy){this.hit(enemy,1);this.endTurn();return true;}
 const obj=this.w.objects.find(o=>o.x===x&&o.y===y&&!o.used);if(obj?.type==='door'&&!obj.open){obj.open=true;this.log('La puerta se abre.');this.endTurn();return true;}
 if(obj?.type==='npc'){this.onInteract?.(obj);return false;}
 this.p.x=x;this.p.y=y;this.metric('steps');if(this.run.metrics.steps===2)this.log('Choca con un enemigo para atacar. ESPERAR permite atraerlo.');if(this.run.metrics.steps===8)this.log('Abre MOCHILA para comparar equipo. El botón I usa tu habilidad.');if(this.run.metrics.steps===15)this.log('CURAR consume un tónico y un turno. Recoge botín pisándolo o con INTERACTUAR.');if(this.run.metrics.steps===24)this.log('El guardián libera el portal. CLASSIC tiene un ancla; HARDCORE no permite volver.');
 if(obj?.type==='trap'){obj.used=true;this.damagePlayer(3+this.run.depth,null);this.status(this.p,DATA.biomes[this.w.biome].hazard,3,2);this.log('Has activado una trampa.');}
 if(obj?.type==='loot'){this.pickup(obj);}
 this.endTurn();return true;
 }
 canAct(){return !!this.run&&!this.run.over&&!this.busy;}
 wait(){if(!this.canAct())return;this.log('Esperas.');this.endTurn();}
 attack(){if(!this.canAct())return;const w=this.p.equipment.weapon&&byId(this.p.equipment.weapon.base).weapon;const range=['Arco','Bastón'].includes(w)?5:this.stats().range;const enemy=this.nearest(range);if(!enemy){this.log('No hay un objetivo al alcance.');this.notify();return;}if(this.p.statuses.stun||this.p.statuses.freeze){this.endTurn();return;}this.hit(enemy,1);this.endTurn();}
 status(target,name,turns,power=2){const old=target.statuses[name];target.statuses[name]={turns:Math.max(old?.turns||0,turns),power:Math.max(old?.power||0,power)};}
 hit(e,mult=1,status='',trueDamage=false){if(e.hp<=0)return 0;const s=this.stats(),d=this.enemyDef(e);let attack=s.attack*mult;if(this.hasEffect('execute')&&e.hp<e.maxHp*.35)attack*=1.4;let armor=(d.defense+this.run.depth*.2)*(this.hasEffect('pierce') ? .35 : 1);let amount=Math.max(1,Math.round(attack-(trueDamage?0:armor)));const crit=this.random()<s.crit;if(crit)amount=Math.round(amount*s.critPower);this.hurtEnemy(e,amount);this.fx.push({x:e.x,y:e.y,text:`${crit?'CRIT ':''}${amount}`,color:'#f6d590',life:1});this.audio.sound('attack');this.haptic(12);
 if(e.hp>0){if(status)this.status(e,status,3,Math.max(2,Math.round(s.attack*.2)));for(const effect of ['burn','poison','bleed','freeze','stun'])if(this.hasEffect(effect)&&this.random()<.17)this.status(e,effect,3,2);}
 if(this.hasEffect('leech')||this.c.id==='Bloodbound')this.p.hp=Math.min(s.hp,this.p.hp+amount*.13);
 if(this.hasEffect('chain')){const other=this.w.enemies.find(o=>o!==e&&o.hp>0&&distance(o,e)<=2);if(other)this.hurtEnemy(other,Math.max(1,Math.round(amount*.3)));}
 return amount;
 }
 hurtEnemy(e,amount){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-amount);if(e.hp===0)this.kill(e);}
 kill(e){const d=this.enemyDef(e);this.metric('kills');this.gainXP(d.xp+this.run.depth*2);this.gold(Math.round((4+this.run.depth*2)*(this.hasEffect('gold')?1.4:1)));if(this.hasEffect('mana'))this.p.mp=Math.min(this.stats().resource,this.p.mp+3);
 if(e.boss){this.w.bossDead=true;this.w.objects.find(o=>o.type==='exit').locked=false;this.metric('bosses');if(this.run.mode==='hardcore')this.meta.stats.hardcoreBosses=(this.meta.stats.hardcoreBosses||0)+1;this.meta.shards+=5;this.log(`${d.name} ha caído. El portal está abierto.`);this.audio.sound('level');this.haptic([20,40,20]);this.dropAt(e,this.createItem(`i${Math.floor(this.random()*54)}`,Math.max(2,Math.floor(this.random()*6))));}
 else if(this.random()<d.drop)this.dropAt(e,this.createItem(`i${Math.floor(this.random()*60)}`));
 }
 dropAt(pos,item){let obj=this.w.objects.find(o=>o.x===pos.x&&o.y===pos.y&&o.type==='loot'&&!o.used);if(obj)obj.items.push(item);else this.w.objects.push({x:pos.x,y:pos.y,type:'loot',items:[item],used:false});}
 pickup(obj){const leftovers=[];for(const item of obj.items){if(this.p.inventory.length>=60){leftovers.push(item);continue;}this.p.inventory.push(item);this.metric('loot');this.log(`Recoges ${this.itemName(item)}.`);}obj.items=leftovers;obj.used=!leftovers.length;if(leftovers.length)this.log('Mochila llena: máximo 60 objetos.');this.audio.sound('loot');}
 damagePlayer(amount,e){const s=this.stats();if(this.random()<s.evasion){this.log('Esquivas el ataque.');return;}if(this.hasEffect('guard')&&this.random()<.2)amount*=.5;amount=Math.max(1,Math.round(amount-s.defense*.5));if(this.p.shield>0){const blocked=Math.min(this.p.shield,amount);this.p.shield-=blocked;amount-=blocked;}if(amount<=0)return;this.p.hp-=amount;this.p.clean=0;this.fx.push({x:this.p.x,y:this.p.y,text:`-${amount}`,color:'#ed8798',life:1});this.audio.sound('damage');this.haptic(25);if(e&&this.hasEffect('thorns'))this.hurtEnemy(e,Math.max(1,Math.round(amount*.3)));}
 skill(index){if(!this.canAct())return;const rank=this.p.skillRanks[index],skill=this.c.skills[index];if(!rank){this.log('Desbloquea esta habilidad en el árbol.');this.notify();return;}if(this.p.cooldowns[index]>0){this.log(`Recarga: ${this.p.cooldowns[index]} turnos.`);this.notify();return;}
 if(this.p.mp<skill.cost){this.log('No tienes suficiente energía.');this.notify();return;}if(this.p.statuses.stun||this.p.statuses.freeze){this.log('El vínculo está inmovilizado.');this.endTurn();return;}
 const kind=skill.kind,target=this.nearest(6+(this.hasEffect('range')?2:0)),mult=1.3+rank*.25;
 if(['bolt','burn','bleed','poison','drain'].includes(kind)&&!target){this.log('No hay objetivo visible al alcance.');this.notify();return;}
 this.p.mp-=skill.cost;this.p.cooldowns[index]=Math.max(1,skill.cooldown-Math.floor(rank/2))+1;
 if(['bolt','burn','bleed','poison','drain'].includes(kind)){const n=this.hit(target,mult,['burn','bleed','poison'].includes(kind)?kind:'',kind==='bolt');if(kind==='drain')this.p.hp=Math.min(this.stats().hp,this.p.hp+n*.5);}
 if(kind==='shield'){this.p.shield+=12+rank*5;this.status(this.p,'guard',4+rank);}
 if(kind==='sweep'||kind==='nova')for(const e of [...this.w.enemies])if(e.hp>0&&distance(e,this.p)<=(kind==='nova'?3:2))this.hit(e,mult,kind==='nova'?'burn':'');
 if(kind==='freeze')for(const e of this.w.enemies)if(e.hp>0&&distance(e,this.p)<=4)this.status(e,'freeze',2+rank,1);
 if(kind==='heal'){this.p.hp=Math.min(this.stats().hp,this.p.hp+12+rank*5);this.status(this.p,'regen',5,2+rank);}
 if(kind==='evade'){this.status(this.p,'evade',4+rank);delete this.p.statuses.weak;}
 if(kind==='blood'){this.p.hp=Math.max(1,this.p.hp-8);this.status(this.p,'empower',5+rank);}
 if(kind==='resource'){this.p.mp=Math.min(this.stats().resource,this.p.mp+12+rank*4);this.status(this.p,'empower',3);}
 if(kind==='summon')this.p.summon=7+rank*2;
 if(kind==='dash'){const dir=this.facing||{dx:0,dy:-1};for(let i=0;i<3;i++){const x=this.p.x+dir.dx,y=this.p.y+dir.dy;if(!isFloor(this.w,x,y))break;const e=this.w.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);if(e){this.hit(e,mult);break;}if(this.w.objects.some(o=>o.x===x&&o.y===y&&!o.used&&['npc','trap','door','exit','event'].includes(o.type)))break;this.p.x=x;this.p.y=y;this.metric('steps');}}
 this.log(skill.name);this.audio.sound('event');this.endTurn();
 }
 tickStatuses(entity,isPlayer){for(const [name,state] of Object.entries(entity.statuses)){
 if(['burn','poison','bleed'].includes(name)){let n=state.power;if(isPlayer){if(this.hasEffect(name))n*=.5;this.p.hp-=n;this.p.clean=0;}else{if(this.enemyDef(entity).resist===name)n*=.5;this.hurtEnemy(entity,Math.max(1,Math.round(n)));}}
 if(name==='regen')entity.hp=Math.min(isPlayer?this.stats().hp:entity.maxHp,entity.hp+state.power);state.turns--;if(state.turns<=0)delete entity.statuses[name];}}
 endTurn(){if(!this.run||this.run.over)return;this.busy=true;this.run.turn++;this.run.elapsed+=Math.min(30000,Date.now()-this.run.lastTime);this.run.lastTime=Date.now();
 const wasFrozen=!!(this.p.statuses.stun||this.p.statuses.freeze);this.tickStatuses(this.p,true);for(const k of Object.keys(this.p.cooldowns))this.p.cooldowns[k]=Math.max(0,this.p.cooldowns[k]-1);
 if(this.p.hp>0){const s=this.stats();this.p.hp=Math.min(s.hp,this.p.hp+s.regen);this.p.mp=Math.min(s.resource,this.p.mp+.6+(this.c.id==='Arcanist' ? .4 : 0));
 if(this.p.summon>0){const target=this.nearest(5);if(target)this.hurtEnemy(target,Math.round(s.attack*.7*(this.hasEffect('summon')?1.5:1)));this.p.summon--;}
 for(const e of [...this.w.enemies]){if(e.hp<=0)continue;const frozen=!!(e.statuses.freeze||e.statuses.stun);this.tickStatuses(e,false);if(e.hp<=0||frozen)continue;if(distance(e,this.p)>11)continue;const def=this.enemyDef(e);e.clock+=def.speed/s.speed;const actions=Math.min(2,Math.floor(e.clock));e.clock-=actions;for(let a=0;a<actions&&this.p.hp>0;a++)this.enemyAct(e);}
 }
 this.w.enemies=this.w.enemies.filter(e=>e.hp>0);this.w.objects=this.w.objects.filter(o=>!o.used||o.type==='event'||o.type==='chest'||o.type==='trap');if(this.p.hp>0)this.p.clean++;this.meta.stats.clean=Math.max(this.meta.stats.clean||0,this.p.clean);this.run.metrics.clean=Math.max(this.run.metrics.clean,this.p.clean);this.run.questProgress.clean=this.run.metrics.clean;this.markSeen();this.checkMeta();
 if(this.p.hp<=0)this.die();this.busy=false;this.notify();return !wasFrozen;
 }
 enemyAct(e){const d=this.enemyDef(e),dist=distance(e,this.p);e.turns++;
 if(e.boss){this.bossAct(e);return;}
 if(d.role==='support'&&e.turns%3===0){const ally=this.w.enemies.find(a=>a!==e&&a.hp>0&&a.hp<a.maxHp&&distance(a,e)<=5);if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+7+this.run.depth);return;}}
 if(d.role==='summoner'&&e.turns%5===0&&this.w.enemies.length<70){this.spawn(e);return;}
 if((d.role==='ranged'||d.role==='caster')&&dist<=2){if(this.enemyMove(e,true))return;}
 if(dist<=d.range&&lineClear(this.w,e,this.p)){this.enemyAttack(e);return;}
 if(d.role==='assassin'&&e.turns%3===0){this.enemyMove(e,false);if(distance(e,this.p)<=1)this.enemyAttack(e);return;}
 this.enemyMove(e,false);
 }
 enemyAttack(e,mult=1){const d=this.enemyDef(e);this.damagePlayer((d.attack+this.run.depth*.7)*mult*(e.statuses.weak ? .6 : 1),e);if(this.p.hp>0&&d.status&&this.random()<.23)this.status(this.p,d.status,3,2);}
 enemyMove(e,away){const blocked=new Set(this.w.enemies.filter(a=>a!==e&&a.hp>0).map(a=>key(a.x,a.y)));this.w.objects.filter(o=>!o.used&&o.type==='npc').forEach(o=>blocked.add(key(o.x,o.y)));
 if(away){const options=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:e.x+dx,y:e.y+dy})).filter(p=>isFloor(this.w,p.x,p.y)&&!blocked.has(key(p.x,p.y))&&distance(p,this.p)>distance(e,this.p)&&!this.w.objects.some(o=>o.type==='door'&&!o.open&&o.x===p.x&&o.y===p.y));if(options.length){Object.assign(e,options[Math.floor(this.random()*options.length)]);return true;}return false;}
 const step=pathStep(this.w,e,this.p,blocked);if(step&&distance(step,this.p)>0){e.x=step.x;e.y=step.y;return true;}return false;
 }
 spawn(e){for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=e.x+dx,y=e.y+dy;if(!isFloor(this.w,x,y)||this.w.enemies.some(a=>a.hp>0&&a.x===x&&a.y===y)||(x===this.p.x&&y===this.p.y))continue;const d=DATA.enemies[this.w.biome*5];const hp=Math.round(d.hp*(1+this.run.depth*.08));this.w.enemies.push({x,y,uid:this.w.nextId++,def:d.id,hp,maxHp:hp,statuses:{},clock:0,turns:0});break;}}
 bossAct(e){e.phase=e.hp<e.maxHp*.45?2:1;const dist=distance(e,this.p),phase=e.phase,b=this.w.biome;
 if(e.telegraph){const cells=e.telegraph;e.telegraph=null;if(cells.some(c=>c.x===this.p.x&&c.y===this.p.y)){this.enemyAttack(e,1.8);this.status(this.p,DATA.biomes[b].hazard,2,3);}return;}
 if(e.turns%Math.max(3,5-phase)===0){const cells=[];const reach=b===2||b===5?5:2+phase;for(let dy=-reach;dy<=reach;dy++)for(let dx=-reach;dx<=reach;dx++){
  let inside=false;if(b===0)inside=Math.abs(dx)+Math.abs(dy)<=reach;if(b===1)inside=(Math.abs(dx)===Math.abs(dy));if(b===2)inside=dx===0||dy===0;if(b===3)inside=Math.abs(dx)+Math.abs(dy)===reach;if(b===4)inside=Math.abs(dx)<=1||Math.abs(dy)<=1;if(b===5)inside=(Math.abs(dx)+Math.abs(dy))%2===0;
  const x=e.x+dx,y=e.y+dy;if(inside&&isFloor(this.w,x,y))cells.push({x,y});}
 e.telegraph=cells;this.log(`${this.enemyDef(e).name} prepara un ataque. ¡Sal de las casillas marcadas!`);if(phase===2&&[1,4,5].includes(b))this.spawn(e);this.haptic(20);return;
 }
 if(dist<=1)this.enemyAttack(e,phase===2?1.3:1);else this.enemyMove(e,false);
 }
 interact(){if(!this.canAct())return;const objs=this.w.objects.filter(o=>!o.used&&distance(this.p,o)<=1).sort((a,b)=>distance(this.p,a)-distance(this.p,b));const obj=objs.find(o=>['exit','npc','chest','event','loot','door'].includes(o.type));if(!obj){this.log('No hay nada con lo que interactuar.');this.notify();return;}
 if(obj.type==='npc'||obj.type==='event'){this.onInteract?.(obj);return;}
 if(obj.type==='door'){obj.open=true;this.endTurn();return;}
 if(obj.type==='chest'){obj.used=true;this.metric('chests');this.gold(8+this.run.depth*3);this.dropAt(obj,this.createItem(`i${Math.floor(this.random()*60)}`));this.pickup(this.w.objects.find(o=>o.type==='loot'&&!o.used&&o.x===obj.x&&o.y===obj.y));this.audio.sound('chest');this.endTurn();return;}
 if(obj.type==='loot'){this.pickup(obj);this.endTurn();return;}
 if(obj.type==='exit'){if(obj.locked){this.log('Derrota al guardián del sector para abrir el portal.');this.notify();return;}this.nextDepth(false);}
 }
 nextDepth(risk=false){this.run.depth+=risk?2:1;this.run.metrics.depth=this.run.depth;this.run.questProgress.depth=this.run.depth;this.meta.stats.depth=Math.max(this.meta.stats.depth||0,this.run.depth);this.w.enemies=[];this.run.world=generate(this.run.seed,this.run.depth);Object.assign(this.p,this.w.start);if(!this.run.zones.includes(this.w.biome))this.run.zones.push(this.w.biome);this.meta.stats.zones=Math.max(this.meta.stats.zones||0,this.run.zones.length);this.p.shield=this.hasEffect('shield')?12:0;this.log(`Sector ${this.run.depth}: ${DATA.biomes[this.w.biome].name}.`);this.markSeen();this.audio.sound('event');this.checkMeta();this.notify();}
 resolveEvent(obj,choice){if(obj.used||!this.canAct())return;obj.used=true;this.metric('events');const type=obj.event;
 if(type==='altar'){if(choice===0){this.p.hp=Math.max(1,this.p.hp-this.stats().hp*.2);this.gainXP(45);this.log('Tu sacrificio se transforma en conocimiento.');}else{this.p.mp=Math.min(this.stats().resource,this.p.mp+10);this.log('La grieta te presta energía.');}}
 if(type==='cursed'){const item=this.createItem(`i${Math.floor(this.random()*54)}`,choice===0?3:1);this.dropAt(obj,item);this.pickup(this.w.objects.find(o=>o.type==='loot'&&!o.used&&o.x===obj.x&&o.y===obj.y));if(choice===0){this.status(this.p,'weak',7);this.spawn({x:obj.x,y:obj.y});}}
 if(type==='shrine'){if(choice===0&&this.p.gold>=25){this.p.gold-=25;this.p.hp=this.stats().hp;}else this.p.hp=Math.min(this.stats().hp,this.p.hp+8);}
 if(type==='fork'){if(choice===0){this.log('Tomas la grieta peligrosa.');this.gold(35);this.nextDepth(true);return;}this.gold(12);this.log('La ruta segura ofrece un pequeño tesoro.');}
 if(type==='secret'){if(choice===0){this.meta.shards+=2;this.status(this.p,'bleed',4);}else this.gold(20);}
 if(type==='cache'){if(choice===0){this.dropAt(obj,this.createItem('i54',0));this.pickup(this.w.objects.find(o=>o.type==='loot'&&!o.used&&o.x===obj.x&&o.y===obj.y));}else this.gold(25);}
 if(type==='champion'){if(choice===0){const def=DATA.enemies[this.w.biome*5+2];let pos=null;for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const x=obj.x+dx,y=obj.y+dy;if(isFloor(this.w,x,y)&&!this.w.enemies.some(e=>e.x===x&&e.y===y)&&!(this.p.x===x&&this.p.y===y)){pos={x,y};break;}}if(pos){const hp=def.hp*2+this.run.depth*3;this.w.enemies.push({...pos,uid:this.w.nextId++,def:def.id,hp,maxHp:hp,statuses:{empower:{turns:10,power:1}},clock:0,turns:0});this.gold(45);}}else this.p.mp=Math.min(this.stats().resource,this.p.mp+5);}
 this.audio.sound('event');this.endTurn();
 }
 equip(uid){if(!this.canAct())return;const idx=this.p.inventory.findIndex(i=>i.uid===uid);if(idx<0)return;const item=this.p.inventory[idx],def=byId(item.base);if(def.slot==='consumable'){this.consume(uid);return;}this.p.inventory.splice(idx,1);const old=this.p.equipment[def.slot];this.p.equipment[def.slot]=item;if(old)this.p.inventory.push(old);this.metric('equips');this.cap();this.log(`Equipas ${def.name}.`);this.endTurn();}
 cap(){const s=this.stats();this.p.hp=Math.min(this.p.hp,s.hp);this.p.mp=Math.min(this.p.mp,s.resource);}
 consume(uid){if(!this.canAct())return;const i=this.p.inventory.findIndex(i=>i.uid===uid);if(i<0)return;const def=byId(this.p.inventory[i].base);if(def.slot!=='consumable')return;this.p.inventory.splice(i,1);const s=this.stats();
 if(def.effect==='heal')this.p.hp=Math.min(s.hp,this.p.hp+s.hp*.35);if(def.effect==='resource')this.p.mp=Math.min(s.resource,this.p.mp+s.resource*.6);if(def.effect==='cleanse')this.p.statuses={};if(def.effect==='regen')this.status(this.p,'regen',8,3);if(def.effect==='return')Object.assign(this.p,this.w.start);if(def.effect==='bomb')for(const e of [...this.w.enemies])if(distance(e,this.p)<=3)this.hurtEnemy(e,18+this.run.depth*2);this.log(`Usas ${def.name}.`);this.endTurn();}
 drop(uid){if(!this.canAct())return;const i=this.p.inventory.findIndex(i=>i.uid===uid);if(i<0)return;const item=this.p.inventory.splice(i,1)[0];this.dropAt(this.p,item);this.log('Dejas el objeto en el suelo.');this.endTurn();}
 sell(uid){if(!this.canAct())return;const i=this.p.inventory.findIndex(i=>i.uid===uid);if(i<0)return;const item=this.p.inventory.splice(i,1)[0];const n=Math.round(byId(item.base).price*DATA.rarities[item.rarity].mult*.4*(this.hasEffect('gold')?1.25:1));this.gold(n);this.log(`Vendes por ${n} oro.`);this.endTurn();}
 buy(base,price){if(!this.canAct())return;if(this.p.gold<price||this.p.inventory.length>=60){this.log('Oro insuficiente o mochila llena.');this.notify();return;}this.p.gold-=price;this.p.inventory.push(this.createItem(base,byId(base).slot==='consumable'?0:1));this.log('Compra realizada.');this.endTurn();}
 train(index){if(!this.canAct()||this.p.points<1||this.p.skillRanks[index]>=5)return;this.p.points--;this.p.skillRanks[index]++;this.metric('skills');this.log('Habilidad mejorada.');this.notify();}
 claimQuest(id){if(!this.canAct())return;const q=DATA.quests.find(q=>q.id===id);if(!q||this.run.claimed.includes(id)||(this.run.questProgress[q.metric]||0)<q.target)return;this.run.claimed.push(id);this.gold(q.gold);this.gainXP(q.xp);this.metric('quests');this.log(`Misión completada: ${q.name}.`);this.audio.sound('level');this.checkMeta();this.notify();}
 checkMeta(){for(const a of DATA.achievements){if(!this.meta.achievements.includes(a.id)&&(this.meta.stats[a.metric]||0)>=a.target){this.meta.achievements.push(a.id);this.meta.shards+=a.reward;this.log(`Logro: ${a.name}. +${a.reward} fragmentos.`);}}
 for(let i=0;i<DATA.classes.length;i++){if(!this.meta.unlocked.includes(i)&&(this.meta.stats.kills||0)>=DATA.classes[i].unlock){this.meta.unlocked.push(i);this.log(`Nueva clase: ${DATA.classes[i].id}.`);}}
 }
 die(){if(this.run.mode==='classic'&&this.run.revives>0){this.run.revives--;this.p.gold=Math.floor(this.p.gold*.5);this.p.hp=this.stats().hp*.55;this.p.statuses={};Object.assign(this.p,this.w.start);this.log('El ancla te devuelve a la entrada. Has perdido la mitad del oro. No quedan resurrecciones.');this.audio.sound('death');return;}
 this.run.over=true;this.p.hp=0;this.meta.stats.deaths=(this.meta.stats.deaths||0)+1;this.meta.shards+=Math.max(1,Math.floor(this.run.depth/2)+this.run.metrics.bosses*2);this.checkMeta();this.record();this.audio.sound('death');this.haptic([40,80,40]);this.onDeath?.();
 }
 record(){const r=this.run;if(r.recorded)return;r.recorded=true;this.meta.records.push({date:Date.now(),class:this.c.id,mode:r.mode,seed:r.seed,distance:r.metrics.steps,depth:r.depth,level:this.p.level,kills:r.metrics.kills,gold:r.metrics.goldEarned,bosses:r.metrics.bosses,duration:Math.round(r.elapsed/1000)});this.meta.records.sort((a,b)=>b.depth-a.depth||b.distance-a.distance);this.meta.records=this.meta.records.slice(0,30);}
 abandon(){if(!this.run||this.run.over)return;this.run.revives=0;this.die();this.notify();}
}
export {byId};
