# Peta Suara Kota (Surabaya)

Sistem pemetaan partisipatif dan pemantauan pengaduan masyarakat Kota Surabaya berbasis geospasial real-time, NLP scoring urgensi otomatis, dan perankingan kelurahan.

> Dibuat sebagai proyek matakuliah Workshop Rekayasa Perangkat Lunak.

## ⚡ Performance-Optimized

**Heavily optimized for production:**
- 🚀 **90% smaller bundle size** (1.9 MB → 200 KB initial)
- ⚡ **71% faster first paint** (4.2s → 1.2s)
- 🎯 **Lighthouse score 85+** (was 45)
- 📦 Lazy loading, code splitting, virtualization
- 🖼️ Progressive image loading with skeletons
- 💨 Smooth 60 FPS experience

See [PERFORMANCE-OPTIMIZATION.md](./PERFORMANCE-OPTIMIZATION.md) and [OPTIMIZATION-SUMMARY.md](./OPTIMIZATION-SUMMARY.md) for details.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Laravel 13, PHP 8.3, Eloquent ORM |
| Database | TiDB Cloud (MySQL-compatible, port 4000, SSL/TLS) |
| Frontend | React 18, Inertia.js v2, TypeScript, Tailwind CSS v3 |
| Peta | Mapbox GL JS v3, GeoJSON 31 Kecamatan Surabaya |
| State | Zustand v5 + LocalStorage persistence |
| i18n | Dwibahasa ID/EN (custom lightweight hook) |
| Upload | Cloudflare R2 / AWS S3 (via league/flysystem-aws-s3-v3) |
| Deploy | Vercel (vercel-php runtime) |
| Testing | PHPUnit 12, Laravel TestCase |
| Lint/Format | ESLint 9 (flat config) + Prettier 3 |

---

## 🚀 Panduan Menjalankan Aplikasi (Lokal)

### 1. Prasyarat Sistem
- PHP 8.3+ dengan ekstensi `pdo_mysql`, `gd`, `fileinfo`, `mbstring`
- Composer 2.x
- Node.js 18+ & npm
- MySQL 8.0+ lokal **atau** TiDB Cloud (production)
- Mapbox account (untuk peta interaktif)

### 2. Clone & Install

```bash
git clone <repo-url>
cd laravel-app

# Install dependencies
composer install
npm install
```

### 3. Konfigurasi `.env`

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env`:

```env
APP_NAME="Peta Suara Kota"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=peta_suara_kota
DB_USERNAME=root
DB_PASSWORD=

SESSION_DRIVER=database
CACHE_STORE=database

VITE_APP_NAME="Peta Suara Kota"
VITE_MAPBOX_TOKEN=pk.eyJ1...         # Diwajibkan untuk peta
```

### 4. Migrasi & Seeding Demo

```bash
php artisan migrate
php artisan db:seed
```

Seeder akan membuat:
- 8 akun demo (1 ADMIN, 2 PETUGAS, 5 WARGA)
- 40 kelurahan Surabaya dengan koordinat centroid
- 5 kategori laporan dengan base score
- 75 laporan demo realistis dengan variasi status dan urgensi

### 5. Build Frontend

```bash
npm run build
# atau untuk development dengan hot-reload:
npm run dev
```

### 6. Jalankan Server

```bash
php artisan serve
# Buka http://localhost:8000
```

---

## 👤 Akun Demo

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@petasuarakota.id` | `password123` |
| PETUGAS | `petugas.pu@petasuarakota.id` | `password123` |
| PETUGAS | `petugas.satpol@petasuarakota.id` | `password123` |
| WARGA | `demo@petasuarakota.id` | `password123` |

---

## 📚 Struktur Halaman

| URL | Akses | Deskripsi |
|---|---|---|
| `/` | Publik | Landing page + statistik live + tracking laporan |
| `/peta` | Publik | Peta interaktif Mapbox + filter + time slider |
| `/laporan/:id` | Publik | Detail laporan + timeline status |
| `/leaderboard` | Publik | Peringkat kelurahan terbaik |
| `/dashboard` | WARGA | Laporan saya + statistik personal |
| `/petugas` | PETUGAS | Command center antrean urgensi |
| `/superadmin` | ADMIN+ | Statistik kota + manajemen pengguna |
| `/superadmin/master` | ADMIN+ | Konfigurasi kategori, level, akun |

---

## 🔌 API Endpoints

### Auth
```
POST   /api/auth/register        Daftar akun warga baru
POST   /api/auth/login           Login (session-based)
POST   /api/auth/logout          Logout
GET    /api/auth/me              Profil pengguna aktif
```

### Reports
```
GET    /api/reports              List laporan (paginasi)
POST   /api/reports              Buat laporan baru [AUTH]
GET    /api/reports/viewport     Filter per bounding box peta
GET    /api/reports/track/{code} Cari laporan by tracking code
POST   /api/reports/{id}/upvote  Dukung laporan (publik)
GET    /api/reports/{id}         Detail laporan
PATCH  /api/reports/{id}/status  Update status [PETUGAS+]
DELETE /api/reports/{id}         Hapus laporan [OWNER/ADMIN]
GET    /api/reports/export       Export CSV [ADMIN+]
```

### Stats
```
GET    /api/stats/overview       Statistik kota (total, byDay, highUrgency)
GET    /api/stats/leaderboard    Peringkat kelurahan
```

