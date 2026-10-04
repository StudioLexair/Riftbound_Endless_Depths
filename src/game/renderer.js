import {DATA} from '../../data/content.js';
import {key} from '../core/random.js';
import {lineClear} from '../world/generator.js';
export class Renderer{
 constructor(canvas,game){this.canvas=canvas;this.game=game;this.ctx=canvas.getContext('2d',{alpha:false});this.atlas=new Image();this.atlas.src='./assets/sprites/atlas.png';this.camera={x:0,y:0};this.map=false;this.time=0;this.last=0;this.resize();window.addEventListener('resize',()=>this.resize());requestAnimationFrame(t=>this.frame(t));}
 resize(){const b=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(192,Math.round(b.width/2));this.canvas.height=Math.max(160,Math.round(b.height/2));this.ctx.imageSmoothingEnabled=false;}
 sprite(id,x,y,size=16){if(!this.atlas.complete||!this.atlas.naturalWidth)return;this.ctx.drawImage(this.atlas,(id%16)*16,Math.floor(id/16)*16,16,16,Math.round(x),Math.round(y),size,size);}
 frame(t){if(document.hidden||t-this.last<(this.game.settings.quality==='low'?32:15)){requestAnimationFrame(tt=>this.frame(tt));return;}const dt=Math.min(.05,(t-this.last)/1000);this.last=t;this.time=t;this.draw(dt);requestAnimationFrame(tt=>this.frame(tt));}
 draw(dt){const c=this.ctx,W=this.canvas.width,H=this.canvas.height,g=this.game;c.fillStyle='#101722';c.fillRect(0,0,W,H);if(!g.run||g.run.over)return;
 const world=g.w,p=g.p,b=DATA.biomes[world.biome],tile=20;const seen=new Set(world.seen);
 if(this.map){const scale=Math.max(3,Math.floor(Math.min(W,H)/38)),ox=Math.floor((W-36*scale)/2),oy=Math.floor((H-36*scale)/2);for(let y=0;y<36;y++)for(let x=0;x<36;x++){if(!seen.has(key(x,y)))continue;c.fillStyle=world.tiles[y][x]?b.wall:'#192031';c.fillRect(ox+x*scale,oy+y*scale,scale-1,scale-1);}for(const o of world.objects){if(!seen.has(key(o.x,o.y))||o.used)continue;c.fillStyle=o.type==='exit'?'#ebc77f':o.type==='npc'?'#80d3be':'#ac8fa9';c.fillRect(ox+o.x*scale,oy+o.y*scale,scale,scale);}c.fillStyle='#ffffff';c.fillRect(ox+p.x*scale,oy+p.y*scale,scale,scale);c.fillStyle='#efe3c3';c.font='10px monospace';c.fillText('MAPA · vuelve a pulsar MAPA',8,15);return;}
 const targetX=p.x*tile+10,targetY=p.y*tile+10;
 if(!this.initialized||Math.abs(this.camera.x-targetX)>120||Math.abs(this.camera.y-targetY)>120){this.camera={x:targetX,y:targetY};this.initialized=true;}
 const blend=g.settings.reduced?1:Math.min(1,dt*14);this.camera.x+=(targetX-this.camera.x)*blend;this.camera.y+=(targetY-this.camera.y)*blend;
 const ox=Math.round(W/2-this.camera.x),oy=Math.round(H/2-this.camera.y);const minX=Math.max(0,Math.floor(-ox/tile)-1),maxX=Math.min(35,Math.ceil((W-ox)/tile)),minY=Math.max(0,Math.floor(-oy/tile)-1),maxY=Math.min(35,Math.ceil((H-oy)/tile));
 const visible=(x,y)=>Math.hypot(x-p.x,y-p.y)<7.5&&lineClear(world,p,{x,y});
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){if(!seen.has(key(x,y)))continue;const px=ox+x*tile,py=oy+y*tile;if(world.tiles[y][x]){c.fillStyle=b.floor;c.fillRect(px,py,tile,tile);c.fillStyle=b.wall+'55';const n=(Math.imul(x+2,71)+y*139)%17;c.fillRect(px+3+n%11,py+4+n%9,2,1);if(world.biome===2){c.strokeStyle='#79654955';c.strokeRect(px,py,tile,tile);}if(world.biome===5){c.fillStyle='#8058a33c';c.fillRect(px+4,py+4,2,2);}}
 else this.wall(px,py,x,y,b);
 if(!visible(x,y)){c.fillStyle='#070c18b0';c.fillRect(px,py,tile,tile);}}
 for(const o of world.objects){if(o.used||!visible(o.x,o.y))continue;this.object(o,ox+o.x*tile,oy+o.y*tile,b);}
 for(const e of world.enemies){if(e.hp<=0||!visible(e.x,e.y))continue;if(e.telegraph){for(const cell of e.telegraph){if(!visible(cell.x,cell.y))continue;c.fillStyle=Math.floor(this.time/200)%2?'#ef819766':'#ef8197aa';c.fillRect(ox+cell.x*tile+1,oy+cell.y*tile+1,18,18);c.strokeStyle='#ffe2ac';c.strokeRect(ox+cell.x*tile+3,oy+cell.y*tile+3,14,14);}}
 const d=g.enemyDef(e),px=ox+e.x*tile,py=oy+e.y*tile;c.fillStyle='#06091177';c.fillRect(px+4,py+15,13,3);this.sprite(d.sprite,px+(e.boss?-2:2),py+(e.boss?-4:1),e.boss?24:16);c.fillStyle='#29232e';c.fillRect(px,py-4,20,2);c.fillStyle=e.boss?'#edba79':'#e77e8e';c.fillRect(px,py-4,20*e.hp/e.maxHp,2);if(Object.keys(e.statuses).length){c.fillStyle='#9bbff1';c.fillRect(px+18,py,2,2);}}
 const px=ox+p.x*tile,py=oy+p.y*tile;c.fillStyle='#05081188';c.fillRect(px+3,py+15,14,3);this.sprite(g.c.sprite,px+2,py);if(p.shield>0){c.strokeStyle='#91cce5';c.strokeRect(px,py-1,19,19);}if(p.summon>0){c.globalAlpha=.7;this.sprite(48,px-13,py+5);c.globalAlpha=1;}
 for(const f of g.fx){f.life-=dt;if(g.settings.reduced)continue;c.globalAlpha=Math.max(0,f.life);c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#10131d';c.fillText(f.text,ox+f.x*tile+11,oy+f.y*tile-6-(1-f.life)*14);c.fillStyle=f.color;c.fillText(f.text,ox+f.x*tile+10,oy+f.y*tile-7-(1-f.life)*14);}c.globalAlpha=1;c.textAlign='left';g.fx=g.fx.filter(f=>f.life>0);
 c.fillStyle='#a2c3c5';c.font='8px monospace';c.fillText(`SECTOR ${g.run.depth} · ${b.name.toUpperCase()}`,5,10);
 }
 wall(px,py,x,y,b){const c=this.ctx;c.fillStyle='#151b26';c.fillRect(px,py,20,20);c.fillStyle=b.wall;
 switch(b.shape){case 'tree':c.fillStyle='#735a45';c.fillRect(px+8,py+10,4,9);c.fillStyle=b.wall;c.fillRect(px+3,py+5,14,10);c.fillRect(px+6,py+1,8,15);c.fillStyle='#7daa6e';c.fillRect(px+7,py+3,4,2);break;
 case 'tomb':c.fillRect(px+3,py+4,14,15);c.fillStyle='#888598';c.fillRect(px+5,py+2,10,3);c.fillStyle='#393448';c.fillRect(px+9,py+6,2,8);c.fillRect(px+6,py+8,8,2);break;
 case 'pillar':c.fillRect(px+5,py+2,10,17);c.fillRect(px+2,py+1,16,3);c.fillRect(px+2,py+17,16,3);c.fillStyle='#c3ad7d';c.fillRect(px+7,py+5,2,10);break;
 case 'crystal':c.beginPath();c.moveTo(px+10,py+1);c.lineTo(px+18,py+16);c.lineTo(px+4,py+19);c.lineTo(px+2,py+9);c.fill();c.fillStyle='#86b9d6';c.fillRect(px+8,py+6,2,9);break;
 case 'brick':c.fillRect(px,py+1,20,19);c.fillStyle='#4c333c';c.fillRect(px,py+9,20,2);c.fillRect(px+9,py,2,10);c.fillRect(px+4,py+10,2,10);break;
 default:c.fillRect(px+3,py+3,14,14);c.fillStyle='#b48dd0';c.fillRect(px+6,py+5,3,2);c.fillStyle='#191728';c.fillRect(px+8,py+8,7,7);}
 }
 object(o,x,y,b){const c=this.ctx;if(o.type==='npc'){this.sprite(43+['merchant','smith','trainer','story','healer','secret'].indexOf(o.npc),x+2,y);return;}
 if(o.type==='loot'){const id=DATA.items.find(i=>i.id===o.items[0]?.base)?.sprite;if(id!==undefined)this.sprite(id,x+2,y+2);return;}
 if(o.type==='chest'){c.fillStyle='#805e41';c.fillRect(x+3,y+6,14,10);c.fillStyle='#c9a466';c.fillRect(x+3,y+5,14,3);c.fillRect(x+9,y+8,3,5);return;}
 if(o.type==='door'){if(o.open){c.fillStyle='#998067';c.fillRect(x+1,y+2,3,16);}else{c.fillStyle='#9c7755';c.fillRect(x+2,y+1,16,18);c.fillStyle='#4a3940';c.fillRect(x+6,y+2,2,16);c.fillStyle='#e8cf87';c.fillRect(x+13,y+10,2,2);}return;}
 if(o.type==='trap'){c.fillStyle='#d59b91';for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+3+i*5,y+15);c.lineTo(x+5+i*5,y+8);c.lineTo(x+7+i*5,y+15);c.fill();}return;}
 if(o.type==='exit'){c.strokeStyle=o.locked?'#77596f':'#7ddcc9';c.lineWidth=2;c.strokeRect(x+3,y+1,14,18);c.fillStyle=o.locked?'#38283c':'#519f9977';c.fillRect(x+5,y+4,10,13);return;}
 if(o.type==='event'){c.fillStyle=b.wall;c.fillRect(x+3,y+13,14,4);c.fillRect(x+6,y+6,8,8);c.fillStyle='#efd595';c.fillRect(x+8,y+3,4,7);c.fillStyle='#fff2c8';c.fillRect(x+9,y+1,2,2);}
 }
}
