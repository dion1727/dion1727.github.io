# Pemeriksaan sebelum GitHub Public

Foto pribadi dan tautan sosial **sengaja dipertahankan sesuai permintaan pemilik portofolio**. Foto itu dapat diunduh orang lain ketika repository Public. Hanya data privat dari komputer dan file development rahasia yang tidak boleh masuk.

## Periksa sebelum commit

1. Folder ini hanya berisi sumber website dan aset yang ditampilkan di browser. Jangan tambahkan `.env`, file token, SSH/private keys, password, foto lain dari laptop, arsip lokal, database, file audio, rekaman, atau hasil transkrip.
2. Cek tab **Changes** di GitHub Desktop; pastikan tidak ada nama pengguna Windows, lokasi direktori `C:\Users\...`, atau screenshot terminal/desktop berisi data sensitif.
3. Repo lama bisa masih menyimpan file yang pernah di-commit; `.gitignore` tidak membersihkan riwayat Git. Periksa tab **History** jika pernah memasukkan data pribadi.
4. Foto `assets/moment-1.webp`, `moment-2.webp`, `moment-3.webp` dan tautan sosial dipertahankan sesuai permintaan. Hapus secara manual jika suatu hari tidak ingin publik.
5. GitHub Pages gunakan Settings → Pages → Deploy from a branch → `main` / `(root)` dan upload **isi folder**, bukan ZIP atau folder pembungkus.

Catatan: `data/contributions.json` menyimpan data aktivitas GitHub yang bersifat publik, bukan file dari laptop.
