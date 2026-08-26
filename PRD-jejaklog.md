# PRD — Jejak.log
**Album Eksplorasi Digital dengan Peta Interaktif**

Status: Draft v1
Author: Putra
Working title: Jejak.log (bisa diganti — alternatif: Runut, Singgah)

---

## 1. Ringkasan Produk

Jejak.log adalah web app untuk mencatat dan menyimpan tempat-tempat yang sudah dikunjungi/dieksplorasi, lengkap dengan foto, video, dan lokasi di peta. Setiap entry ditandai sebagai pin di peta interaktif, sehingga user bisa melihat sebaran eksplorasi mereka secara visual dari waktu ke waktu.

Bukan travel-planner, bukan itinerary app — ini murni **arsip personal** yang fokus ke dokumentasi tempat yang sudah pernah dikunjungi.

## 2. Masalah yang Diselesaikan

- Foto & video eksplorasi tersebar di galeri HP tanpa konteks lokasi yang terstruktur
- Tidak ada cara cepat melihat "udah kemana aja gue" dalam bentuk visual/peta
- Aplikasi sejenis yang ada (GeoMark, TrailJournal, dll) berorientasi ke hiking/travel planning, bukan arsip eksplorasi personal minimalis

## 3. Target User

- Individu yang suka eksplorasi tempat (cafe, spot foto, alam, kota) dan mau dokumentasi rapi
- User yang butuh interface simpel, cepat, tanpa distraksi sosial (bukan platform sharing/komunitas)

## 4. Prinsip Desain

- **Monokrom, elegan** — palet warna dasar hitam/putih/abu-abu dengan aksen minimal
- **Theme switcher** — user bisa ganti tema (minimal: light, dark, + 1-2 varian aksen warna), tapi tetap dalam koridor monokrom/minimalis, bukan warna-warni
- **Tanpa emoji** — di UI maupun copy/microcopy
- **Icon boleh** — pakai icon set konsisten (contoh: Lucide/Phosphor), bukan ilustrasi dekoratif
- **Tidak generic "AI slop"** — hindari gradient berlebihan, drop shadow tebal, rounded-everything tanpa alasan, layout template SaaS pada umumnya

## 5. Fitur Inti (MVP)

### 5.1 Landing Page
- Hero section menjelaskan konsep produk secara singkat
- Preview visual (screenshot peta + album, bisa mock/statis)
- CTA masuk/daftar
- Tanpa emoji, tanpa stok foto generic — pakai screenshot produk asli atau ilustrasi vector minimalis

### 5.2 Autentikasi
- Login/register (email + password, atau OAuth Google)
- Album bersifat personal per akun (privat secara default)

### 5.3 Tambah Entry Eksplorasi
Form input terdiri dari:
- **Nama tempat** (text)
- **Tipe tempat** (dropdown/tag: alam, kuliner, kota, sejarah/budaya, custom — user bisa nambah tipe sendiri)
- **Foto** — upload dari galeri ATAU ambil langsung dari kamera device (`capture="environment"` untuk mobile, `getUserMedia` kalau mau custom camera UI), multi-foto per entry
- **Video** — sama seperti foto, support ambil langsung dari kamera, multi-video per entry (dengan batas durasi/ukuran wajar untuk mobile upload)
- **Lokasi** — pilih titik di peta (klik/drag pin) ATAU auto-detect dari Geolocation API device, dengan opsi cari lokasi via search (geocoding)
- **Catatan** (opsional, textarea bebas)
- **Tanggal kunjungan** (default: hari ini, bisa diubah manual)

### 5.4 Halaman Album (Grid View)
- Daftar semua entry dalam bentuk grid/list, thumbnail foto pertama
- Filter by tipe tempat, sort by tanggal
- Search by nama tempat
- Klik entry → detail view (semua foto/video, lokasi mini-map, catatan)

### 5.5 Halaman Peta (Map View)
- Peta interaktif menampilkan semua pin sesuai lokasi entry yang tersimpan
- Klik pin → popup preview (nama tempat, tipe, thumbnail) → link ke detail
- Cluster pin kalau lokasi berdekatan (biar tidak numpuk)
- Filter pin by tipe tempat langsung di map view

### 5.6 Detail Entry
- Galeri foto/video full (lightbox/carousel)
- Lokasi ditampilkan di mini-map
- Edit/hapus entry
- Metadata: tanggal ditambahkan, tanggal kunjungan, tipe

### 5.7 Pengaturan Tema
- Toggle antar tema tersedia (minimal light/dark), tersimpan sebagai preferensi user (localStorage atau di-attach ke akun)

