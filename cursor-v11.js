"use strict";
/* V11 — restrained, bounded cursor twinkles. Single canvas, single RAF loop.
   A screen-space particle is never allowed to leap across the viewport. */
(()=>{
 const canvas=document.getElementById('cursor-sparkles');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 if(!canvas||!fine.matches)return;
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 let w=innerWidth,h=innerHeight,dpr=1,particles=[],raf=0,lastFrame=0,lastMove=null;
 const MAX=26;
 const palette=['#f26d5b','#195a90','#ffffff','#96efff'];
 const enabled=()=>!document.hidden&&!reduce.matches&&!document.documentElement.classList.contains('motion-off');
 const reset=()=>{
   particles.length=0;lastMove=null;lastFrame=0;
   if(raf)cancelAnimationFrame(raf);raf=0;
   ctx.clearRect(0,0,w,h);
 };
 function resize(){
   w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,2);
   canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
   ctx.setTransform(dpr,0,0,dpr,0,0);reset();
 }
 function spawn(x,y){
   if(particles.length>=MAX)particles.shift();
   const a=Math.random()*Math.PI*2;
   particles.push({x:x+(Math.random()-.5)*12,y:y+(Math.random()-.5)*12,
     vx:Math.cos(a)*(.04+Math.random()*.10),vy:Math.sin(a)*(.04+Math.random()*.10)-.035,
     t:0,life:250+Math.random()*180,
     size:1.7+Math.random()*2.4,
     color:palette[Math.floor(Math.random()*palette.length)]});
 }
 function draw(p,alpha){
   const r=p.size;
   ctx.save();ctx.translate(p.x,p.y);
   ctx.globalAlpha=alpha;
   ctx.fillStyle=p.color;
   ctx.shadowColor=p.color;ctx.shadowBlur=4;
   ctx.beginPath();
   ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.12,-r*.12,r,0);
   ctx.quadraticCurveTo(r*.12,r*.12,0,r);
   ctx.quadraticCurveTo(-r*.12,r*.12,-r,0);
   ctx.quadraticCurveTo(-r*.12,-r*.12,0,-r);
   ctx.fill();ctx.restore();
 }
 function frame(ts){
   raf=0;
   if(!enabled()){reset();return;}
   const dt=Math.min(34,lastFrame?ts-lastFrame:16);lastFrame=ts;
   ctx.clearRect(0,0,w,h);
   for(let i=particles.length-1;i>=0;i--){
     const p=particles[i];p.t+=dt;
     if(p.t>=p.life){particles.splice(i,1);continue;}
     p.x+=p.vx*dt;p.y+=p.vy*dt;
     const life=p.t/p.life;
     draw(p,Math.min(1,p.t/75)*Math.pow(1-life,1.7)*.93);
   }
   if(particles.length)raf=requestAnimationFrame(frame);
   else lastFrame=0;
 }
 document.addEventListener('pointermove',e=>{
   if(!enabled() || (e.pointerType!=='mouse'&&e.pointerType!=='pen')){reset();return;}
   const now=performance.now();
   const p={x:e.clientX,y:e.clientY,t:now};
   if(lastMove){
     const dist=Math.hypot(p.x-lastMove.x,p.y-lastMove.y);
     const gap=now-lastMove.t;
     // Ignore browser jump, fast motion and reentry: don't spray a long line.
     if(gap>100 || dist>75){particles.length=0;}
     else if(dist>4 && gap>0){
       spawn(p.x,p.y);
       if(dist>24 && particles.length<MAX)spawn(p.x-4,p.y+2);
       if(!raf)raf=requestAnimationFrame(frame);
     }
   }
   lastMove=p;
 },{passive:true});
 window.addEventListener('resize',resize,{passive:true});
 window.addEventListener('scroll',reset,{passive:true});
 window.addEventListener('blur',reset);
 window.addEventListener('pointerleave',reset,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)reset();});
 document.getElementById('motion-switch')?.addEventListener('click',()=>{if(!enabled())reset();});
 resize();
})();
