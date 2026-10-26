# Panduan Migrasi: Peta Suara Kota (Express + Prisma -> Laravel 13 + Inertia.js + MySQL)

Dokumen ini mencatat seluruh proses migrasi arsitektur dari stack lama ke stack baru.

---

## 1. Ringkasan Perubahan Arsitektur

| Aspek | Stack Lama | Stack Baru (Laravel 13) |
|---|---|---|
| **Backend Framework** | Node.js + Express.js + TypeScript | **Laravel 13 + PHP 8.3** |
| **Frontend Framework** | React 18 + Vite (SPA React Router) | **React 18 + Vite + Inertia.js v2** |
| **Database** | PostgreSQL + Prisma ORM | **MySQL 8.4 + Eloquent ORM** |
| **Autentikasi** | JWT (Bearer Token in LocalStorage) | **Laravel Session Cookie + CSRF Protection** (dengan kompatibilitas Bearer Token untuk API) |
| **State Management** | Zustand (Auth, Reports, Language) | **Zustand** (dipertahankan untuk performa real-time peta) + Inertia Page Props |
| **Sistem Geofencing** | GeoJSON Polygon Turf.js di Node & React | **`KecamatanService.php`** (ray-casting point-in-polygon) + Turf.js di Client |
| **Scoring Urgensi** | Rule-based regex NLP di TypeScript | **`UrgencyScorer.php`** (rule-based NLP regex dengan kamus kata kunci Kota Surabaya) |
| **Peta Interaktif** | Mapbox GL JS + SVG Custom Pins | **Mapbox GL JS + SVG Custom Pins** (identik 100%) |
| **Internasionalisasi** | Kustom `useTranslation` (ID/EN) | **`useTranslation` Hook** (dipertahankan 100% konsisten) |

---

## 2. Pemetaan Model & Database Schema

Semua tabel menggunakan Primary Key UUID (Binary/Char 36) yang di-generate otomatis via trait `HasUuids` pada model Eloquent:

1. **`kelurahans`**
   - Kolom: `id` (UUID), `kode_pos`, `name`, `kecamatan`, `kota`, `centroid_lat`, `centroid_lng`, `created_at`, `updated_at`.
2. **`categories`**
   - Kolom: `id` (UUID), `name`, `type` (`INFRASTRUKTUR`, `KEBERSIHAN`, `KEAMANAN`, `BANJIR`, `LAINNYA`), `icon`, `color`, `description`, `base_score`.
3. **`users`**
   - Kolom: `id` (UUID), `name`, `email`, `password`, `role` (`WARGA`, `PETUGAS`, `ADMIN`, `SUPERADMIN`), `phone`, `avatar`, `kelurahan_id`, `is_active`.
4. **`reports`**
   - Kolom: `id` (UUID), `title`, `description`, `category`, `status` (`BARU`, `DIPROSES`, `SELESAI`, `DITOLAK`), `skor_urgensi`, `tingkat_urgensi`, `kecamatan`, `latitude`, `longitude`, `address`, `audio_transcript`, `photos` (JSON), `audio_url`, `user_id`, `kelurahan_id`, `category_id`.
   - Index spatial koordinat: `[latitude, longitude]`, `status`, `skor_urgensi`, `kecamatan`.
5. **`status_logs`**
   - Kolom: `id` (UUID), `report_id`, `from_status`, `to_status`, `note`, `changed_by_id`, `changed_at`.

---

## 3. Pemetaan Endpoint API Lama vs Baru

| Method | Endpoint Lama (Express) | Endpoint Baru (Laravel) | Controller / Action |
|---|---|---|---|
| POST | `/api/auth/register` | `/api/auth/register` | `Api\AuthController@register` |
| POST | `/api/auth/login` | `/api/auth/login` | `Api\AuthController@login` |
| POST | `/api/auth/logout` | `/api/auth/logout` | `Api\AuthController@logout` |
| GET | `/api/auth/me` | `/api/auth/me` | `Api\AuthController@me` |
| GET | `/api/kelurahans` | `/api/kelurahans` | `Api\KelurahanController@index` |
| GET | `/api/kelurahans/:id` | `/api/kelurahans/{id}` | `Api\KelurahanController@show` |
| GET | `/api/reports` | `/api/reports` | `Api\ReportController@index` |
| POST | `/api/reports` | `/api/reports` | `Api\ReportController@store` |
| GET | `/api/reports/viewport`| `/api/reports/viewport` | `Api\ReportController@viewport` |
| GET | `/api/reports/:id` | `/api/reports/{id}` | `Api\ReportController@show` |
| PATCH| `/api/reports/:id/status` | `/api/reports/{id}/status` | `Api\ReportController@updateStatus` |
| DELETE| `/api/reports/:id` | `/api/reports/{id}` | `Api\ReportController@destroy` |
| GET | `/api/stats/overview` | `/api/stats/overview` | `Api\StatsController@overview` |
| GET | `/api/stats/leaderboard` | `/api/stats/leaderboard` | `Api\StatsController@leaderboard` |

---

## 4. Pemetaan Halaman Web (Inertia Pages)

| URL | Komponen Inertia | Keterangan |
|---|---|---|
| `/` | `Pages/Landing.tsx` | Halaman landing publik dengan statistik ringkas dan tombol quick role |
| `/peta` | `Pages/MapPage.tsx` | Peta interaktif Surabaya Mapbox dengan panel filter, time slider, dan modal laporan |
| `/login` | `Pages/Auth/Login.tsx` | Halaman login dengan demo role switcher (`WARGA`, `PETUGAS`, `SUPERADMIN`) |
| `/register` | `Pages/Auth/Register.tsx`| Halaman pendaftaran warga baru Surabaya |
| `/dashboard` | `Pages/Dashboard.tsx` | Dashboard riwayat laporan warga |
| `/leaderboard` | `Pages/Leaderboard.tsx` | Peringkat responsivitas kelurahan & keterlibatan warga |
| `/petugas` | `Pages/Petugas/Dashboard.tsx` | Command center penanganan pengaduan petugas lapangan |
| `/superadmin` | `Pages/Admin/Dashboard.tsx` | Dashboard analitik superadmin |
| `/superadmin/master` | `Pages/Admin/MasterData.tsx` | Manajemen data master kelurahan & kategori |
| `/laporan/{id}` | `Pages/Reports/Show.tsx` | Detail laporan dan riwayat status timeline |

---

## 5. Akun Pengujian (Demo Accounts)

Semua akun terisi otomatis via `DatabaseSeeder`:
- **WARGA:** `warga@surabaya.go.id` / `password123`
- **PETUGAS:** `petugas@surabaya.go.id` / `password123`
- **SUPERADMIN:** `superadmin@surabaya.go.id` / `password123`
