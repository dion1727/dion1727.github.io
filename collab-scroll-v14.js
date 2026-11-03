"use strict";
/* V14: actual scroll-to-resize typography.
   The headline starts around half-size, gets dragged to 100%, then the
   faux editor chrome fades away. Progress is based ONLY on an untransformed
   section box. No scroll thresholds that repeatedly hide the real text. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const stages = [
    ['#work', '.work-header h2', '01 / WORK'],
    ['#about', '.about-grid h2', '02 / ABOUT'],
    ['#moments', '.moments-section .section-title h2', '03 / SNAPSHOTS'],
    ['#expertise', '.expertise .section-title h2', '04 / SKILLS'],
    ['#arcade', '.arcade-section .section-title h2', '05 / ARCADE'],
    ['#contributions', '.contributions .section-title h2', '06 / ACTIVITY'],
    ['#contact', '.contact .section-title h2', '07 / CONTACT'],
  ];
  const clamp = (n) => Math.max(0, Math.min(1, n));
  const smoothstep = (a,b,x) => {
    const t = clamp((x-a)/(b-a)); return t*t*(3-2*t);
  };
  const scenes = [];
  for (const [selector, headingSelector, label] of stages) {
    const section = document.querySelector(selector);
    const heading = document.querySelector(headingSelector);
    if (!section || !heading) continue;
    heading.classList.add('edit-stage-title');
    const chrome = document.createElement('span');
    chrome.className = 'edit-stage-layer';
    chrome.setAttribute('aria-hidden','true');
    chrome.innerHTML = '<span class="edit-stage-outline"><i class="edit-handle tl"></i><i class="edit-handle tr"></i><i class="edit-handle bl"></i><i class="edit-handle br"></i><i class="edit-resize-guide"></i></span><span class="edit-stage-dragtrace"></span><span class="edit-stage-complete">100% · DONE</span>';
    const badge = document.createElement('span');
    badge.className = 'edit-stage-badge';
    badge.setAttribute('aria-hidden','true');
    badge.textContent = label;
    const size = document.createElement('span');
    size.className = 'edit-stage-size';
    size.setAttribute('aria-hidden','true');
    size.textContent = 'TEXT / 50%';
    const pointer = document.createElement('span');
    pointer.className = 'edit-stage-pointer';
    pointer.setAttribute('aria-hidden','true');
    pointer.innerHTML = '<svg viewBox="0 0 22 26" width="20" height="24" fill="none"><path d="M2 2L2 22L7.5 17L12 24L16.2 21.6L11.5 15L19 14.2Z" fill="currentColor" stroke="white" stroke-width="1.4" stroke-linejoin="round"/></svg><span class="edit-pointer-tag">RESIZE</span>';
    heading.append(chrome, badge, size, pointer);
    scenes.push({section, heading, size, prev: -1});
  }
  let raf=0;
  function paint() {
    raf=0;
    const allowed = !document.hidden && !reduced.matches && !root.classList.contains('motion-off');
    const vh = Math.max(1,innerHeight);
    const narrow = innerWidth < 720;
    const startScale = narrow ? 0.63 : 0.44;
    for (const scene of scenes) {
      const el = scene.heading;
      if (!allowed) {
        el.classList.remove('edit-in-progress');
        el.style.setProperty('--edit-scale','1');
        el.style.setProperty('--edit-show','0');
        el.style.setProperty('--edit-complete','0');
        scene.prev = -1;
        continue;
      }
      // Start resizing when section just enters the screen. Finish before
      // the title gets to the upper fifth of the viewport.
      const top = scene.section.getBoundingClientRect().top;
      const progress = clamp((vh * 0.88 - top) / (vh * 0.69));
      if (Math.abs(progress-scene.prev)<0.0005 && scene.prev>=0) continue;
      scene.prev = progress;
      const growth = smoothstep(0.035,0.86,progress);
      const scale = startScale + (1-startScale) * growth;
      const visible = smoothstep(0.02,0.14,progress) * (1-smoothstep(0.76,0.96,progress));
      const editorActive = progress > 0.02 && progress < 0.96 && visible > 0.015;
      el.classList.toggle('edit-in-progress',editorActive);
      el.style.setProperty('--edit-scale',scale.toFixed(4));
      el.style.setProperty('--edit-show',visible.toFixed(3));
      el.style.setProperty('--edit-rise',(-8*(1-growth)).toFixed(2)+'px');
      // Cursor sweeps diagonally to the resize handle. Progress is scroll-linked.
      const drift = 3.1*Math.sin(growth*Math.PI*2.0);
      el.style.setProperty('--edit-cursor-x',(-95 + 92*growth + drift).toFixed(1)+'px');
      el.style.setProperty('--edit-cursor-y',(43 - 47*growth + 1.5*Math.sin(growth*Math.PI*3)).toFixed(1)+'px');
      el.style.setProperty('--edit-cursor-tilt',(-13 + 14*growth).toFixed(1)+'deg');
      el.style.setProperty('--edit-drag-length',(94*(1-growth)).toFixed(1)+'px');
      el.style.setProperty('--edit-complete',(smoothstep(0.86,0.92,progress)*(1-smoothstep(0.965,1,progress))).toFixed(3));
      el.style.setProperty('--edit-guide-alpha',(visible*.75).toFixed(3));
      scene.size.textContent = 'TEXT / '+Math.round(scale*100)+'%';
    }
  }
  function request(){ if (!raf) raf=requestAnimationFrame(paint); }
  addEventListener('scroll',request,{passive:true});
  addEventListener('resize',request,{passive:true});
  document.getElementById('motion-switch')?.addEventListener('click',request);
  reduced.addEventListener?.('change',request);
  document.addEventListener('visibilitychange',request);
  request();
})();
