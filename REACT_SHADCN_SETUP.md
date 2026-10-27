# Integrasi React + shadcn (opsional)

## Kode utama dan alasan
Repository ini berasal dari **HTML + CSS + JavaScript murni**, jadi tidak menggunakan React/TypeScript.
Website yang langsung bisa digunakan di GitHub Pages adalah `index.html`, `styles.css`, `site.js`, `game.js`, dan `radar.js`.
Efek spotlight, galeri, scroll reveal dan intent-cursor telah **diintegrasikan pada website statis** supaya tiga game yang ada tetap berjalan.

## Versi komponen React yang disertakan
- `/components/ui/spotlight.tsx` — Spotlight sesuai komponen React yang diminta.
- `/components/ui/intent-label.tsx` + `intent-label.css` — sumber yang diberikan, plus CSS dasar.
- `/components/ui/spotlight-demo.tsx` dan `personal-photo-card.tsx` — contoh penggunaan.
- `/lib/utils.ts` — fungsi `cn` standar shadcn.

Direktori `/components/ui` penting agar import `@/components/ui/spotlight` tetap konsisten dengan standar shadcn. Jangan mengimpor file-file TSX ke website HTML yang sekarang: perlu React bundler terlebih dahulu.

## Migrasi bila ingin React/shadcn sungguhan

Untuk proyek Next.js + Tailwind + TypeScript baru:

```bash
npx create-next-app@latest dion-portfolio-react --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd dion-portfolio-react
npx shadcn@latest init
npm install @radix-ui/react-slot lucide-react clsx tailwind-merge
```

Salin `components/ui/`, `lib/utils.ts`, dan `assets` ke proyek React baru. Letakkan gambar di `public/assets/`.
Setelah itu komponen ini bisa dipanggil dari file client `app/page.tsx`:

```tsx
import PersonalPhotoCard from "@/components/ui/personal-photo-card";

export default function Page() {
 return <main className="grid gap-5 p-8 md:grid-cols-3">
  <PersonalPhotoCard src="/assets/moment-1.webp" alt="Portrait" caption="In the moment" />
  <PersonalPhotoCard src="/assets/moment-2.webp" alt="Outdoor portrait" caption="A little pause" />
  <PersonalPhotoCard src="/assets/moment-3.webp" alt="Working session" caption="Work in progress" />
 </main>
}
```

Next.js source baru memerlukan adaptasi `game.js` dan `radar.js` menjadi hooks/client-only agar tidak bentrok dengan lifecycle React. Karena itu paket deploy saat ini tetap memakai versi HTML yang sudah berfungsi.

### Dependencies
React / React DOM / TypeScript / Tailwind / Next.js disiapkan oleh `create-next-app`; `@radix-ui/react-slot` dipakai Spotlight; `clsx` dan `tailwind-merge` dipakai `cn`; `lucide-react` tersedia untuk ikon React tambahan.

## Efek Motion V2 yang dipakai pada website asli

Komponen React `Spotlight` dan `IntentLabel` tersedia sebagai contoh migrasi, tetapi deployment GitHub Pages memakai CSS/JS vanilla yang setara dari `site.js` dan `styles.css`. **Tidak perlu npm install** untuk menjalankan website asli. Efek ini kompatibel dengan foto lokal di `assets/` dan tidak memakai gambar stok Unsplash.
