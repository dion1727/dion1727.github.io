"use strict";
/* Lightweight progressive enhancement for the original Skybound website. */
(() => {
  const rail = document.getElementById('project-rail');
  const slides = [...document.querySelectorAll('.project-slide')];
  const dots = [...document.querySelectorAll('#project-dots button')];
  const counter = document.getElementById('work-counter');
  const next = document.getElementById('work-next');
  const prev = document.getElementById('work-prev');
  if (!rail || !slides.length) return;
  const motionOff = () => document.documentElement.classList.contains('motion-off') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  let active = 0;
  let pointer = null;
  let raf = 0;
  const position = (slide) => slide.offsetLeft - rail.offsetLeft - (rail.clientWidth - slide.offsetWidth) / 2;
  const setActive = index => {
    active = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((el,i) => el.classList.toggle('is-active',i===active));
    dots.forEach((dot,i) => {
      dot.classList.toggle('active',i===active);
      dot.setAttribute('aria-pressed', String(i===active));
    });
    if (counter) counter.textContent = String(active + 1).padStart(2,'0') + ' / ' + String(slides.length).padStart(2,'0');
  };
  function go(index) {
    const i=(index+slides.length)%slides.length;
    setActive(i);
    rail.scrollTo({ left: position(slides[i]), behavior: motionOff() ? 'instant' : 'smooth' });
  }
  const sync = () => {
    raf=0;
    const center = rail.scrollLeft + rail.clientWidth / 2;
    let best=0, distance=Infinity;
    slides.forEach((el,i)=>{
      const midpoint=el.offsetLeft-rail.offsetLeft+el.clientWidth/2;
      const d=Math.abs(center-midpoint);
      if(d<distance){distance=d;best=i;}
    });
    setActive(best);
  };
  rail.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(sync)},{passive:true});
  next?.addEventListener('click',()=>go(active+1));
  prev?.addEventListener('click',()=>go(active-1));
  dots.forEach((el,i)=>el.addEventListener('click',()=>go(i)));
  rail.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){e.preventDefault();go(active+1)}
    if(e.key==='ArrowLeft'){e.preventDefault();go(active-1)}
  });
  rail.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch'||e.button!==0||e.target.closest('a,button'))return;
    pointer={x:e.clientX,start:rail.scrollLeft,moved:false};
    rail.classList.add('dragging');
  });
  document.addEventListener('pointermove',e=>{
    if(!pointer)return;
    const delta=e.clientX-pointer.x;
    if(Math.abs(delta)>5)pointer.moved=true;
    rail.scrollLeft=pointer.start-delta;
  },{passive:true});
  const finishDrag=()=>{
    if(!pointer)return;
    const wasDragged=pointer.moved;
    pointer=null;
    rail.classList.remove('dragging');
    if(wasDragged){setTimeout(()=>go(active),45)}
  };
  document.addEventListener('pointerup',finishDrag);
  document.addEventListener('pointercancel',finishDrag);
  addEventListener('resize',()=>{sync();rail.scrollTo({left:position(slides[active]),behavior:'instant'})},{passive:true});
  requestAnimationFrame(()=>go(0));

  // Header remains readable; active navigation follows the current section.
  const links=[...document.querySelectorAll('.topbar nav a[href^="#"]')];
  const sections=links.map(a=>document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if('IntersectionObserver' in window){
    const menuObserver=new IntersectionObserver(entries=>{
      const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
      if(!visible)return;
      links.forEach(a=>a.classList.toggle('is-current',a.getAttribute('href')==='#'+visible.target.id));
    },{rootMargin:'-10% 0px -58% 0px',threshold:[0,.05,.15,.4]});
    sections.forEach(section=>menuObserver.observe(section));
  }

  // The headline is real text. Each glyph springs away from the pointer,
  // then settles to its natural position. This uses no canvas/text screenshot.
  const hero=document.querySelector('.sky-hero');
  const title=hero?.querySelector('.kinetic-title');
  if(hero && title && matchMedia('(hover:hover) and (pointer:fine)').matches){
    const glyphs=[];
    title.querySelectorAll('.kinetic-line').forEach(line=>{
      [...line.childNodes].forEach(node=>{
        if(node.nodeType===Node.TEXT_NODE){
          const fragment=document.createDocumentFragment();
          for(const ch of [...node.textContent]){
            const span=document.createElement('span');
            span.className=ch===' ' ? 'kinetic-space' : 'kinetic-glyph';
            span.textContent=ch===' ' ? '\u00a0' : ch;
            span.setAttribute('aria-hidden','true');
            fragment.append(span);
            if(ch!==' ')glyphs.push({el:span,line,x:0,y:0,r:0,scale:1});
          }
          node.replaceWith(fragment);
        }else if(node.nodeType===Node.ELEMENT_NODE && node.classList?.contains('period')){
          node.classList.add('kinetic-glyph');
          node.setAttribute('aria-hidden','true');
          glyphs.push({el:node,line,x:0,y:0,r:0,scale:1});
        }
      });
    });
    // Parent h1 already has an accessible aria-label: avoid duplicated speech.
    title.setAttribute('aria-label','Ideas built to move');
    let pointerX=-5000,pointerY=-5000,inside=false,frame=0,last=0;
    const restore=()=>{inside=false;pointerX=-5000;pointerY=-5000;request();};
    const request=()=>{if(!frame)frame=requestAnimationFrame(tick);};
    function tick(time){
      frame=0;
      const dt=Math.min(2.2, Math.max(.6,(time-(last||time-16))/16.67));last=time;
      const disabled=motionOff();
      let moving=false;
      const bounds=new Map();
      glyphs.forEach(g=>{
        let tx=0,ty=0,tr=0,ts=1;
        if(inside&&!disabled){
          let box=bounds.get(g.line);
          if(!box){
            const r=g.line.getBoundingClientRect();
            box={left:r.left,top:r.top,sx:r.width/Math.max(1,g.line.offsetWidth),sy:r.height/Math.max(1,g.line.offsetHeight)};
            bounds.set(g.line,box);
          }
          // Offset geometry stays fixed even while letters visually move.
          const cx=box.left+(g.el.offsetLeft+g.el.offsetWidth*.5)*box.sx;
          const cy=box.top+(g.el.offsetTop+g.el.offsetHeight*.5)*box.sy;
          const dx=cx-pointerX,dy=cy-pointerY;
          const distance=Math.hypot(dx,dy);
          const radius=Math.max(98,Math.min(190,g.el.offsetHeight*2.4));
          if(distance<radius){
            const strength=Math.pow(1-distance/radius,1.35);
            const angle=distance>1?1/distance:1;
            tx=dx*angle*40*strength;
            ty=dy*angle*27*strength;
            tr=Math.max(-6,Math.min(6,dx*.032))*strength;
            ts=1+.045*strength;
          }
        }
        const k=1-Math.exp(-.19*dt);
        g.x+=(tx-g.x)*k;g.y+=(ty-g.y)*k;
        g.r+=(tr-g.r)*k;g.scale+=(ts-g.scale)*k;
        if(Math.abs(tx-g.x)+Math.abs(ty-g.y)+Math.abs(tr-g.r)*2+Math.abs(ts-g.scale)*30>.12)moving=true;
        g.el.style.transform=`translate3d(${g.x.toFixed(2)}px,${g.y.toFixed(2)}px,0) rotate(${g.r.toFixed(2)}deg) scale(${g.scale.toFixed(3)})`;
      });
      if(moving)request();
    }
    hero.addEventListener('pointermove',e=>{
      if(e.pointerType==='touch')return;
      pointerX=e.clientX;pointerY=e.clientY;inside=true;request();
    },{passive:true});
    hero.addEventListener('pointerleave',restore,{passive:true});
    document.getElementById('motion-switch')?.addEventListener('click',request);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)restore();});
    // Explicitly keep original text layout on resize; spans are inline.
    addEventListener('resize',request,{passive:true});
  }

  // Reveal state is managed only by site.js with hysteresis.
  // Do not install a second IntersectionObserver that can flicker near thresholds.

  // The work rail has its own horizontal animation; no reveal opacity that
  // could hide side cards while users swipe the carousel.
  const clouds=[...document.querySelectorAll('.sky-field .cloud')];
  let cloudRaf=0;
  const moveClouds=()=>{
    cloudRaf=0;
    const amount=motionOff()?0:Math.min(1800,window.scrollY);
    const ratio=[.035,-.026,.05,-.018];
    clouds.forEach((cloud,i)=>cloud.style.transform=`translate3d(0,${(-amount*ratio[i]).toFixed(1)}px,0)`);
  };
  addEventListener('scroll',()=>{if(!cloudRaf)cloudRaf=requestAnimationFrame(moveClouds)},{passive:true});
  addEventListener('resize',moveClouds,{passive:true});
  document.getElementById('motion-switch')?.addEventListener('click',()=>requestAnimationFrame(moveClouds));
  moveClouds();

  // Physical-feeling button press; respects the existing motion toggle.
  document.querySelectorAll('.work-controls button,.project-link,.hero-buttons .btn').forEach(button=>{
    button.addEventListener('pointerdown',()=>{
      if(motionOff())return;
      button.animate([
        {scale:1},{scale:.955,offset:.38},{scale:1}
      ],{duration:320,easing:'cubic-bezier(.2,.8,.3,1)'});
    });
  });

  const clock=document.getElementById('local-clock');
  const updateClock=()=>{
    if(!clock)return;
    clock.textContent='LIVE · '+new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',hour12:false});
  };
  updateClock();
  const interval=setInterval(updateClock,60000);
  addEventListener('pagehide',()=>clearInterval(interval),{once:true});
})();
