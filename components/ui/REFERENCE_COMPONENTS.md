# Optional React components (reference only)

The currently playable website is **static HTML/CSS/JavaScript**. Its effects are implemented in `site.js` and `styles.css`; the JSX/TSX files here are not loaded by the HTML.

Provided source: `BellToggle.jsx`, `FolderFloat.jsx`, `SwarmCursor.jsx`, `spotlight.tsx`, `intent-label.tsx`, `personal-photo-card.tsx`.

For a future shadcn/Next.js migration, follow `/REACT_SHADCN_SETUP.md` and install the listed dependencies. Keep all paths consistent with the `@/components/ui` alias.

Current static effect equivalents:
- BellToggle: functional `Motion on/off` with ringing animation. No fake notification promises.
- FolderFloat: accessible Quick Links with floating cards.
- SwarmCursor: a custom Canvas2D background cursor swarm behind all content.
- Spotlight: local card/photo light following pointer.
- ScrollTrigger concept: repeatable scroll reveal when scrolling in either direction, plus parallax and a breathing footer.
