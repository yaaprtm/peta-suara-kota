# Peta Suara Kota (Surabaya) 🏙️

Aplikasi pemetaan partisipatif dan pemantauan pengaduan masyarakat Kota Surabaya berbasis geospasial real-time, NLP urgensi otomatis, dan klasemen kelurahan responsif.

> **Catatan Migrasi:** Aplikasi ini telah berhasil dimigrasi dari stack lama (Express + Prisma + React SPA) ke arsitektur modern **Laravel 13 + Inertia.js v2 + React 18 + TypeScript + MySQL 8.4**. Seluruh kode sumber aplikasi kini berada di dalam direktori **`laravel-app/`**.

---

## 🛠️ Stack Teknologi

- **Backend:** Laravel 13, PHP 8.3, Eloquent ORM
- **Database:** MySQL 8.4
- **Frontend:** React 18, Inertia.js v2, TypeScript, Tailwind CSS
- **Peta Digital:** Mapbox GL JS, GeoJSON Polygon 31 Kecamatan Surabaya
- **State Management:** Zustand
- **i18n:** Sistem dwibahasa (Bahasa Indonesia & English)

---

## 🚀 Memulai Cepat

Masuk ke direktori aplikasi:
```bash
cd laravel-app
```

### 1. Jalankan Migrasi & Database Seeder
```bash
php artisan migrate:fresh --seed
```

### 2. Jalankan Server Pengembangan
```bash
# Terminal 1 — Laravel backend server
php artisan serve

# Terminal 2 — Vite asset server
npm run dev
```

Buka peramban di: **`http://127.0.0.1:8000`**

### 3. Akun Pengujian Cepat (One-Click Demo)
- **Warga Surabaya:** `warga@surabaya.go.id` / `password123`
- **Petugas Command Center:** `petugas@surabaya.go.id` / `password123`
- **Superadmin Pemkot:** `superadmin@surabaya.go.id` / `password123`

### 4. Eksekusi Pengujian Otomatis
```bash
php artisan test
```

Untuk rincian arsitektur dan panduan lengkap, lihat [laravel-app/MIGRATION_GUIDE.md](file:///c:/Users/user/Desktop/PROJEK%20MATKUL%20WORKSHOP%20(PETA%20SUARA%20KOTA)/laravel-app/MIGRATION_GUIDE.md) dan [laravel-app/README.md](file:///c:/Users/user/Desktop/PROJEK%20MATKUL%20WORKSHOP%20(PETA%20SUARA%20KOTA)/laravel-app/README.md).
