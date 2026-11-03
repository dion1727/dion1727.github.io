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

  // Repeatable scroll reveal: entering viewport animates, leaving resets.
  // We never use unobserve(), so both directions replay on reentry.
  const motionSelectors = [
    '.hero-copy .eyebrow','.hero-copy h1','.hero-copy > p','.hero-buttons',
    '.hero-mini','.hero-visual','.intro-strip','.section-title',
    '.moment-card','.gallery-note','.skill-card','.explore-line',
    '.game-selector','.game-main','.game-info','.game-footnote',
    '.heatmap-box','.counts-box','.activity-feed','.social','.cinema-footer'
  ];
  const elements = [...new Set(document.querySelectorAll(motionSelectors.join(',')))];
  elements.forEach((el,i)=>{
    el.classList.add('reveal');
    el.dataset.reveal = el.matches('.hero-visual,.game-info,.counts-box') ? 'right' : (el.matches('.section-title') ? 'left' : 'up');
    el.style.setProperty('--reveal-delay',`${(i % 4) * 48}ms`);
  });
  const visible = el => {
    const r=el.getBoundingClientRect();
    return r.top < innerHeight*.94 && r.bottom > innerHeight*.06;
  };
  function syncCurrentlyVisible(){
    for(const el of elements)el.classList.toggle('is-visible', visible(el));
  }
  if('IntersectionObserver' in window){
    const observer = new IntersectionObserver(entries=>{
      for(const entry of entries){
        // A separate .06 threshold prevents jitter at the edge.
        entry.target.classList.toggle('is-visible',entry.isIntersecting);
      }
    }, {rootMargin:'-6% 0px -6% 0px',threshold:0.06});
    elements.forEach(el=>observer.observe(el));
    requestAnimationFrame(syncCurrentlyVisible);
  }else{elements.forEach(el=>el.classList.add('is-visible'));}

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
  addEventListener('resize',()=>{schedule();syncCurrentlyVisible();},{passive:true});
  schedule();

  // Subtle SwarmCursor-inspired Canvas2D effect INSIDE .ambient, behind .page-wrap.
  // No overlay / badge can cover the navigation or the game.
  const canvas=byId('ambient-swarm');
  const ambientCursor=byId('cursor-ambient');
  if(canvas && fine.matches && !reduce.matches){
    const ctx=canvas.getContext('2d',{alpha:true});
    if(ctx){
      const N=180;
      const random=(s)=>{let v=s>>>0;return()=>{v^=v<<13;v^=v>>>17;v^=v<<5;return(v>>>0)/4294967296}};
      const rng=random(271827);
      const particles=Array.from({length:N},(_,i)=>({a:i*2.399963,r:16+Math.sqrt(rng())*103,size:.65+rng()*1.45,offset:rng()*6.28,speed:.4+rng()*1.3,depth:.4+rng()*.6}));
      let w=innerWidth,h=innerHeight,px=-999,py=-999,fx=-999,fy=-999,seen=false;
      let burst=0, raf=0, last=0;
      function resize(){w=innerWidth;h=innerHeight;const d=Math.min(devicePixelRatio||1,1.75);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(d,0,0,d,0,0);}
      resize();addEventListener('resize',resize,{passive:true});
      document.addEventListener('pointermove',e=>{
        if(e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
        px=e.clientX;py=e.clientY;
        if(!seen){fx=px;fy=py;seen=true;}
        if(ambientCursor){ambientCursor.style.setProperty('--cx',`${px}px`);ambientCursor.style.setProperty('--cy',`${py}px`);ambientCursor.classList.toggle('visible',enabled);}
        const surface=e.target.closest?.('.spotlight-surface,.motion-lit');
        if(surface){const b=surface.getBoundingClientRect();surface.style.setProperty('--spotlight-x',(px-b.left)+'px');surface.style.setProperty('--spotlight-y',(py-b.top)+'px');}
        const light=document.querySelector('.g-one');
        if(light&&enabled)light.style.transform=`translate3d(${((px/w)-.5)*38}px,${((py/h)-.5)*38}px,0)`;
      },{passive:true});
      document.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&enabled)burst=1;},{passive:true});
      const frame=ts=>{
        raf=0;
        if(document.hidden){return;}
        const dt=Math.min(32,last?ts-last:16);last=ts;
        ctx.clearRect(0,0,w,h);
        if(enabled&&seen&&px>=0&&px<=w&&py>=0&&py<=h){
          fx+=(px-fx)*Math.min(1,dt*.0065);fy+=(py-fy)*Math.min(1,dt*.0065);
          const t=ts*.001;
          // 'Comet tail' reacts to movement without competing with content.
          const vx=px-fx,vy=py-fy;
          for(const p of particles){
            const angle=p.a+t*.12+Math.sin(t*p.speed+p.offset)*.34;
            const rad=p.r+Math.sin(t*.85+p.offset)*6;
            const x=fx+Math.cos(angle)*rad-vx*(.08+p.depth*.17);
            const y=fy+Math.sin(angle)*rad*.8-vy*(.08+p.depth*.17);
            const alpha=Math.max(.11,.45*(1-rad/172))*p.depth;
            ctx.beginPath();ctx.arc(x,y,p.size,0,6.283);
            ctx.fillStyle=(p.a>5.7 ? `rgba(238,105,89,${(alpha*.65).toFixed(3)})` : `rgba(20,67,112,${(alpha*1.4).toFixed(3)})`);ctx.fill();
          }
          if(burst>.02){const size=12+(1-burst)*70;ctx.beginPath();ctx.arc(px,py,size,0,6.283);ctx.strokeStyle=`rgba(238,105,89,${(burst*.34).toFixed(3)})`;ctx.lineWidth=1.2;ctx.stroke();burst*=.9;}
        }
        // stop rendering while pointer absent and motion disabled; scroll anim unaffected.
        raf=requestAnimationFrame(frame);
      };
      raf=requestAnimationFrame(frame);
      document.addEventListener('visibilitychange',()=>{last=0;if(!document.hidden&&!raf)raf=requestAnimationFrame(frame);});
      addEventListener('pagehide',()=>{cancelAnimationFrame(raf);},{once:true});
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
