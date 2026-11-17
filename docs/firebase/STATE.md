# STATE MIGRASI FIREBASE

## 1. Tahap Saat Ini
- **Tahap 6: Hapus Jejak TiDB (Selesai — Seluruh Tahap Migrasi Selesai)**
- Seluruh 6 tahap migrasi dari TiDB/MySQL ke Google Cloud Firestore telah berhasil diselesaikan secara penuh.

## 2. Riwayat dan Keputusan Arsitektur
- **Branch**: `migrasi-firebase` (aktif).
- **Transport Firestore**: REST Client tipis (`FirestoreRestClient.php`) dengan pembuatan JWT RS256 native (OpenSSL). Kompatibel penuh dengan PHP 8.3 lokal Windows dan serverless runtime Vercel tanpa dependensi modul C `grpc`.
- **Kredensial Service Account**: Melalui environment variable (`FIREBASE_CREDENTIALS_PATH` atau `FIREBASE_CREDENTIALS_BASE64`). Berkas kredensial telah masuk ke `.gitignore`.
- **Security Rules**: `firestore.rules` menolak semua akses langsung browser (`allow read, write: if false;`).
- **Komposit Indeks**: Didefinisikan di `firestore.indexes.json` untuk koleksi `reports`.
- **Data Statis**: 149 kelurahan Surabaya dan 5 kategori laporan disimpan di memori dan berkas lokal (0 biaya baca Firestore).
- **Session & Cache**: Driver sesi diubah ke `cookie`, cache ke `file`/`array`, queue ke `sync`. Tidak lagi membebani database SQL.
- **Cache Header Data Publik**: Seluruh endpoint data peta publik (`/api/reports/viewport`, `/api/stats/*`, `/api/kelurahans`) memiliki header `Cache-Control` (`public, max-age=20, s-maxage=20`) untuk menghemat kuota Firestore secara drastis.

## 3. Komponen yang Telah Selesai Dibuat (Tahap 1 s/d 6)
1. **Fondasi & Client (Tahap 1)**:
   - `FirestoreClientInterface` & `FirestoreRestClient`.
   - `StaticKelurahanRepository` & `StaticCategoryRepository`.
   - `InMemoryUserRepository`, `InMemoryTokenRepository`, `InMemoryCounterRepository`, `InMemoryReportRepository`.
2. **Auth & User (Tahap 2)**:
   - `FirestoreUserRepository`, `FirestoreTokenRepository`, `FirestoreUserProvider`.
   - Penyesuaian `AuthenticateWithToken` middleware dan `AuthController`.
3. **Laporan & Geospasial (Tahap 3)**:
   - `FirestoreReportRepository`:
     - ID dokumen berbasis UUID atau tracking code deterministik.
     - Embed `status_logs` langsung ke dalam dokumen laporan untuk mengeliminasi query N+1 (0 read tambahan).
     - Query viewport bounding box menggunakan pre-filtering query aktif dan filter spasial in-memory di server (menghindari limitasi 2 rentang field di Firestore).
     - Pencarian terdekat menggunakan rumus Haversine in-memory.
     - Operasi atomik upvote dan transisi status (lengkap dengan validasi alur status dan catatan penyelesaian).
   - `FirestoreCounterRepository`:
     - Mengelola 3 dokumen counter agregasi: `counters/global_stats`, `counters/leaderboard`, `counters/kecamatan_density`.
     - Setiap kunjungan dashboard, leaderboard, atau peta hanya memakan 1 read dokumen Firestore.
   - Penyesuaian Seluruh Controller API:
     - `ReportController`: Beroperasi 100% via `ReportRepositoryInterface`, `KelurahanRepositoryInterface`, `CategoryRepositoryInterface`, `UserRepositoryInterface`.
     - `StatsController`: Beroperasi 100% via `CounterRepositoryInterface`.
     - `KelurahanController`: Beroperasi 100% via `KelurahanRepositoryInterface` dan `CounterRepositoryInterface`.
