"use strict";
/**
 * Motion v2 for static HTML / GitHub Pages.
 * Scroll-reveal, scroll-driven depth, spring cursor / intent label,
 * pointer spotlight, plus the original photo-dialog interactions.
 * All movement is disabled for reduced-motion and coarse-pointer devices.
 */
(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const progress = document.getElementById("scroll-progress");
  const orb = document.getElementById("intent-cursor");
  const label = document.getElementById("intent-cursor-text");
  const glyph = document.getElementById("intent-cursor-icon");
  const light = document.querySelector(".g-one");
  let scrollFrame = 0;

  // Animate the real content: headings, panels, games, calendar, social cards.
  // The gallery and skill cards already have .reveal; do not animate canvas contents.
  const animatedSelectors = [
    ".hero-copy .eyebrow", ".hero-copy h1", ".hero-copy > p",
    ".hero-buttons", ".hero-mini", ".hero-visual", ".intro-strip",
    ".section-title", ".game-selector", ".game-main", ".game-info",
    ".game-footnote", ".heatmap-box", ".counts-box", ".activity-feed",
    ".explore-line", ".gallery-note", "footer",
  ];
  const animated = [...new Set([
    ...document.querySelectorAll(".reveal"),
    ...document.querySelectorAll(animatedSelectors.join(",")),
  ])];
  animated.forEach((element, i) => {
    element.classList.add("reveal");
    // Horizontal movement is intentionally modest so nothing clips on phones.
    const alternating = element.matches(".section-title") ? "left" :
      element.matches(".game-info,.counts-box,.hero-visual") ? "right" : "up";
    element.dataset.reveal = alternating;
    element.style.setProperty("--reveal-delay", `${(i % 4) * 65}ms`);
  });

  if (!reduced.matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    }, { threshold: 0.08, rootMargin: "0px 0px 10px 0px" });
    animated.forEach(el => observer.observe(el));
    // If the page is loaded at an anchor, ensure in-view items appear promptly.
    requestAnimationFrame(() => {
      for (const el of animated) {
        const r = el.getBoundingClientRect();
        if (r.top < innerHeight * 0.92 && r.bottom >= 0) el.classList.add("is-visible");
      }
    });
  } else {
    animated.forEach(el => el.classList.add("is-visible"));
  }

  const scrollEffects = () => {
    scrollFrame = 0;
    const doc = document.documentElement;
    const max = Math.max(0, doc.scrollHeight - innerHeight);
    const ratio = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
    if (progress) progress.style.transform = `scaleX(${ratio})`;
    if (!reduced.matches) {
      const hero = document.querySelector(".hero");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > -100 && rect.top < innerHeight + 100) {
          const depth = Math.max(-1, Math.min(1, -rect.top / Math.max(rect.height, 1)));
          hero.style.setProperty("--depth-shift", `${Math.round(depth * 35)}px`);
        }
      }
    }
  };
  const scheduleScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(scrollEffects);
  };
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll, { passive: true });
  scheduleScroll();

  // Intent cursor: glow follows the pointer anywhere, pill expands over controls.
  // Native mouse pointer remains visible, as it is more reliable for precise clicks.
  if (orb && finePointer.matches && !reduced.matches) {
    const iconPaths = { view:"↗", play:"▶", pause:"Ⅱ", drag:"↔", external:"↗", copy:"⧉", check:"✓" };
    const trails = Array.from({ length: 4 }, (_, i) => {
      const node = document.createElement("span");
      node.className = "motion-trail";
      node.style.setProperty("--trail-opacity", String(.23 - i * .045));
      node.setAttribute("aria-hidden", "true");
      document.body.appendChild(node);
      return { node, x: -80, y: -80 };
    });
    let aimX = -80, aimY = -80, x = -80, y = -80, frame = 0, pointerActive = false;
    let hovered = null;
    let previousLabel = "";
    const tick = () => {
      frame = 0;
      if (!pointerActive) return;
      // Spring-like easing gives the ring a gentle trailing motion.
      x += (aimX - x) * .26;
      y += (aimY - y) * .26;
      orb.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      let tx = x, ty = y;
      for (let i = 0; i < trails.length; i++) {
        const t = trails[i];
        const pace = .24 - i * .025;
        t.x += (tx - t.x) * pace;
        t.y += (ty - t.y) * pace;
        t.node.style.transform = `translate3d(${t.x}px,${t.y}px,0) translate(-50%,-50%)`;
        tx = t.x; ty = t.y;
      }
      const stillMoving = Math.abs(aimX-x) + Math.abs(aimY-y) > .2 || trails.some(t => Math.abs(x-t.x)+Math.abs(y-t.y) > .7);
      if (stillMoving) frame = requestAnimationFrame(tick);
    };
    const wake = () => { if (!frame) frame = requestAnimationFrame(tick); };
    const setIntent = element => {
      const candidate = element?.closest?.("[data-intent]") || null;
      if (candidate === hovered) return;
      hovered = candidate;
      const message = candidate?.dataset.intent || "";
      const kind = candidate?.dataset.intentIcon || "view";
      orb.classList.toggle("is-intent", Boolean(message));
      if (label && message !== previousLabel) { label.textContent = message; previousLabel = message; }
      if (glyph) glyph.textContent = iconPaths[kind] || "↗";
    };
    document.addEventListener("pointermove", event => {
      if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
      aimX = event.clientX; aimY = event.clientY;
      if (!pointerActive) {
        pointerActive = true;
        x = aimX; y = aimY;
        trails.forEach(t => { t.x = aimX; t.y = aimY; t.node.classList.add("is-visible"); });
        orb.classList.add("is-visible");
      }
      setIntent(event.target);
      wake();
      // Spotlight CSS variables updated without re-rendering elements.
      const surface = event.target.closest?.(".spotlight-surface, .motion-lit");
      if (surface) {
        const r = surface.getBoundingClientRect();
        surface.style.setProperty("--spotlight-x", `${event.clientX - r.left}px`);
        surface.style.setProperty("--spotlight-y", `${event.clientY - r.top}px`);
      }
      if (light) light.style.transform = `translate3d(${((aimX / innerWidth)-.5)*38}px,${((aimY / innerHeight)-.5)*38}px,0)`;
    }, { passive: true });
    document.addEventListener("pointerout", event => {
      if (event.relatedTarget) return;
      pointerActive = false;
      hovered = null;
      orb.classList.remove("is-visible", "is-intent");
      trails.forEach(t => t.node.classList.remove("is-visible"));
      cancelAnimationFrame(frame); frame = 0;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        pointerActive = false;
        orb.classList.remove("is-visible", "is-intent");
        trails.forEach(t => t.node.classList.remove("is-visible"));
        cancelAnimationFrame(frame); frame = 0;
      }
    });
  }

  // Existing personal photo lightbox, with keyboard and backdrop close support.
  const dialog = document.getElementById("photo-dialog");
  const image = document.getElementById("photo-expanded");
  const caption = document.getElementById("photo-caption");
  const captions = ["In the moment", "A little pause", "Work in progress"];
  document.querySelectorAll(".moment-card").forEach(card => {
    card.addEventListener("click", () => {
      const n = Number(card.dataset.photo || 1);
      if (!dialog?.showModal || !image || n < 1 || n > 3) return;
      image.src = `assets/moment-${n}.webp`;
      image.alt = card.querySelector("img")?.alt || "Expanded photograph";
      if (caption) caption.textContent = `0${n} / ${captions[n-1]}`;
      dialog.showModal();
    });
  });
  document.getElementById("photo-close")?.addEventListener("click", () => dialog?.close());
  dialog?.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
})();
