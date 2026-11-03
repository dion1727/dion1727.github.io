"use strict";
/**
 * Motion V4 — an additive, dependency-free adaptation of the supplied
 * SwarmCursor, ScrollTrigger, BellToggle and FolderFloat interaction patterns.
 * This project is a static HTML/CSS/JS site; game.js & radar.js remain intact.
 */
(() => {
  const root = document.documentElement;
  const $ = id => document.getElementById(id);
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const progress = $("scroll-progress");
  $("year").textContent = String(new Date().getFullYear());

  // BellToggle-inspired control with a real purpose: animation preferences.
  const toggle = $("motion-switch");
  const toggleLabel = toggle?.querySelector(".motion-label");
  let userChoice = null;
  try { userChoice = localStorage.getItem("dion-motion-preference"); } catch (_) {}
  let motionEnabled = !reduce.matches && userChoice !== "off";
  const syncMotion = (animateBell = false) => {
    root.classList.toggle("motion-ready", motionEnabled);
    root.classList.toggle("motion-off", !motionEnabled);
    toggle?.setAttribute("aria-pressed", String(motionEnabled));
    if (toggleLabel) toggleLabel.textContent = motionEnabled ? "Motion on" : "Motion off";
    toggle?.classList.toggle("enabled", motionEnabled);
    if (animateBell && !reduce.matches) {
      const bell = toggle?.querySelector("svg");
      bell?.animate([
        { rotate: "0deg" },{ rotate: "-17deg" },{ rotate: "14deg" },
        { rotate: "-9deg" },{ rotate: "7deg" },{ rotate: "-3deg" },{ rotate: "0deg" }
      ], { duration: 760, easing: "ease-in-out" });
      toggle?.classList.remove("bell-ringing");
      void toggle?.offsetWidth;
      toggle?.classList.add("bell-ringing");
    }
  };
  syncMotion();
  toggle?.addEventListener("click", () => {
    if (reduce.matches) {
      // Honour OS accessibility settings; no forced flashing/motion.
      toggle.title = "Animasi dinonaktifkan karena pengaturan Reduced Motion perangkat";
      return;
    }
    motionEnabled = !motionEnabled;
    try { localStorage.setItem("dion-motion-preference", motionEnabled ? "on" : "off"); } catch (_) {}
    syncMotion(true);
    // An element in view should never be hidden when switching modes.
    if (motionEnabled) syncCurrentlyVisible();
  });
  reduce.addEventListener?.("change", event => {
    motionEnabled = !event.matches && userChoice !== "off";
    syncMotion();
  });

  // Repeatable scroll reveal, in both directions. Do not unobserve targets.
  const selectors = [
    ".hero-copy .eyebrow", ".hero-copy h1", ".hero-copy > p",
    ".hero-buttons", ".hero-mini", ".hero-visual", ".intro-strip",
    ".section-title", ".moments-grid .moment-card", ".skill-card", ".explore-line",
    ".game-selector", ".game-main", ".game-info", ".heatmap-box",
    ".counts-box", ".activity-feed", ".social", ".about-detail", ".cinema-footer"
  ];
  const animated = [...new Set(document.querySelectorAll(selectors.join(",")))];
  animated.forEach((element, i) => {
    element.classList.add("reveal");
    element.dataset.reveal = element.matches(".hero-visual,.game-info,.counts-box") ? "right" : "up";
    element.style.setProperty("--reveal-delay", `${(i % 3) * 48}ms`);
  });
  const inWindow = element => {
    const rect = element.getBoundingClientRect();
    return rect.top < innerHeight * .98 && rect.bottom > innerHeight * .02;
  };
  function syncCurrentlyVisible() {
    animated.forEach(element => element.classList.toggle("is-visible", inWindow(element)));
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) entry.target.classList.add("is-visible");
        else entry.target.classList.remove("is-visible");
      }
    }, { rootMargin: "0px 0px -6% 0px", threshold: [0, .12] });
    animated.forEach(element => observer.observe(element));
    requestAnimationFrame(syncCurrentlyVisible);
  } else {
    animated.forEach(element => element.classList.add("is-visible"));
  }

  let scrollFrame = 0;
  const drawProgress = () => {
    scrollFrame = 0;
    const max = Math.max(0, root.scrollHeight - innerHeight);
    if (progress) progress.style.transform = `scaleX(${max ? Math.min(1, Math.max(0, scrollY / max)) : 0})`;
    const hero = document.querySelector(".hero");
    if (hero) {
      const r = hero.getBoundingClientRect();
      const val = motionEnabled ? Math.max(-22, Math.min(22, -r.top * .07)) : 0;
      hero.style.setProperty("--depth-shift", `${val}px`);
    }
  };
  const scheduleScroll = () => { if (!scrollFrame) scrollFrame = requestAnimationFrame(drawProgress); };
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll, { passive: true });
  drawProgress();

  // SwarmCursor-inspired, subtle Canvas2D background. The canvas is INSIDE
  // .ambient (z=0), while all content is within .page-wrap (z=1).
  // Consequently no particle can cover text, buttons, modal or the game.
  const canvas = $("ambient-swarm");
  if (canvas && finePointer.matches && !reduce.matches) {
    const context = canvas.getContext("2d", { alpha: true });
    if (context) {
      let w = innerWidth, h = innerHeight;
      let px = -200, py = -200, trailX = -200, trailY = -200;
      let seen = false, burst = 0, raf = 0;
      const particles = Array.from({ length: 86 }, (_, i) => ({
        angle: i * 2.399963, phase: Math.random() * Math.PI * 2,
        orbit: 15 + Math.sqrt(Math.random()) * 100,
        speed: .35 + Math.random() * .55,
        size: .7 + Math.random() * 1.35
      }));
      const resize = () => {
        w = innerWidth; h = innerHeight;
        const ratio = Math.min(devicePixelRatio || 1, 1.5);
        canvas.width = Math.ceil(w * ratio);
        canvas.height = Math.ceil(h * ratio);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        context.setTransform(ratio, 0, 0, ratio, 0, 0);
      };
      resize();
      addEventListener("resize", resize, { passive: true });
      const frame = ts => {
        raf = requestAnimationFrame(frame);
        context.clearRect(0, 0, w, h);
        if (!motionEnabled || !seen || document.hidden) return;
        trailX += (px - trailX) * .095;
        trailY += (py - trailY) * .095;
        if (trailX < 0 || trailX > w || trailY < 0 || trailY > h) return;
        const t = ts * .001;
        const glow = context.createRadialGradient(trailX,trailY,0,trailX,trailY,155);
        glow.addColorStop(0,"rgba(145,166,222,.095)");
        glow.addColorStop(.48,"rgba(118,150,196,.042)");
        glow.addColorStop(1,"rgba(118,150,196,0)");
        context.fillStyle=glow; context.fillRect(trailX-155,trailY-155,310,310);
        particles.forEach((p,i) => {
          const theta = p.angle + Math.sin(t * p.speed + p.phase) * .75 + t * .16;
          const radius = p.orbit + Math.sin(t*.65 + p.phase) * 8;
          const dx = Math.cos(theta)*radius;
          const dy = Math.sin(theta)*radius*.72;
          const x = trailX + dx - (px-trailX)*.11;
          const y = trailY + dy - (py-trailY)*.11;
          const a = .14 + .23 * (1 - radius / 140);
          context.beginPath(); context.arc(x,y,p.size,0,Math.PI*2);
          context.fillStyle = i % 7 === 0 ? `rgba(181,221,230,${a})` : `rgba(191,207,255,${a})`;
          context.fill();
        });
        if (burst > .015) {
          context.beginPath(); context.arc(px,py,(1-burst)*72+8,0,Math.PI*2);
          context.lineWidth = 1; context.strokeStyle = `rgba(192,214,255,${burst*.28})`;
          context.stroke(); burst *= .91;
        }
      };
      raf = requestAnimationFrame(frame);
      addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
        px=e.clientX; py=e.clientY;
        if (!seen) { seen=true; trailX=px; trailY=py; }
      }, { passive:true });
      addEventListener("pointerdown", e => {
        if (e.pointerType === "mouse" && motionEnabled) burst=1;
      }, { passive:true });
      addEventListener("pagehide", () => cancelAnimationFrame(raf), { once:true });
    }
  }

  // Spotlight: only at the pointer-relative position inside cards and photos.
  if (finePointer.matches) {
    document.addEventListener("pointermove", event => {
      if (!motionEnabled) return;
      const surface = event.target.closest?.(".spotlight-surface,.motion-lit");
      if (surface) {
        const box = surface.getBoundingClientRect();
        surface.style.setProperty("--spotlight-x", `${event.clientX-box.left}px`);
        surface.style.setProperty("--spotlight-y", `${event.clientY-box.top}px`);
      }
    }, { passive:true });
  }

  // Magnetic buttons are deliberately limited to UI/navigation actions.
  // Do NOT move game buttons or the canvas, which would disrupt gameplay.
  if (finePointer.matches) {
    document.querySelectorAll(".hero-buttons .btn,.nav-action,.folder-handle").forEach(element => {
      element.classList.add("magnetic-button");
      element.addEventListener("pointermove", event => {
        if (!motionEnabled) return;
        const r = element.getBoundingClientRect();
        const x = (event.clientX - r.left - r.width / 2) / r.width;
        const y = (event.clientY - r.top - r.height / 2) / r.height;
        element.style.translate = `${Math.max(-5,Math.min(5,x*9)).toFixed(1)}px ${Math.max(-4,Math.min(4,y*7)).toFixed(1)}px`;
      });
      element.addEventListener("pointerleave", () => { element.style.translate="0 0"; });
    });
  }

  // FolderFloat-inspired quicklinks, lightweight and click/keyboard friendly.
  const folder = $("float-folder");
  const folderButton = $("folder-handle");
  const folderItems = $("folder-links");
  const openFolder = value => {
    folder?.classList.toggle("opened",value);
    folderButton?.setAttribute("aria-expanded",String(value));
    if (folderItems) folderItems.inert = !value;
  };
  folderButton?.addEventListener("click", () => openFolder(!folder.classList.contains("opened")));
  folderItems?.querySelectorAll("a").forEach(a => a.addEventListener("click", () => openFolder(false)));
  document.addEventListener("pointerdown", event => { if (folder && !folder.contains(event.target)) openFolder(false); });
  document.addEventListener("keydown", event => { if (event.key === "Escape") openFolder(false); });

  // Original personal photo viewer, unchanged in scope and assets.
  const dialog = $("photo-dialog");
  const photo = $("photo-expanded");
  const caption = $("photo-caption");
  const captions = ["In the moment","A little pause","Work in progress"];
  document.querySelectorAll(".moment-card").forEach(card => {
    card.addEventListener("click", () => {
      const n = Number(card.dataset.photo || 1);
      if (!dialog?.showModal || !photo || n < 1 || n > 3) return;
      photo.src = `assets/moment-${n}.webp`;
      photo.alt = card.querySelector("img")?.alt || "Expanded photograph";
      if (caption) caption.textContent = `0${n} / ${captions[n-1]}`;
      dialog.showModal();
    });
  });
  $("photo-close")?.addEventListener("click",() => dialog?.close());
  dialog?.addEventListener("click",event => { if (event.target === dialog) dialog.close(); });
})();