### 5.8 Username & Profil Publik
- Setiap user punya **username** unik (dipilih saat onboarding, bisa diganti terbatas di settings)
- Halaman profil publik: `jejaklog.app/u/[username]` — nampilin bio singkat, jumlah tempat, dan album yang di-set publik
- User bisa toggle **per-entry** apakah suatu tempat publik atau privat (default: privat)

### 5.9 Share & Sosial (Level 2)
- **Like** — user lain bisa like sebuah entry publik
- **Komentar** — komentar singkat di entry publik (tanpa nested reply dulu, biar simpel)
- **Explore feed** — halaman nampilin entry-entry publik terbaru dari semua user (bisa difilter by tipe tempat)
- **Follow** (opsional, bisa nyusul kalau explore feed udah jalan) — user bisa follow user lain, feed bisa difilter "following only"
- Semua interaksi sosial ini scoped ke entry yang statusnya publik — entry privat tidak pernah muncul di like/comment/explore siapapun selain pemilik

## 6. Tech Stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js (App Router) — frontend + API routes sekaligus |
| Bahasa | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma atau Drizzle |
| Storage foto/video | Supabase Storage |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Peta | Leaflet.js + OpenStreetMap tiles (gratis, no API key) |
| Geocoding (search lokasi) | Nominatim (OSM) atau Mapbox Geocoding API (kalau butuh hasil lebih rapi) |
| Kamera | `<input capture>` untuk MVP; `getUserMedia`/`MediaRecorder` kalau nanti mau custom camera UI |
| Styling | Tailwind CSS |
| Deploy | Vercel |

Catatan: Supabase dipilih dibanding Postgres murni (mis. Neon) karena butuh Storage + DB + Auth dalam satu ekosistem, mengurangi kompleksitas integrasi untuk fitur foto/video/lokasi yang saling terkait.

## 7. Skema Data (Draf)

**users**
- id, email, username (unique), display_name, bio, theme_preference, created_at

**places** (entry eksplorasi)
- id, user_id (FK), name, type, latitude, longitude, notes, visited_at, is_public, created_at, updated_at

**place_types**
- id, user_id (FK, nullable untuk default type), label

**media**
- id, place_id (FK), type (photo/video), storage_url, thumbnail_url (untuk video), order_index, created_at

**likes**
- id, place_id (FK), user_id (FK), created_at
- unique constraint (place_id, user_id) — satu user cuma bisa like sekali per entry

**comments**
- id, place_id (FK), user_id (FK), content, created_at

**follows** (opsional, nyusul kalau explore feed sudah jalan)
- id, follower_id (FK ke users), following_id (FK ke users), created_at

## 8. Non-Functional Requirements

- Responsive — prioritas mobile-first (kemungkinan besar dipakai saat lagi eksplorasi/on-site)
- Upload foto/video dioptimasi (compress di client sebelum upload kalau ukuran besar)
- Peta tetap smooth walau pin banyak (pakai clustering)
- Privasi default: entry hanya terlihat oleh pemilik akun (publik hanya kalau di-toggle manual)
- Rate limiting untuk like/comment (cegah spam) — bisa pakai Supabase Edge Function atau middleware sederhana
- Moderasi dasar untuk komentar publik (minimal: user bisa report/hapus komentar di entry miliknya sendiri)

## 9. Di Luar Cakupan MVP (Future)

- Follow system dengan feed "following only" (nyusul setelah explore feed dasar jalan)
- Notifikasi (like/comment/follow baru) — apalagi real-time/push
- Kolaborasi multi-user dalam satu album
- Export data (PDF album, GPX, dll)
- Statistik eksplorasi (total tempat, peta heatmap, dsb)
- Offline mode / PWA

## 10. Fase Pengerjaan (Saran)

1. **Fase 1 — Fondasi**: setup Next.js + Supabase + Prisma/Drizzle, skema DB, auth
2. **Fase 2 — Core CRUD**: form tambah entry (tanpa kamera dulu, upload biasa), grid album, detail view
3. **Fase 3 — Peta**: integrasi Leaflet, pin dari data entry, klik lokasi di map buat set koordinat
4. **Fase 4 — Kamera & Media**: capture foto/video langsung dari device, multi-upload, lightbox
5. **Fase 5 — Tema & Landing Page**: theme switcher, polish landing page, icon set final
6. **Fase 6 — Username & Profil Publik**: onboarding username, halaman profil publik, toggle publik/privat per entry
7. **Fase 7 — Sosial (Level 2)**: like, komentar, explore feed publik
8. **Fase 8 — Polish & Deploy**: responsive check, optimasi upload, rate limiting, deploy ke Vercel

---

*Dokumen ini draft awal — struktur data dan fitur bisa disesuaikan lagi setelah wireframe/mockup dibuat.*