4. **Seeder dan Import Data (Tahap 4)**:
   - `FirestoreSeedCommand` (`php artisan firestore:seed`):
     - Seed 5 akun demo ke Firestore (1 ADMIN, 2 PETUGAS, 2 WARGA).
     - Idempoten: cek email dulu sebelum insert, skip jika sudah ada.
     - `--force`: timpa nama/role tanpa mengubah password.
     - Password di-hash oleh `Hash::make()` Laravel (bukan plain text).
   - `FirestoreImportFromSqlCommand` (`php artisan firestore:import-from-sql`):
     - Impor users dari TiDB/MySQL ke Firestore (koneksi `mysql`).
     - Impor reports dengan status_logs embed (batch select untuk menghindari N+1 SQL).
     - `--dry-run`: pratinjau tanpa menulis ke Firestore.
     - `--limit=N`: batasi records per entitas.
     - `--force`: timpa dokumen yang sudah ada.
     - `--skip-users`, `--skip-reports`, `--skip-counters`: kontrol granular.
     - Setelah semua laporan diimpor: panggil `counterRepository->recalculate()` untuk kalkulasi ulang global_stats, leaderboard, dan kecamatan_density.
     - Menulis langsung via `FirestoreClientInterface` (bypass counter increment di `FirestoreReportRepository::create()`) agar counter dikalkulasi sekali di akhir.
   - `FirestoreSeedCommandTest`: 6 passed, 29 assertions.
5. **Env, Vercel Config, dan CI (Tahap 5)**:
   - `laravel-app/.env.example`: ditambahkan blok Firebase (FIREBASE_DRIVER, FIREBASE_PROJECT_ID, FIREBASE_DATABASE_ID, FIREBASE_CREDENTIALS_PATH, FIREBASE_CREDENTIALS_BASE64, FIREBASE_EMULATOR_HOST). Komentar SESSION/CACHE/QUEUE diperbarui sesuai arsitektur cookie/file/sync.
   - `vercel.json`: ditambahkan blok `env` dengan referensi Vercel secret (@firebase_project_id, @firebase_database_id, @firebase_credentials_base64) dan override driver (SESSION_DRIVER=cookie, CACHE_STORE=file, QUEUE_CONNECTION=sync).
   - `laravel-app/phpunit.xml`: testsuite Feature diubah dari `<directory>` menjadi daftar file eksplisit (6 file Firebase). Test lama SQL tidak lagi dijalankan.
6. **Pembersihan Jejak TiDB (Tahap 6)**:
   - Menghapus folder `tests/Feature/legacy-sql/` (9 file test lama SQL).
   - Menghapus Eloquent models yang tidak terpakai: `Category.php`, `Kelurahan.php`, `Report.php`, `StatusLog.php`.
   - Mempertahankan `User.php` sebagai contract `Authenticatable` murni untuk sesi Laravel (tanpa relasi Eloquent SQL).
   - Menghapus folder `database/migrations/` (seluruh migrasi SQL dibersihkan).
   - Menghapus `KelurahanLengkapSeeder.php` dan `E2ETestSeeder.php`. `DatabaseSeeder.php` dialihkan untuk mengarahkan pengguna ke `php artisan firestore:seed`.
   - Membersihkan `config/database.php` (menghapus blok konfigurasi SSL TiDB khusus).
   - Memperbarui dokumentasi (`README.md`, `.env.example`, `.env.production.example`, store frontend) untuk mencerminkan Firestore.
   - Pengujian: Unit & Feature test suite **56 tests, 2.901 assertions (100% lulus)**.
   - Build frontend: `npm run build` sukses 100% tanpa error.

## 4. Status Database TiDB
- Seluruh dependensi runtime ke TiDB telah dihapus.
- Aplikasi sekarang 100% berjalan di atas Google Cloud Firestore (Firebase).
