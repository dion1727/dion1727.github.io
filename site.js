"use strict";
/* Dion Portfolio V5 — preserve original structure & games, add motion behind content */
(() => {
  const root = document.documentElement;
  const byId = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const year = byId('year'); if(year) year.textContent = new Date().getFullYear();
  const toggle = byId('motion-switch');
  let stored = 'on'; try { stored = localStorage.getItem('dion-motion-enabled') || 'on'; } catch (_) {}
  let enabled = stored !== 'off' && !reduce.matches;
  const label = toggle?.querySelector('.motion-label');
  const syncSwitch = () => {
    root.classList.toggle('motion-ready',enabled);
    root.classList.toggle('motion-off',!enabled);
    toggle?.setAttribute('aria-pressed',String(enabled));
    if(label) label.textContent = enabled ? 'Motion on' : 'Motion off';
    toggle?.setAttribute('title',enabled?'Disable animations':'Enable animations');
  };
  syncSwitch();
  toggle?.addEventListener('click', () => {
    if(reduce.matches){ toggle.title='Reduced Motion is enabled in system settings';return; }
    enabled = !enabled; syncSwitch();
    try { localStorage.setItem('dion-motion-enabled',enabled?'on':'off'); } catch (_){}
    toggle.classList.remove('bell-ringing'); void toggle.offsetWidth;
    toggle.classList.add('bell-ringing');
    toggle.addEventListener('animationend',()=>toggle.classList.remove('bell-ringing'),{once:true});
    if(enabled) syncCurrentlyVisible();
  });
  reduce.addEventListener?.('change',e=>{enabled=!e.matches&&stored!=='off';syncSwitch();syncCurrentlyVisible();});

  // V11: Reveal with hysteresis. Once an element enters, keep it visible until
  // it is FAR outside the viewport. This prevents flashing around halfway scroll.
  // After it leaves by >55vh, it can reveal again when scrolling back.
  const motionSelectors = [
    '.hero-copy .eyebrow','.hero-copy h1','.hero-copy > p','.hero-buttons',
    '.hero-mini','.hero-visual','.intro-strip','.section-title',
    '.moment-card','.gallery-note','.skill-card','.explore-line',
    '.game-selector','.game-main','.game-info','.game-footnote',
    '.heatmap-box','.counts-box','.activity-feed','.social','.cinema-footer',
    '.work-header','.about-panel', '.project-rail'
  ];
  const elements = [...new Set(document.querySelectorAll(motionSelectors.join(',')))];
  elements.forEach((el,i)=>{
    el.classList.add('reveal');
    el.dataset.reveal = el.matches('.game-info,.counts-box') ? 'right' : 'up';
    el.style.setProperty('--reveal-delay',`${(i % 3) * 42}ms`);
  });
  const revealStates = new WeakMap();
  let tickingReveal = 0;
  function syncCurrentlyVisible(){
    const vh = innerHeight;
    for(const el of elements){
      const r = el.getBoundingClientRect();
      let state = revealStates.get(el) || false;
      // Enter: once a meaningful part reaches the screen; no threshold toggles.
      const enter = r.top < vh * .9 && r.bottom > vh * .1;
      // Exit: only after a *large* gap; protects against jitter and transforms.
      const farAway = r.bottom < -vh*.55 || r.top > vh*1.55;
      if (enter) state = true;
      else if (farAway) state = false;
      revealStates.set(el,state);
      el.classList.toggle('is-visible',state);
    }
  }
  const scheduleReveal=()=>{
    if(tickingReveal)return;
    tickingReveal=requestAnimationFrame(()=>{
      tickingReveal=0;
      if(enabled)syncCurrentlyVisible();
    });
  };
  addEventListener('scroll',scheduleReveal,{passive:true});
  requestAnimationFrame(syncCurrentlyVisible);

  // Progress bar + parallax from original V2 retained.
  let scrollFrame = 0;
  const progress=byId('scroll-progress');
  const hero=document.querySelector('.hero');
  const onScroll=()=>{
    scrollFrame=0;
    const max=Math.max(0,root.scrollHeight-innerHeight);
    if(progress)progress.style.transform=`scaleX(${max?Math.max(0,Math.min(1,scrollY/max)):0})`;
    if(hero){const r=hero.getBoundingClientRect();
      if(r.bottom>-100&&r.top<innerHeight+100){
        const depth=enabled?Math.max(-1,Math.min(1,-r.top/Math.max(1,r.height))):0;
        hero.style.setProperty('--depth-shift',Math.round(depth*35)+'px');
      }
    }
  };
  const schedule=()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(onScroll)};
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',()=>{schedule();scheduleReveal();},{passive:true});
  schedule();

  // V9: restrained four-point cursor sparkles. Real particles are drawn on
  // the same background canvas as before, BELOW .page-wrap; no cursor overlay.
  // Spawn only during movement, fade quickly, and stop animating when idle.
  const canvas=byId('ambient-swarm');
  const ambientCursor=byId('cursor-ambient');
  if(canvas && fine.matches && !reduce.matches && !document.documentElement.classList.contains('v10-cursor')){
    const ctx=canvas.getContext('2d',{alpha:true});
    if(ctx){
      let w=innerWidth,h=innerHeight,dpr=1,raf=0,last=0;
      let lastX=-999,lastY=-999, lastSpawn=0;
      const sparks=[];
      const MAX_SPARKS=44;
      const palette=['255,255,255','36,80,125','255,255,255','233,111,88'];
      const resize=()=>{
        w=innerWidth;h=innerHeight;
        dpr=Math.min(devicePixelRatio||1,2);
        canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
        canvas.style.width=w+'px';canvas.style.height=h+'px';
        ctx.setTransform(dpr,0,0,dpr,0,0);
      };
      resize();
      addEventListener('resize',resize,{passive:true});
      function create(x,y,dx,dy,seed){
        if(sparks.length>=MAX_SPARKS)sparks.shift();
        const angle=Math.random()*6.283;
        sparks.push({
          x:x+(Math.random()-.5)*16,
          y:y+(Math.random()-.5)*16,
          vx:-dx*.025+Math.cos(angle)*(.32+Math.random()*.52),
          vy:-dy*.025+Math.sin(angle)*(.35+Math.random()*.62)-.13,
          size:seed ? 2.7+Math.random()*2.3 : 1.25+Math.random()*1.4,
          rotation:Math.random()*6.28,
          spin:(Math.random()-.5)*.025,
          time:0,
          life:seed ? 440+Math.random()*300 : 320+Math.random()*260,
          color:palette[Math.floor(Math.random()*palette.length)]
        });
      }
      function drawStar(x,y,r,rotate,opacity,color){
        ctx.save();ctx.translate(x,y);ctx.rotate(rotate);
        ctx.fillStyle=`rgba(${color},${opacity.toFixed(3)})`;
        ctx.beginPath();
        // Four tapered arms, not glitter dots or a large particle swarm.
        for(let a=0;a<8;a++){
          const ang=a*Math.PI/4-Math.PI/2;
          const radius=a%2===0?r:r*.17;
          const cx=Math.cos(ang)*radius,cy=Math.sin(ang)*radius;
          if(a===0)ctx.moveTo(cx,cy); else ctx.lineTo(cx,cy);
        }
        ctx.closePath();ctx.fill();
        ctx.restore();
      }
      function frame(now){
        raf=0;
        const dt=Math.min(42,last?now-last:16);last=now;
        ctx.clearRect(0,0,w,h);
        if(!enabled||document.hidden){sparks.length=0;last=0;return;}
        for(let i=sparks.length-1;i>=0;i--){
          const p=sparks[i];p.time+=dt;
          if(p.time>=p.life){sparks.splice(i,1);continue;}
          const life=p.time/p.life;
          const ease=Math.pow(1-life,1.6);
          p.x+=p.vx*dt*.055;p.y+=p.vy*dt*.055;
          p.rotation+=p.spin*dt;
          const alpha=Math.min(1,p.time/70)*ease*.86;
          drawStar(p.x,p.y,p.size*(.85+ease*.22),p.rotation,alpha,p.color);
        }
        if(sparks.length)raf=requestAnimationFrame(frame);
        else last=0;
      }
      const request=()=>{if(!raf)raf=requestAnimationFrame(frame);};
      document.addEventListener('pointermove',e=>{
        if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
        const x=e.clientX,y=e.clientY;
        if(ambientCursor){
          ambientCursor.style.setProperty('--cx',`${x}px`);
          ambientCursor.style.setProperty('--cy',`${y}px`);
          ambientCursor.classList.toggle('visible',enabled);
        }
        const surface=e.target.closest?.('.spotlight-surface,.motion-lit');
        if(surface){const b=surface.getBoundingClientRect();surface.style.setProperty('--spotlight-x',(x-b.left)+'px');surface.style.setProperty('--spotlight-y',(y-b.top)+'px');}
        const light=document.querySelector('.g-one');
        if(light&&enabled)light.style.transform=`translate3d(${((x/w)-.5)*38}px,${((y/h)-.5)*38}px,0)`;
        if(lastX>0&&enabled){
          const dx=x-lastX,dy=y-lastY;
          const distance=Math.hypot(dx,dy);
          const now=performance.now();
          if(distance>=10&&now-lastSpawn>28){
            const count=Math.min(3,Math.max(1,Math.floor(distance/25)));
            for(let n=0;n<count;n++){
              const f=.25+.7*(n+1)/(count+1);
              create(lastX+dx*f,lastY+dy*f,dx,dy,n===0);
            }
            lastSpawn=now;request();
          }
        }
        lastX=x;lastY=y;
      },{passive:true});
      document.addEventListener('pointerdown',e=>{
        if(e.pointerType!=='mouse'||!enabled)return;
        for(let j=0;j<5;j++)create(e.clientX,e.clientY,0,0,j%2===0);
        request();
      },{passive:true});
      document.addEventListener('pointerleave',()=>{lastX=-999;lastY=-999;ambientCursor?.classList.remove('visible');},{passive:true});
      document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sparks.length)request();else{sparks.length=0;ctx.clearRect(0,0,w,h);}}, {passive:true});
      addEventListener('pagehide',()=>cancelAnimationFrame(raf),{once:true});
      toggle?.addEventListener('click',()=>{if(!enabled){sparks.length=0;ctx.clearRect(0,0,w,h);ambientCursor?.classList.remove('visible');}});
    }
  }

  // Magnetic interaction based on the supplied footer component.
  // No magnets on game buttons/canvas for precise controls.
  if(fine.matches&&!reduce.matches){
    document.querySelectorAll('.hero-buttons .btn,.topbar .nav-action,.footer-up').forEach(element=>{
      element.classList.add('magnetic-button');
      element.addEventListener('pointermove',e=>{
        if(!enabled)return;
        const r=element.getBoundingClientRect();
        const x=(e.clientX-r.left-r.width/2)/r.width;
        const y=(e.clientY-r.top-r.height/2)/r.height;
        element.style.translate=`${Math.max(-5,Math.min(5,x*10))}px ${Math.max(-4,Math.min(4,y*8))}px`;
      });
      element.addEventListener('pointerleave',()=>element.style.translate='0 0');
    });
  }
  // FolderFloat-inspired quick links: real destinations, keyboard-accessible.
  const folder=byId('float-folder');
  const handle=byId('folder-handle');
  const links=byId('folder-links');
  function setOpen(on){folder?.classList.toggle('opened',on);handle?.setAttribute('aria-expanded',String(on));if(links)links.inert=!on;}
  handle?.addEventListener('click',()=>setOpen(!folder.classList.contains('opened')));
  links?.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setOpen(false)));
  document.addEventListener('pointerdown',e=>{if(folder&&!folder.contains(e.target))setOpen(false)});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')setOpen(false)});

  // Preserve original personal photo lightbox and assets.
  const dialog=byId('photo-dialog'),image=byId('photo-expanded'),caption=byId('photo-caption');
  const captions=['In the moment','A little pause','Work in progress'];
  document.querySelectorAll('.moment-card').forEach(card=>{
    card.addEventListener('click',()=>{
      const n=Number(card.dataset.photo||1);
      if(!dialog?.showModal||!image||n<1||n>3)return;
      image.src=`assets/moment-${n}.webp`;
      image.alt=card.querySelector('img')?.alt||'Expanded photograph';
      if(caption)caption.textContent=`0${n} / ${captions[n-1]}`;
      dialog.showModal();
    });
  });
  byId('photo-close')?.addEventListener('click',()=>dialog?.close());
  dialog?.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});
})();