### Users (Admin only)
```
GET    /api/users                List semua pengguna [ADMIN+]
PATCH  /api/users/{id}/role      Ubah role pengguna [ADMIN+]
PATCH  /api/users/{id}/toggle-active  Toggle aktif/nonaktif [ADMIN+]
```

### Kelurahans
```
GET    /api/kelurahans           List kelurahan Surabaya
GET    /api/kelurahans/{id}      Detail kelurahan
GET    /api/kelurahans/geo/bounds Batas geografis Surabaya
```

---

## 🧪 Testing

```bash
# Jalankan semua test
php artisan test

# Test spesifik
php artisan test tests/Feature/ReportApiTest.php
php artisan test tests/Feature/RoleAccessMatrixTest.php

# Frontend typecheck
npm run typecheck
```

---

## 🚢 Deployment ke Vercel

### Prasyarat
- Akun Vercel dengan vercel-php runtime
- Database MySQL (PlanetScale / Neon / Aiven)
- Object storage S3-compatible (Cloudflare R2 / AWS S3)

### Langkah

1. **Push ke GitHub** dan hubungkan repo ke Vercel

2. **Set Environment Variables** di Vercel dashboard:

```env
APP_KEY=base64:...
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-app.vercel.app

# TiDB Cloud — MySQL-compatible, port 4000, SSL otomatis aktif
DB_CONNECTION=mysql
DB_HOST=gateway01.ap-northeast-1.prod.aws.tidbcloud.com
DB_PORT=4000
DB_DATABASE=peta_suara_kota
DB_USERNAME=your_tidb_username.root
DB_PASSWORD=your_tidb_password

SESSION_DRIVER=database
CACHE_STORE=database

FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=auto
AWS_BUCKET=peta-suara-kota
AWS_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

VITE_APP_NAME="Peta Suara Kota"
VITE_MAPBOX_TOKEN=pk.eyJ1...
```

3. **Jalankan migrasi setelah deploy pertama:**

```bash
vercel env pull .env.local
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder
```

Selengkapnya lihat [`PRODUCTION-CONFIG.md`](./PRODUCTION-CONFIG.md) dan [`STORAGE-SETUP.md`](./STORAGE-SETUP.md).

---

## 📐 Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Inertia.js Bridge                     │
│  (Server: Laravel renders page props → Client: React)   │
└──────────────┬──────────────────────┬───────────────────┘
               │                      │
   ┌───────────▼──────────┐  ┌────────▼────────────────┐
   │   Laravel Backend     │  │   React Frontend         │
   │   ─────────────────   │  │   ──────────────────     │
   │   Eloquent ORM        │  │   Zustand Stores         │
   │   UrgencyScorer       │  │   Mapbox GL JS           │
   │   GeofenceValidator   │  │   i18n (ID/EN)           │
   │   StatusWorkflow      │  │   SSE real-time          │
   │   StorageService      │  │   Inertia routing        │
   └───────────┬──────────┘  └────────────────────────┘
               │
   ┌───────────▼──────────────────────────────────────┐
   │             MySQL Database                        │
   │  users · kelurahans · reports · status_logs       │
   │  categories · sessions · cache                    │
   └──────────────────────────────────────────────────┘
```

---

## ⚙️ Konfigurasi Laporan

### Skor Urgensi (0–100)
Dihitung otomatis dari `UrgencyScorer` berdasarkan kata kunci NLP:

| Level | Skor | Contoh Kata Kunci |
|---|---|---|
| Kritis | 80–100 | darurat, korban, bahaya, mati |
| Tinggi | 60–79 | parah, rusak berat, mengganggu |
| Sedang | 35–59 | berlubang, kotor, bau |
| Rendah | 0–34 | kecil, ringan, biasa |

### Status Transitions
```
BARU → DIPROSES → SELESAI (terminal)
BARU → DITOLAK  → BARU (dapat diajukan ulang)
DIPROSES → BARU (kembalikan ke antrean)
```

### Tracking Code Format
`PSK-SBY-XXXXXX` — dibuat otomatis saat laporan pertama kali disimpan.

---

## 📁 Struktur Proyek

```
laravel-app/
├── app/
│   ├── Http/Controllers/Api/     # Auth, Report, Stats, User, Kelurahan
│   ├── Http/Middleware/          # EnsureUserHasRole
│   ├── Models/                   # User, Report, Kelurahan, Category, StatusLog
│   ├── Policies/                 # ReportPolicy
│   └── Services/                 # UrgencyScorer, GeofenceValidator, StatusWorkflow, Storage
├── database/
│   ├── migrations/               # Skema tabel lengkap
│   └── seeders/                  # DatabaseSeeder (75 laporan demo)
├── resources/js/
│   ├── Pages/                    # Landing, MapPage, Dashboard, Petugas, Admin, Reports
│   ├── Components/               # map/, reports/, ui/
│   ├── stores/                   # authStore, reportsStore, langStore
│   ├── lib/                      # api.ts, kecamatan.ts
│   ├── i18n/                     # id.ts, en.ts, useTranslation.ts
│   └── types/                    # index.ts (domain types)
├── routes/
│   ├── web.php                   # Inertia page routes + role middleware
│   └── api.php                   # REST API routes
├── tests/Feature/                # PHPUnit feature tests
├── vercel.json                   # Vercel deployment config
└── PRODUCTION-CONFIG.md          # Panduan konfigurasi produksi
```

---

## 📄 Lisensi

MIT License — Digunakan untuk keperluan akademik Workshop Rekayasa Perangkat Lunak.
