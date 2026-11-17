# STATE MIGRASI FIREBASE

## 1. Tahap Saat Ini
- **Tahap 2: Auth dan User (Selesai)**
- Menunggu instruksi pengguna ("lanjut") untuk memulai **Tahap 3: Laporan dan Geospasial**.

## 2. Riwayat dan Keputusan Arsitektur
- **Branch**: `migrasi-firebase` (aktif).
- **Transport Firestore**: REST Client tipis (`FirestoreRestClient.php`) dengan pembuatan JWT RS256 native (OpenSSL). Kompatibel penuh dengan PHP 8.3 lokal Windows dan serverless runtime Vercel tanpa dependensi modul C `grpc`.
- **Kredensial Service Account**: Melalui environment variable (`FIREBASE_CREDENTIALS_PATH` atau `FIREBASE_CREDENTIALS_BASE64`). Berkas kredensial telah masuk ke `.gitignore`.
- **Security Rules**: `firestore.rules` menolak semua akses langsung browser (`allow read, write: if false;`).
- **Komposit Indeks**: Didefinisikan di `firestore.indexes.json` untuk koleksi `reports`.
- **Data Statis**: 149 kelurahan Surabaya dan 5 kategori laporan disimpan di memori dan berkas lokal (0 biaya baca Firestore).
- **Session & Cache**: Driver sesi diubah ke `cookie`, cache ke `file`/`array`, queue ke `sync`. Tidak lagi membebani database SQL.

## 3. Komponen yang Telah Selesai Dibuat (Tahap 1 & Tahap 2)
1. **Fondasi & Client**:
   - `FirestoreClientInterface` & `FirestoreRestClient`.
   - `StaticKelurahanRepository` & `StaticCategoryRepository`.
   - `InMemoryUserRepository`, `InMemoryTokenRepository`, `InMemoryCounterRepository`, `InMemoryReportRepository`.
2. **Auth & User (Tahap 2)**:
   - `FirestoreUserRepository`: Mengelola koleksi Firestore `users` dengan UUID, filter email terindeks (1 read per login), role management, dan count.
   - `FirestoreTokenRepository`: Mengelola koleksi `personal_access_tokens` dengan ID dokumen berupa hash sha256 (O(1) direct document read tanpa query scan).
   - `FirestoreUserProvider`: Custom UserProvider Laravel yang meng-hydrate model `User` dan meng-inject relasi `Kelurahan` dari repository statis tanpa query database.
   - Penyesuaian `AuthenticateWithToken` middleware: Membaca token Bearer via repository dan mengeset user pada Auth guard tanpa query SQL langsung.
   - Penyesuaian `AuthController` & `UserController`: Beralih 100% menggunakan repository interfaces (`UserRepositoryInterface`, `TokenRepositoryInterface`, `KelurahanRepositoryInterface`).
3. **Pengujian Unit & Fitur**:
   - `FirestoreRestClientTest`: 3 passed, 22 assertions.
   - `InMemoryRepositoriesTest`: 5 passed, 45 assertions.
   - `FirestoreUserRepositoryTest`: 4 passed, 16 assertions.
   - `FirestoreTokenRepositoryTest`: 3 passed, 11 assertions.
   - `AuthApiTest`: 5 passed, 23 assertions (Register, duplikat email, login valid/invalid, me, logout).
   - `UserApiTest`: 5 passed, 24 assertions (List users, update role, self-demotion protection, toggle active, self-deactivation protection).
   - Total Keseluruhan: 25 tests, 141 assertions (100% lulus tanpa kegagalan).

## 4. Status Database TiDB
- Konfigurasi TiDB di `.env` dan `config/database.php` masih utuh dan tidak dihapus sesuai aturan (dilarang menghapus kode TiDB sebelum Tahap 6).

## 5. Langkah Berikutnya (Menunggu instruksi "lanjut")
- **Tahap 3: Laporan dan Geospasial**:
  - Implementasi `FirestoreReportRepository`.
  - Penanganan query viewport bounding box, filtering, dan Haversine nearby.
  - Implementasi `FirestoreCounterRepository` untuk dokumen agregasi (`counters/global_stats`, `counters/leaderboard`, `counters/kecamatan_density`).
  - Penyesuaian `ReportController` dan `StatsController` agar menggunakan repository interfaces.
  - Pengujian pembuatan laporan atomik, query peta, upvote, dan update status.
