export class Audio{
 constructor(settings){this.settings=settings;this.mode='menu';this.beat=0;this.timer=null;}
 unlock(){if(!this.ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);this.timer=setInterval(()=>this.tick(),280);}this.master.gain.value=this.settings.volume;this.ctx.resume();}
 tone(freq,duration=.1,type='square',vol=.08,delay=0){if(!this.ctx||this.ctx.state!=='running')return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),t=this.ctx.currentTime+delay;o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration);}
 sound(name){if(!this.settings.sfx)return;const notes={attack:[190,130],damage:[110,75],death:[170,120,70],loot:[620,820],chest:[330,440,660],level:[440,550,660,880],event:[280,420,560],button:[350]};(notes[name]||notes.button).forEach((n,i)=>this.tone(n,.12,'square',.07,i*.08));}
 tick(){if(!this.settings.music||document.hidden||!this.ctx||this.ctx.state!=='running')return;const melodies={menu:[0,7,12,7,3,10,15,10],boss:[0,1,7,6,0,8,7,1],0:[0,7,10,12,7,3,10,5],1:[0,3,7,10,3,6,7,3],2:[0,4,7,12,9,7,4,7],3:[0,2,7,9,14,9,7,2],4:[0,3,6,7,10,7,6,3],5:[0,1,6,8,13,8,6,1]};const seq=melodies[this.mode]||melodies.menu;const n=seq[this.beat%8],base=this.mode==='boss'?98:146.83;this.tone(base*2**(n/12),.35,'triangle',.035);if(this.beat%4===0)this.tone(base/2,.7,'sine',.07);this.beat++;}
 update(){if(this.master)this.master.gain.value=this.settings.volume;}
 pause(){this.ctx?.suspend();}
}
