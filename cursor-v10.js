'use strict';
/* Small, high-contrast four-point cursor twinkles. Separate canvas is
   pointer-events:none; it can be seen on glass cards without blocking UI. */
(()=>{
 const canvas=document.getElementById('cursor-sparkles');
 if(!canvas || !matchMedia('(pointer:fine) and (hover:hover)').matches)return;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 let W=0,H=0,dpr=1,prev=null,particles=[],raf=0,last=0;
 const MAX=52, colors=['#20436c','#f3735e','#ffffff','#367bb0','#80dbe8'];
 const enabled=()=>!reduce.matches&&!document.documentElement.classList.contains('motion-off')&&!document.hidden;
 function size(){W=window.innerWidth;H=window.innerHeight;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
 size();window.addEventListener('resize',size,{passive:true});
 function add(x,y,large=false){
   if(particles.length>=MAX)particles.shift();
   const a=Math.random()*Math.PI*2;
   particles.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*12,vx:Math.cos(a)*(.15+Math.random()*.28),vy:Math.sin(a)*(.15+Math.random()*.3)-.2,life:0,max:350+Math.random()*360,r:large?3.1+Math.random()*2.1:1.7+Math.random()*1.4,rot:Math.random()*6.28,col:colors[Math.floor(Math.random()*colors.length)]});
 }
 function star(p,alpha){
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
   const r=p.r;
   ctx.shadowBlur=7;ctx.shadowColor=p.col;
   ctx.strokeStyle='rgba(21,49,79,'+(alpha*.43).toFixed(3)+')';ctx.lineWidth=.7;
   ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.19,-r*.19);ctx.lineTo(r,0);ctx.lineTo(r*.19,r*.19);ctx.lineTo(0,r);ctx.lineTo(-r*.19,r*.19);ctx.lineTo(-r,0);ctx.lineTo(-r*.19,-r*.19);ctx.closePath();
   ctx.fillStyle=p.col==='#ffffff'?`rgba(255,255,255,${alpha})`:p.col;ctx.globalAlpha=alpha;
   ctx.fill();ctx.stroke();ctx.restore();
 }
 function tick(now){raf=0;let dt=Math.min(36,last?now-last:16);last=now;ctx.clearRect(0,0,W,H);
   if(!enabled()){particles=[];prev=null;last=0;return;}
   particles=particles.filter(p=>p.life<p.max);
   for(const p of particles){p.life+=dt;p.x+=p.vx*dt*.045;p.y+=p.vy*dt*.045;p.rot+=dt*.0008;
     const progress=p.life/p.max;star(p,Math.pow(1-progress,1.5)*Math.min(1,p.life/48));}
   if(particles.length)raf=requestAnimationFrame(tick);else last=0;
 }
 function kick(){if(!raf)raf=requestAnimationFrame(tick);}
 window.addEventListener('pointermove',e=>{
   if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
   if(!enabled()){prev=null;return;}
   const pt={x:e.clientX,y:e.clientY};
   if(prev){const dx=pt.x-prev.x,dy=pt.y-prev.y,d=Math.hypot(dx,dy);
     if(d>5){const count=Math.min(4,Math.floor(d/18)+1);
       for(let i=1;i<=count;i++)add(prev.x+dx*(i/(count+1)),prev.y+dy*(i/(count+1)),i===count);
       kick();
     }
   }else{add(pt.x,pt.y,true);kick();}
   prev=pt;
 },{passive:true});
 window.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&enabled()){for(let i=0;i<7;i++)add(e.clientX,e.clientY,i%2===0);kick();}},{passive:true});
 document.addEventListener('pointerleave',()=>{prev=null;},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});
})();
