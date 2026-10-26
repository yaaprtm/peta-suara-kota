# Peta Suara Kota (Surabaya) — Laravel 13 + Inertia.js + MySQL

Sistem pemetaan partisipatif dan pemantauan pengaduan masyarakat Kota Surabaya berbasis geospasial real-time, NLP scoring urgensi otomatis, dan perankingan kelurahan.

---

## 🛠️ Tech Stack

- **Backend:** Laravel 13, PHP 8.3, Eloquent ORM
- **Database:** MySQL 8.4 (`peta_suara_kota`)
- **Frontend:** React 18, Inertia.js v2, TypeScript, Tailwind CSS
- **Maps:** Mapbox GL JS, GeoJSON Polygon Bounding-Box (31 Kecamatan Surabaya)
- **State Management:** Zustand + LocalStorage Persistence
- **i18n:** Sistem dwibahasa (Bahasa Indonesia & English)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat Sistem
- PHP 8.3+
- Composer
- Node.js 18+ & npm
- MySQL 8.0+ (Port 3306)

### 2. Konfigurasi Lingkungan (`.env`)
Pastikan konfigurasi database di file `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=peta_suara_kota
DB_USERNAME=root
DB_PASSWORD=

VITE_MAPBOX_TOKEN=your_mapbox_public_token_here
```

### 3. Migrasi & Seed Database
Jalankan perintah berikut untuk membuat skema tabel dan mengisi 75 data laporan contoh, 40 kelurahan Surabaya, 5 kategori, dan akun demo:
```bash
php artisan migrate:fresh --seed
```

### 4. Menjalankan Server Development
Jalankan server Laravel dan Vite secara berdampingan:

**Terminal 1 (Laravel Server):**
```bash
php artisan serve
```

**Terminal 2 (Vite Frontend):**
```bash
npm run dev
```

Aplikasi dapat diakses di browser melalui: **`http://127.0.0.1:8000`**

### 5. Build Production Aset
Untuk mengompilasi bundel aset untuk lingkungan produksi:
```bash
npm run build
```

---

## 🧪 Menjalankan Automated Tests

Aplikasi dilengkapi dengan test suite lengkap (Unit Tests, Database Schema, Seeder, Report API, Inertia Pages, dan End-to-End Integration):
```bash
php artisan test
```

Semua 28 test cases mencakup:
- `UrgencyScorerTest`: Analisis kata kunci darurat dan scoring NLP
- `DatabaseSchemaTest`: Integritas skema MySQL, Foreign Key, dan Indexes
- `DatabaseSeederTest`: Verifikasi jumlah dan sebaran data seeder
- `ReportApiTest`: REST API CRUD, validasi geofencing, dan filter viewport
- `InertiaPagesTest`: Rendering komponen frontend Inertia pada 10 halaman
- `EndToEndIntegrationTest`: Siklus hidup lengkap laporan dari warga hingga penyelesaian oleh petugas

---

## 👤 Akun Pengujian Demo (Cepat)

Tersedia tombol satu klik untuk masuk sebagai peran berikut pada halaman login:
- **Warga Surabaya:** `warga@surabaya.go.id` / `password123`
- **Petugas Lapangan:** `petugas@surabaya.go.id` / `password123`
- **Superadmin Pemkot:** `superadmin@surabaya.go.id` / `password123`

---

## 📂 Struktur Direktori Utama

```
laravel-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/                # ReportController, AuthController, StatsController, KelurahanController
│   │   └── Requests/               # StoreReportRequest (Validasi Geofence & Input)
│   ├── Models/                     # User, Report, Kelurahan, Category, StatusLog
│   ├── Policies/                   # ReportPolicy (Otorisasi peran)
│   └── Services/                   # UrgencyScorer (NLP), KecamatanService (Point-in-Polygon)
├── database/
│   ├── migrations/                 # Migrasi MySQL lengkap
│   └── seeders/                    # DatabaseSeeder (75 laporan Surabaya nyata)
├── resources/
│   ├── css/                        # app.css (Desain sistem & tokens)
│   └── js/
│       ├── Components/             # UI, MapView, MapFilterBar, ReportForm, Badges
│       ├── Pages/                  # Landing, MapPage, Dashboard, Leaderboard, Reports, Auth
│       ├── stores/                 # Zustand authStore, reportsStore, langStore
│       ├── lib/                    # api.ts (HTTP client), kecamatan.ts
│       └── i18n/                   # id.ts, en.ts, useTranslation.ts
├── routes/
│   ├── web.php                     # Rute halaman web Inertia
│   ├── api.php                     # REST API endpoints
│   └── auth.php                    # Rute autentikasi
└── tests/                          # 28 Unit & Feature test cases
```
