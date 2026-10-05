# 🗺️ Peta Suara Kota

> Platform pelaporan aspirasi warga kota dengan peta interaktif, skor urgensi otomatis, dan penggeser waktu.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![Node](https://img.shields.io/badge/Node.js-24-339933?logo=node.js) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-PostGIS-4169E1?logo=postgresql) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## ✨ Fitur Utama

| Fitur | Deskripsi |
|-------|-----------|
| 🗺️ **Peta Interaktif Full-Screen** | Laporan sebagai marker berdenyut berdasarkan tingkat urgensi |
| 🔴 **Skor Urgensi Otomatis** | Analisis kata kunci Bahasa Indonesia (modular, siap diganti NLP) |
| 🕒 **Time Slider** | Filter laporan berdasarkan rentang tanggal dengan drag handle |
| 📍 **Clustering** | Laporan berdekatan dikelompokkan otomatis |
| 📝 **Form Laporan** | Teks + foto (drag & drop) + suara (Web Speech API) |
| ⚡ **Real-time** | Laporan baru muncul di peta tanpa reload (SSE) |
| 🏆 **Papan Skor Kelurahan** | Ranking berdasarkan kecepatan respons & resolusi |
| 👮 **Dashboard Petugas** | Kelola status laporan dengan histori lengkap |

---

## 🚀 Cara Install & Jalankan

### Prasyarat

- **Node.js** ≥ 18 dan **npm** ≥ 9
- **PostgreSQL** ≥ 14 dengan ekstensi **PostGIS**

### 1. Clone & Install

```bash
git clone <repo-url>
cd peta-suara-kota

# Install semua dependencies (root, frontend, backend)
npm install
```

### 2. Setup Database

Pastikan PostgreSQL berjalan. Buat database dan aktifkan PostGIS:

```sql
-- Di psql atau pgAdmin:
CREATE DATABASE peta_suara_kota;
\c peta_suara_kota
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 3. Konfigurasi Environment

```bash
# Salin file contoh environment
cp backend/.env.example backend/.env

# Edit sesuai konfigurasi database kamu
nano backend/.env
```

Isi minimal di `backend/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/peta_suara_kota?schema=public"
JWT_SECRET=ganti-dengan-string-acak-panjang-minimal-32-karakter
JWT_REFRESH_SECRET=ganti-dengan-string-lain-yang-berbeda
```

### 4. Migrasi & Seed Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Buat tabel di database
npm run prisma:migrate

# Isi dengan data demo (30-40 laporan realistis Surabaya)
npm run prisma:seed
```

### 5. Jalankan Lokal

```bash
# Jalankan frontend (port 5173) dan backend (port 3001) sekaligus
npm run dev
```

Buka browser: **http://localhost:5173**

---

## 👤 Akun Demo

| Role | Email | Password |
|------|-------|----------|
| 🏙️ **Warga** | `demo@petasuarakota.id` | `password123` |
| 👮 **Petugas** | `petugas1@petasuarakota.id` | `password123` |
| 🔑 **Admin** | `admin@petasuarakota.id` | `password123` |

---

## 📁 Struktur Folder

```
peta-suara-kota/
├── frontend/                    # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   ├── map/            # MapView, ReportDetailPanel, TimeSlider, MapFilterBar
│   │   │   ├── reports/        # ReportForm
│   │   │   └── ui/             # Badges, Spinner, dll
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── dashboard/      # Dashboard Petugas
│   │   │   ├── leaderboard/    # Papan Skor Kelurahan
│   │   │   └── MapPage.tsx     # Halaman utama peta
│   │   ├── stores/             # Zustand: auth, reports
│   │   ├── lib/                # API client, helpers
│   │   └── types/              # TypeScript types
│   └── tailwind.config.js      # Konfigurasi warna kustom
│
└── backend/                     # Node.js + Express + TypeScript
    ├── src/
    │   ├── routes/              # auth, reports, kelurahans, stats
    │   ├── middleware/          # auth.ts, errorHandler.ts
    │   ├── services/
    │   │   ├── urgencyScorer.ts # NLP modular - ganti dengan ML di sini
    │   │   ├── fileUpload.ts    # Multer (swap ke S3/Cloudinary)
    │   │   └── sse.ts           # Server-Sent Events real-time
    │   ├── lib/prisma.ts        # Prisma singleton
    │   └── prisma/seed.ts       # Data demo 40+ laporan
    └── prisma/schema.prisma     # Skema database
```

---

## 🗄️ Skema Database

```
users           — Akun warga, petugas, admin
reports         — Laporan dengan koordinat lat/lng, skor urgensi, foto, audio
status_logs     — Histori perubahan status laporan (untuk leaderboard)
kelurahans      — Master kelurahan dengan centroid koordinat
categories      — Kategori laporan dengan base score urgensi
refresh_tokens  — Token JWT refresh
```

### Relasi Utama
- `users` → `reports` (1 user bisa buat banyak laporan)
- `reports` → `status_logs` (setiap perubahan status tercatat)
- `kelurahans` → `reports` & `users` (kelurahan punya banyak laporan)

---

## 🎨 Sistem Warna

Palet hangat berbasis tanah liat — menghindari biru korporat generik:

| Token | Hex | Penggunaan |
|-------|-----|------------|
| `terracotta-500` | `#C0482A` | Warna utama, CTA, marker kritis |
| `bark-900` | `#26190C` | Background utama |
| `cream-300` | `#FFE5A0` | Slider thumb, aksen |
| `smoke-300` | `#C5B09A` | Teks sekunder |

---

## 🧠 Sistem Urgensi

File: `backend/src/services/urgencyScorer.ts`

Skoring berbasis kata kunci Bahasa Indonesia dengan bobot tier:

| Tier | Bobot | Contoh kata kunci |
|------|-------|-------------------|
| 🚨 Darurat | +20 | darurat, kritis, bahaya, korban, terluka |
| 🔴 Tinggi | +12 | banjir, jebol, amblas, tumbang, kebakaran |
| 🟠 Sedang | +6 | rusak parah, genangan, macet, mendesak |
| 🟡 Rendah | +2 | rusak, kotor, kurang berfungsi |

**Swap ke ML**: Ganti body fungsi `analyzeUrgency()` tanpa mengubah file lain.

---

## 🔌 API Endpoints

```
POST /api/auth/register      — Daftar akun
POST /api/auth/login         — Login (dapat JWT)
POST /api/auth/refresh       — Refresh token
POST /api/auth/logout        — Logout

GET  /api/reports            — Semua laporan (filter: date, category, status, score)
POST /api/reports            — Buat laporan baru (multipart/form-data)
GET  /api/reports/:id        — Detail laporan + status log
PATCH /api/reports/:id/status — Update status (petugas/admin)
GET  /api/reports/stream     — SSE stream untuk real-time updates

GET  /api/kelurahans         — Daftar kelurahan
GET  /api/stats/overview     — Statistik ringkasan
GET  /api/stats/leaderboard  — Ranking kelurahan
```
