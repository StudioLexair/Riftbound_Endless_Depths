import {rng,hash,key} from '../core/random.js';
import {DATA} from '../../data/content.js';
export const SIZE=36;
export function generate(seed,depth){
 const random=rng(hash(`${seed}:${depth}`));const biome=(depth-1)%6;
 const tiles=Array.from({length:SIZE},()=>Array(SIZE).fill(0));const rooms=[];
 const carve=(x,y)=>{if(x>0&&y>0&&x<SIZE-1&&y<SIZE-1)tiles[y][x]=1;};
 // Connected pieces with variable chamber geometry; any chamber remains reachable.
 for(let j=0;j<3;j++)for(let i=0;i<3;i++){
  const w=6+Math.floor(random()*5),h=6+Math.floor(random()*5);
  const x=2+i*11+Math.floor(random()*2),y=2+j*11+Math.floor(random()*2);
  const shape=Math.floor(random()*4);
  for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++){
   if(shape===1&&((dx===0||dx===w-1)&&(dy===0||dy===h-1)))continue;
   if(shape===2&&((dx<2||dx>w-3)&&(dy<2||dy>h-3)))continue;
   carve(x+dx,y+dy);
  }
  const c={x:x+Math.floor(w/2),y:y+Math.floor(h/2)};
  rooms.push({x,y,w,h,c,shape});
  if(rooms.length>1){const p=rooms[rooms.length-2].c;let xx=p.x,yy=p.y;
   if(random()<.5){while(xx!==c.x){carve(xx,yy);xx+=Math.sign(c.x-xx);}while(yy!==c.y){carve(xx,yy);yy+=Math.sign(c.y-yy);}}
   else{while(yy!==c.y){carve(xx,yy);yy+=Math.sign(c.y-yy);}while(xx!==c.x){carve(xx,yy);xx+=Math.sign(c.x-xx);}}carve(c.x,c.y);
  }
 }
 // Additional cross-connectors prevent a single linear repeated route.
 for(let i=0;i<3;i++){const a=rooms[i].c,b=rooms[i+3].c;for(let y=a.y;y<=b.y;y++)carve(a.x,y);for(let x=Math.min(a.x,b.x);x<=Math.max(a.x,b.x);x++)carve(x,b.y);}
 const start={...rooms[0].c},exit={...rooms[8].c};
 const objects=[{...exit,type:'exit',locked:true},{x:start.x+1,y:start.y,type:'npc',npc:'merchant'},{x:start.x,y:start.y+1,type:'npc',npc:['healer','smith','trainer','story','secret'][depth%5]}];
 const occupied=new Set([key(start.x,start.y),...objects.map(o=>key(o.x,o.y))]);
 function place(room){for(let k=0;k<80;k++){const x=room.x+Math.floor(random()*room.w),y=room.y+Math.floor(random()*room.h);if(tiles[y]?.[x]===1&&!occupied.has(key(x,y))){occupied.add(key(x,y));return {x,y};}}return null;}
 const enemies=[];let eid=0;
 for(let r=1;r<9;r++){
  const room=rooms[r];const count=2+Math.floor(random()*3);
  for(let n=0;n<count;n++){const p=place(room);if(!p)continue;const def=DATA.enemies[biome*5+Math.floor(random()*5)];const scale=1+(depth-1)*.09;enemies.push({...p,uid:++eid,def:def.id,hp:Math.round(def.hp*scale),maxHp:Math.round(def.hp*scale),statuses:{},clock:0,turns:0});}
  for(const type of ['chest','trap',...(r%2===0?['event']:[])]){const p=place(room);if(p)objects.push({...p,type,event:['altar','cursed','shrine','fork','secret','cache','champion'][Math.floor(random()*7)],used:false});}
  if(random()<.5){const p=place(room);if(p)objects.push({...p,type:'door',open:false});}
 }
 const bp=place(rooms[8]);const boss=DATA.bosses[biome];const scale=1+(depth-1)*.1;
 if(bp)enemies.push({...bp,uid:++eid,def:boss.id,hp:Math.round(boss.hp*scale),maxHp:Math.round(boss.hp*scale),statuses:{},clock:0,turns:0,boss:true,phase:1});
 // Room geometry, object placement and biome-specific walls are persisted as one active streamed sector.
 return {depth,biome,tiles,rooms,start,exit,objects,enemies,seen:[],bossDead:false,nextId:eid+1};
}
export function isFloor(world,x,y){return world.tiles[y]?.[x]===1;}
export function lineClear(world,a,b){let x=a.x,y=a.y;const dx=Math.abs(b.x-x),sx=x<b.x?1:-1,dy=-Math.abs(b.y-y),sy=y<b.y?1:-1;let err=dx+dy;
 while(x!==b.x||y!==b.y){const e=2*err;if(e>=dy){err+=dy;x+=sx;}if(e<=dx){err+=dx;y+=sy;}if(!isFloor(world,x,y))return false;if(world.objects.some(o=>o.type==='door'&&!o.open&&o.x===x&&o.y===y))return false;}return true;
}
export function pathStep(world,enemy,target,blocked){
 const queue=[{x:enemy.x,y:enemy.y,first:null}],visited=new Set([key(enemy.x,enemy.y)]);
 for(let i=0;i<queue.length&&i<400;i++){const node=queue[i];for(const [dx,dy] of [[0,-1],[1,0],[0,1],[-1,0]]){const x=node.x+dx,y=node.y+dy,k=key(x,y);if(visited.has(k)||!isFloor(world,x,y))continue;
  if(x===target.x&&y===target.y)return node.first||{x,y};
  if(blocked.has(k)||world.objects.some(o=>o.type==='door'&&!o.open&&o.x===x&&o.y===y))continue;
  visited.add(k);queue.push({x,y,first:node.first||{x,y}});
 }}return null;
}
