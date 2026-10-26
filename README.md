# Dion — Interactive Arcade & Portfolio

Repository tujuan: **dion1727/dion1727.github.io** (PUBLIC).

Aplikasi website glassmorphism dengan menu About, Expertise, Arcade, GitHub Activity, Contact, serta **Commit Quest**, **Pixel Snake**, dan **Commit Breaker** (JavaScript Canvas). Isi `index.html`, CSS dan JS langsung berada di root. Tidak perlu build atau npm.

## Pasang agar tidak 404

1. Buat repository baru dengan nama **dion1727.github.io** di akun **dion1727** (jangan mencampur dengan repo profil `dion1727/dion1727`).
2. Extract ZIP dan unggah **ISI** ZIP ke **root repository baru**. Pastikan `index.html` langsung terlihat di halaman utama repo, bukan berada di folder tambahan.
3. Commit, lalu Push origin jika memakai GitHub Desktop.
4. Pada repo baru masuk **Settings → Pages**. Pilih **Deploy from a branch → main → /(root) → Save**. Pantau **Actions/Pages** sampai deployment sukses.
5. Buka **https://dion1727.github.io/** setelah terbit (jangan pakai `/dion1727/`).
6. Perbarui `README.md` pada repo profil lama memakai ZIP patch yang disertakan terpisah, supaya semua tombol menuju domain root ini.

## URL dan fitur

- Portfolio: https://dion1727.github.io/
- Commit Quest: https://dion1727.github.io/?game=quest#arcade
- Pixel Snake: https://dion1727.github.io/?game=snake#arcade
- Commit Breaker: https://dion1727.github.io/?game=breaker#arcade
- GitHub Activity: https://dion1727.github.io/#contributions

Commit Quest: tabel tanggal berdasarkan kontribusi GitHub publik saat tersedia. Data realtime mengambil kalender mirror publik dan GitHub Events (jika kalender tak tersedia, label fallback menjelaskan mode parsial atau latihan). Workflow `.github/workflows/sync-contributions.yml` bisa dijalankan manual di tab Actions untuk membuat cache kontribusi `data/contributions.json`; dijadwalkan per jam jika diizinkan GitHub. Data tidak dibuat-buat. Catatan: commit otomatis dari `GITHUB_TOKEN` tidak selalu memicu build Pages baru; website tetap mencoba mengambil data kontribusi publik secara langsung saat dibuka.

## Menjalankan lokal

Double click `JALANKAN_WEBSITE_LOKAL.bat`, atau jalankan `py -m http.server 8000` dari folder ini dan buka http://127.0.0.1:8000/. Menggunakan file statis; web server harus berjalan untuk request JSON lokal.

**Catatan:** README GitHub tidak menjalankan JavaScript, jadi semua game interaktif berada di situs Pages ini. Akses link eksternal butuh internet dan bisa dibatasi rate limit/CORS. URL sosial berasal dari README lama, sebaiknya verifikasi alamat LinkedIn dan Discord.
