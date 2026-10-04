export function bindInput(game,ui,renderer){
 let last=0,repeat=null,activePointer=null;const allowed=()=>ui.screen==='play'&&!ui.dialog.open&&!game.run?.over;
 function stop(){clearInterval(repeat);repeat=null;activePointer=null;}
 function move(dx,dy){if(!allowed()||renderer.map)return;const now=performance.now();if(now-last<145)return;last=now;game.move(dx,dy);}
 document.querySelectorAll('[data-move]').forEach(button=>{
  const [dx,dy]=button.dataset.move.split(',').map(Number);
  button.addEventListener('pointerdown',event=>{if(activePointer!==null)return;event.preventDefault();ui.g.audio.unlock();activePointer=event.pointerId;button.setPointerCapture(event.pointerId);move(dx,dy);repeat=setInterval(()=>move(dx,dy),210);});
  button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
 });
 document.addEventListener('pointerup',stop);window.addEventListener('blur',stop);document.addEventListener('visibilitychange',()=>{stop();if(document.hidden)ui.save();});
 document.addEventListener('click',event=>{
  const skill=event.target.closest('[data-skill]');if(skill&&allowed()){renderer.map=false;game.skill(Number(skill.dataset.skill));return;}
  const menu=event.target.closest('[data-ui]');if(menu){stop();switch(menu.dataset.ui){case 'inventory':ui.inventory();break;case 'skills':ui.skills();break;case 'quests':ui.quests();break;case 'map':renderer.map=!renderer.map;break;case 'pause':ui.pause();break;}return;}
  const action=event.target.closest('[data-action]');if(!action||!allowed())return;ui.g.audio.unlock();renderer.map=false;switch(action.dataset.action){case 'wait':game.wait();break;case 'attack':game.attack();break;case 'interact':game.interact();break;case 'heal':{const item=game.p.inventory.find(i=>i.base==='i54');if(item)game.consume(item.uid);else{game.log('No tienes un tónico carmesí.');game.notify();}break;}}
 });
 const dirs={w:[0,-1],ArrowUp:[0,-1],s:[0,1],ArrowDown:[0,1],a:[-1,0],ArrowLeft:[-1,0],d:[1,0],ArrowRight:[1,0]};
 document.addEventListener('keydown',event=>{if(['INPUT','SELECT','TEXTAREA'].includes(event.target.tagName))return;if(event.key==='Escape'){stop();if(ui.dialog.open)return;if(ui.screen==='play')ui.pause();return;}if(!allowed())return;const k=event.key.length===1?event.key.toLowerCase():event.key;const dir=dirs[k];if(dir){event.preventDefault();move(...dir);return;}if(event.repeat)return;
 switch(k){case ' ':event.preventDefault();game.attack();break;case 'e':game.interact();break;case 'q':game.wait();break;case 'i':ui.inventory();break;case 'k':ui.skills();break;case 'm':renderer.map=!renderer.map;break;case '1':case '2':case '3':game.skill(Number(k)-1);break;}
 });
 // Optional single-finger swipe on the world; pointer events unify touch/mouse and cancellation.
 const canvas=document.querySelector('#world');let swipe=null;
 canvas.addEventListener('pointerdown',e=>{if(!allowed())return;swipe={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointerup',e=>{if(!swipe||swipe.id!==e.pointerId)return;const dx=e.clientX-swipe.x,dy=e.clientY-swipe.y;swipe=null;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;move(...(Math.abs(dx)>Math.abs(dy)?[Math.sign(dx),0]:[0,Math.sign(dy)]));});
 canvas.addEventListener('pointercancel',()=>swipe=null);
}
