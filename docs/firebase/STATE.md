# STATE MIGRASI FIREBASE

## 1. Tahap Saat Ini
- **Tahap 1: Fondasi (Selesai)**
- Menunggu instruksi pengguna ("lanjut") untuk memulai **Tahap 2: Auth dan User**.

## 2. Riwayat dan Keputusan Arsitektur
- **Branch**: `migrasi-firebase` (aktif).
- **Transport Firestore**: REST Client tipis (`FirestoreRestClient.php`) berbasis HTTP/cURL dengan Firestore REST API v1 dan pembuatan JWT RS256 native (OpenSSL). Kompatibel penuh dengan PHP 8.3 lokal Windows dan serverless runtime Vercel tanpa dependensi modul C `grpc`.
- **Kredensial Service Account**: Melalui environment variable (`FIREBASE_CREDENTIALS_PATH` atau `FIREBASE_CREDENTIALS_BASE64`). Berkas kredensial telah masuk ke `.gitignore`.
- **Security Rules**: `firestore.rules` menolak semua akses langsung browser (`allow read, write: if false;`).
- **Komposit Indeks**: Didefinisikan di `firestore.indexes.json` untuk koleksi `reports`.
- **Data Statis**: 149 kelurahan Surabaya dan 5 kategori laporan disimpan di memori dan berkas lokal (0 biaya baca Firestore).

## 3. Komponen Fondasi yang Selesai Dibuat
1. **Aturan dan Desain**:
   - `docs/firebase/ATURAN.md`: Aturan arsitektur, anggaran kuota, dan larangan.
   - `docs/firebase/DESAIN.md`: Skema dokumen, indeks, dan kalkulasi kuota (< 6.000 baca/hari).
   - `docs/firebase/STATE.md`: Pelacakan progres migrasi.
2. **Konfigurasi Firebase**:
   - `firebase.json`: Konfigurasi rules, indexes, dan emulator port 8080.
   - `firestore.rules`: Aturan tolak akses publik langsung.
   - `firestore.indexes.json`: Definisi indeks komposit.
   - `laravel-app/config/firebase.php`: Konfigurasi driver, credentials, project ID.
3. **Transport Client**:
   - `laravel-app/app/Services/Firebase/FirestoreClientInterface.php`
   - `laravel-app/app/Services/Firebase/FirestoreRestClient.php`
4. **Repository Interfaces**:
   - `laravel-app/app/Contracts/Repositories/ReportRepositoryInterface.php`
   - `laravel-app/app/Contracts/Repositories/UserRepositoryInterface.php`
   - `laravel-app/app/Contracts/Repositories/TokenRepositoryInterface.php`
   - `laravel-app/app/Contracts/Repositories/CounterRepositoryInterface.php`
   - `laravel-app/app/Contracts/Repositories/KelurahanRepositoryInterface.php`
   - `laravel-app/app/Contracts/Repositories/CategoryRepositoryInterface.php`
5. **Static & InMemory Implementations**:
   - `laravel-app/app/Repositories/Static/StaticKelurahanRepository.php`
   - `laravel-app/app/Repositories/Static/StaticCategoryRepository.php`
   - `laravel-app/app/Repositories/InMemory/InMemoryUserRepository.php`
   - `laravel-app/app/Repositories/InMemory/InMemoryTokenRepository.php`
   - `laravel-app/app/Repositories/InMemory/InMemoryCounterRepository.php`
   - `laravel-app/app/Repositories/InMemory/InMemoryReportRepository.php`
6. **Service Provider**:
   - `laravel-app/app/Providers/FirebaseServiceProvider.php`: Terdaftar di `bootstrap/providers.php`.
7. **Pengujian Unit**:
   - `laravel-app/tests/Unit/FirestoreRestClientTest.php`: 3 passed, 22 assertions.
   - `laravel-app/tests/Unit/InMemoryRepositoriesTest.php`: 5 passed, 45 assertions.
   - Total Unit Tests Tahap 1: 8 passed, 67 assertions (100% sukses).

## 4. Status Database TiDB
- Konfigurasi TiDB di `.env` dan `config/database.php` masih utuh dan tidak diubah/dihapus sesuai aturan (dilarang menghapus kode TiDB sebelum Tahap 6).

## 5. Langkah Berikutnya (Menunggu instruksi "lanjut")
- **Tahap 2: Auth dan User**:
  - Implementasi `FirestoreUserRepository` dan `FirestoreTokenRepository`.
  - Implementasi custom UserProvider Laravel (`FirestoreUserProvider`) untuk auth sesi web dan token API.
  - Penyesuaian `AuthController` dan middleware auth agar beralih ke layer repository.
  - Pengujian login, register, logout, dan role checks via unit & feature test.
