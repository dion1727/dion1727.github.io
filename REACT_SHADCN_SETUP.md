# Optional React + shadcn component setup

The live website uses plain HTML/CSS/JavaScript and **does not require npm**. The animations in the site are adapted to this runtime for reliable GitHub Pages hosting.

If you later start a separate React/Next.js migration:

```bash
npx create-next-app@latest dion-portfolio-react --typescript --tailwind --eslint --app
cd dion-portfolio-react
npx shadcn@latest init
npm install @radix-ui/react-slot motion matter-js gsap lucide-react @hugeicons/react @hugeicons/core-free-icons
```

Next.js with the default alias `@/*` points to the project root. Place reusable components under `/components/ui/` because the provided snippets import from `@/components/ui/spotlight`, and keep helpers in `/lib/utils.ts`. The standard global Tailwind stylesheet is `/app/globals.css`. If shadcn chooses `/src/components/ui`, either adapt the `@` alias/imports accordingly or create `/components/ui` and keep imports consistent.

Existing optional component files, including `spotlight.tsx` and `intent-label.tsx`, are supplied as reference code. They are *not automatically installed* into the current static site. The V5 native effects use `site.js`/`styles.css` instead. See `components/ui/REFERENCE_COMPONENTS.md`.
