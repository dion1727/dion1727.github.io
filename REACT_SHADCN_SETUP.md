# Komponen React Bits (opsional untuk migrasi)

Website portofolio yang bisa langsung dijalankan tetap menggunakan **HTML, CSS, dan JavaScript**. Ini sengaja dipertahankan agar game, galeri foto, GitHub Pages, dan GitHub Activity yang sudah berjalan tidak berubah. Tidak perlu menjalankan `npm install` untuk website asli.

## Efek yang SUDAH aktif di website sekarang

| Referensi efek | Adaptasi website HTML saat ini |
|---|---|
| SwarmCursor | Partikel mengikuti mouse pada `#ambient-swarm` **di belakang seluruh konten**, tanpa menutupi teks dan tombol |
| Spotlight | Sorotan lokal di foto, kartu skill, dan panel game; border glow halus |
| ScrollTrigger / cinematic footer | Scroll reveal yang reset saat masuk-keluar viewport dari atas maupun bawah, plus footer glass |
| FolderFloat | Tombol **Quick links** yang membuka tautan asli dengan animasi bertahap |
| BellToggle | Tombol **Motion on / Motion off** dengan animasi lonceng dan pengaturan yang benar-benar bekerja |
| MagneticButton | Gerakan hover tombol navigasi/hero kecil, tanpa memengaruhi tombol gameplay |

Semua efek utama untuk website statis ada di `site.js` dan `styles.css`. Efek cursor tidak memakai WebGL yang berat dan menonaktifkan diri pada perangkat sentuh atau saat Reduced Motion aktif.

## Source React untuk penggunaan di masa depan

Di `components/ui/` tersedia:

- `spotlight.tsx`, `spotlight-demo.tsx`
- `FolderFloat.jsx` + `FolderFloat.css` (membutuhkan `matter-js`)
- `SwarmCursor.jsx` + `SwarmCursor.css`
- `BellToggle.jsx` + `BellToggle.css` (membutuhkan `motion`, `@hugeicons/react`, dan `@hugeicons/core-free-icons`)
- `personal-photo-card.tsx`, `intent-label.tsx`, `intent-label.css`

**File React tersebut belum diimpor ke `index.html`.** Source ini adalah referensi untuk migrasi, bukan kode yang bisa langsung dijalankan browser tanpa React. Adaptasi HTML statis di atas yang aktif sekarang.

## Jika nanti ingin memakai React + Tailwind + TypeScript + shadcn

Dari terminal Windows, siapkan proyek baru menggunakan CLI:

```powershell
npx create-next-app@latest dion-portfolio-react --ts --tailwind --eslint --app --import-alias "@/*"
cd dion-portfolio-react
npx shadcn@latest init
npm install @radix-ui/react-slot clsx tailwind-merge lucide-react matter-js motion @hugeicons/react @hugeicons/core-free-icons gsap
npm run dev
```

Salin `components/ui/` dan `lib/utils.ts` ke root proyek React yang menggunakan alias `@/*` (untuk proyek dengan direktori `src`, tempatkan di `src/components/ui/` dan `src/lib/utils.ts`). Path `components/ui` penting untuk kesesuaian import `@/components/ui/spotlight` dan pola konvensi shadcn. Salin `assets/` ke `public/assets/`.

Komponen JavaScript JSX bisa dipakai dalam proyek TypeScript yang `allowJs` aktif, atau dikonversi ke TSX. Setiap komponen menggunakan client-side interaksi dan memerlukan `'use client'` pada Next.js. Untuk game dan radar, perlu adaptasi lifecycle ketika memindahkan `game.js` dan `radar.js` ke React; jangan salin kedua script ke server component.

**Privasi:** gambar `assets/moment-*.webp` yang kamu unggah termasuk foto pribadi; bila repository Public, gambar akan bisa diakses publik.
