# STATE MIGRASI FIREBASE

## 1. Tahap Saat Ini
- **Tahap 3: Laporan dan Geospasial (Selesai)**
- Menunggu instruksi pengguna ("lanjut") untuk memulai **Tahap 4: Migrasi Data dan Seeding**.

## 2. Riwayat dan Keputusan Arsitektur
- **Branch**: `migrasi-firebase` (aktif).
- **Transport Firestore**: REST Client tipis (`FirestoreRestClient.php`) dengan pembuatan JWT RS256 native (OpenSSL). Kompatibel penuh dengan PHP 8.3 lokal Windows dan serverless runtime Vercel tanpa dependensi modul C `grpc`.
- **Kredensial Service Account**: Melalui environment variable (`FIREBASE_CREDENTIALS_PATH` atau `FIREBASE_CREDENTIALS_BASE64`). Berkas kredensial telah masuk ke `.gitignore`.
- **Security Rules**: `firestore.rules` menolak semua akses langsung browser (`allow read, write: if false;`).
- **Komposit Indeks**: Didefinisikan di `firestore.indexes.json` untuk koleksi `reports`.
- **Data Statis**: 149 kelurahan Surabaya dan 5 kategori laporan disimpan di memori dan berkas lokal (0 biaya baca Firestore).
- **Session & Cache**: Driver sesi diubah ke `cookie`, cache ke `file`/`array`, queue ke `sync`. Tidak lagi membebani database SQL.
- **Cache Header Data Publik**: Seluruh endpoint data peta publik (`/api/reports/viewport`, `/api/stats/*`, `/api/kelurahans`) memiliki header `Cache-Control` (`public, max-age=20, s-maxage=20`) untuk menghemat kuota Firestore secara drastis.

## 3. Komponen yang Telah Selesai Dibuat (Tahap 1, 2, dan 3)
1. **Fondasi & Client**:
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
4. **Pengujian Unit & Fitur**:
   - `FirestoreRestClientTest`: 3 passed, 22 assertions.
   - `InMemoryRepositoriesTest`: 5 passed, 45 assertions.
   - `FirestoreUserRepositoryTest`: 4 passed, 16 assertions.
   - `FirestoreTokenRepositoryTest`: 3 passed, 11 assertions.
   - `FirestoreReportRepositoryTest`: 4 passed, 19 assertions.
   - `FirestoreCounterRepositoryTest`: 4 passed, 16 assertions.
   - `AuthApiTest`: 5 passed, 23 assertions.
   - `UserApiTest`: 5 passed, 24 assertions.
   - `ReportApiTest`: 7 passed, 35 assertions.
   - `StatsApiTest`: 3 passed, 13 assertions.
   - `KelurahanApiTest`: 3 passed, 14 assertions.
   - Total Keseluruhan: 50 tests, 2.872 assertions (100% lulus tanpa kegagalan).

## 4. Status Database TiDB
- Konfigurasi TiDB di `.env` dan `config/database.php` masih utuh dan tidak dihapus sesuai aturan (dilarang menghapus kode TiDB sebelum Tahap 6).

## 5. Langkah Berikutnya (Menunggu instruksi "lanjut")
- **Tahap 4: Migrasi Data dan Seeding**:
  - Perintah artisan seeder untuk master data Firestore (`php artisan firestore:seed`).
  - Skrip ekspor data yang ada dari TiDB/MySQL ke Firestore (`php artisan firestore:import-from-sql`).
  - Verifikasi integritas data dan kalkulasi ulang counter agregasi pasca-migrasi.
