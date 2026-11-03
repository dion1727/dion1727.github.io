'use strict';
/* Independent, physically-interactive sphere playground. No third-party code. */
(()=>{
  const canvas=document.getElementById('orbit-canvas');
  if(!canvas)return;
  const stage=canvas.parentElement;
  const ctx=canvas.getContext('2d',{alpha:true});
  if(!ctx)return;
  const gravityButton=document.getElementById('orbit-gravity');
  const addButton=document.getElementById('orbit-add');
  const resetButton=document.getElementById('orbit-reset');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  let W=450,H=300,pxRatio=1,gravity=false,drag=null,balls=[],raf=0,last=0,inView=false;
  const colors=['#f47b65','#66b5dc','#8bd2b0','#f7cb78','#7c9cdb','#78c4d6','#d2a8e2','#f7a7af'];
  let nextColor=0;
  const rnd=(min,max)=>min+Math.random()*(max-min);
  function create(x,y,r){
    if(balls.length>=19)balls.shift();
    const radius=r||rnd(16,Math.min(32,W/13));
    balls.push({x:Math.min(W-radius,Math.max(radius,x)),y:Math.min(H-radius,Math.max(radius,y)),r:radius,vx:rnd(-1.9,1.9),vy:rnd(-1.7,1.7),color:colors[nextColor++%colors.length]});
    request();
  }
  function reset(){
    balls=[];nextColor=0;
    const count=Math.min(9,Math.max(5,Math.floor(W/65)));
    for(let i=0;i<count;i++){
      const x=(i+.6)/count*W;
      const y=H*(.35+.22*Math.sin(i*2.1));
      create(x,y,Math.min(18+((i*7)%12),W/14));
    }
    draw();request();
  }
  function resize(){
    const oldW=W,oldH=H;
    W=Math.max(200,stage.clientWidth);H=Math.max(190,stage.clientHeight);
    pxRatio=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(W*pxRatio);canvas.height=Math.round(H*pxRatio);
    ctx.setTransform(pxRatio,0,0,pxRatio,0,0);
    if(balls.length){for(const b of balls){b.x=Math.max(b.r,Math.min(W-b.r,b.x*W/oldW));b.y=Math.max(b.r,Math.min(H-b.r,b.y*H/oldH));}}else reset();
    draw();
  }
  function draw(){
    ctx.clearRect(0,0,W,H);
    for(const b of balls){
      const shadow=ctx.createRadialGradient(b.x+b.r*.2,b.y+b.r*.34,b.r*.15,b.x+b.r*.12,b.y+b.r*.28,b.r*1.65);
      shadow.addColorStop(0,'rgba(40,85,130,.14)');shadow.addColorStop(1,'rgba(40,85,130,0)');
      ctx.fillStyle=shadow;ctx.beginPath();ctx.arc(b.x,b.y+b.r*.26,b.r*1.65,0,Math.PI*2);ctx.fill();
      const gradient=ctx.createRadialGradient(b.x-b.r*.45,b.y-b.r*.5,1,b.x,b.y,b.r*1.15);
      gradient.addColorStop(0,'#ffffff');gradient.addColorStop(.15,b.color);gradient.addColorStop(1,'#315d80');
      ctx.shadowColor='rgba(37,78,112,.22)';ctx.shadowBlur=12;
      ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=1;ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.56)';ctx.beginPath();ctx.ellipse(b.x-b.r*.34,b.y-b.r*.38,b.r*.22,b.r*.1,-.6,0,Math.PI*2);ctx.fill();
    }
  }
  function step(dt){
    const frame=Math.min(2.3,dt/16.667);
    for(const b of balls){
      if(drag?.ball===b)continue;
      if(gravity)b.vy+=.17*frame;
      else{b.vx+=Math.sin(performance.now()*.0004+b.r)*.004*frame;b.vy+=Math.cos(performance.now()*.0004+b.r)*.004*frame;}
      b.vx*=gravity?.996:.999;b.vy*=gravity?.996:.999;
      b.x+=b.vx*frame;b.y+=b.vy*frame;
      if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.92;}
      if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.92;}
      if(b.y<b.r){b.y=b.r;b.vy=Math.abs(b.vy)*.92;}
      if(b.y>H-b.r){b.y=H-b.r;b.vy=-Math.abs(b.vy)*.87;b.vx*=.992;}
    }
    for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
      const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,dist=Math.hypot(dx,dy)||.001,min=a.r+b.r;
      if(dist>=min)continue;
      const nx=dx/dist,ny=dy/dist,overlap=min-dist;
      if(drag?.ball!==a){a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;}
      if(drag?.ball!==b){b.x+=nx*overlap*.5;b.y+=ny*overlap*.5;}
      const normal=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
      if(normal<0){const impulse=-(1+.83)*normal/2;
        if(drag?.ball!==a){a.vx-=impulse*nx;a.vy-=impulse*ny;}
        if(drag?.ball!==b){b.vx+=impulse*nx;b.vy+=impulse*ny;}
      }
    }
  }
  function animate(ts){raf=0;if(!inView||document.hidden){last=0;return;}
    const dt=Math.min(38,last?ts-last:16.667);last=ts;
    if(!reduced.matches&&!document.documentElement.classList.contains('motion-off'))step(dt);
    draw();request();
  }
  function request(){if(inView&&!raf)raf=requestAnimationFrame(animate);}
  function loc(e){const rect=canvas.getBoundingClientRect();return{x:(e.clientX-rect.left)*W/rect.width,y:(e.clientY-rect.top)*H/rect.height};}
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0 && e.pointerType==='mouse')return;
    const {x,y}=loc(e);
    let b=[...balls].reverse().find(b=>Math.hypot(b.x-x,b.y-y)<=b.r+5);
    if(!b){create(x,y);b=balls[balls.length-1];}
    drag={ball:b,pointer:e.pointerId,lastX:x,lastY:y,lastTime:performance.now()};
    b.x=x;b.y=y;b.vx=0;b.vy=0;
    canvas.setPointerCapture(e.pointerId);request();
  });
  canvas.addEventListener('pointermove',e=>{
    if(!drag||drag.pointer!==e.pointerId)return;
    const {x,y}=loc(e),b=drag.ball,dt=Math.max(8,performance.now()-drag.lastTime);
    b.vx=Math.max(-9,Math.min(9,(x-drag.lastX)*16/dt));b.vy=Math.max(-9,Math.min(9,(y-drag.lastY)*16/dt));
    b.x=Math.max(b.r,Math.min(W-b.r,x));b.y=Math.max(b.r,Math.min(H-b.r,y));
    drag.lastX=x;drag.lastY=y;drag.lastTime=performance.now();draw();
  });
  const release=e=>{if(drag&&drag.pointer===e.pointerId){drag=null;request();}};
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
  gravityButton?.addEventListener('click',()=>{
    gravity=!gravity;gravityButton.setAttribute('aria-pressed',String(gravity));gravityButton.textContent=gravity?'Gravity on':'Gravity off';
    if(gravity)balls.forEach(b=>b.vy-=1.6);
    request();
  });
  addButton?.addEventListener('click',()=>create(rnd(25,W-25),rnd(25,H-25)));
  resetButton?.addEventListener('click',reset);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView){last=0;request();}},{threshold:.04}).observe(stage);
  else inView=true;
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){last=0;request();}});
  resize();
})();
