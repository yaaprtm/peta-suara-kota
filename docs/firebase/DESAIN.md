# DESAIN ARSITEKTUR FIRESTORE - PETA SUARA KOTA

## 1. Ringkasan Transport
- Runtime Lokal: PHP 8.3 CLI Windows (tanpa ekstensi gRPC).
- Runtime Production: Vercel Serverless Function (`vercel-php@0.7.4` Amazon Linux 2 tanpa ekstensi C gRPC).
- Keputusan Usulan Transport: **Klien REST tipis (Firestore REST API v1)** dengan Google Service Account JWT bearer token. Ringan, zero-dependency C extensions, instan cold start pada serverless Vercel.

## 2. Struktur Koleksi & Dokumen Firestore

### A. Data Statis (TIDAK MASUK FIRESTORE - 0 READS)
Sesuai aturan, data referensi statis dipertahankan di file lokal aplikasi untuk menghemat kuota:
1. **Daftar Kelurahan (156 kelurahan)**: `laravel-app/database/seeders/kelurahan_surabaya_lengkap.json` / Static Repository file.
2. **Batas Wilayah & Polygon Kecamatan (31 kecamatan)**: `laravel-app/public/data/kecamatan-surabaya.geojson`.
3. **Kategori Laporan (5 kategori)**: File config/array statis PHP.

### B. Koleksi: `reports`
- **ID Dokumen**: `tracking_code` (misal: `PSK-SBY-A1B2C3`)
- **Field**:
  - `id`: string (UUID)
  - `tracking_code`: string (indeks unik)
  - `title`: string
  - `description`: string
  - `category`: string (INFRASTRUKTUR | KEBERSIHAN | KEAMANAN | BANJIR | LAINNYA)
  - `status`: string (BARU | DIPROSES | SELESAI | DITOLAK)
  - `latitude`: number (float)
  - `longitude`: number (float)
  - `address`: string
  - `kecamatan`: string (nama kecamatan, misal: "Gubeng")
  - `kelurahan_id`: string (UUID kelurahan)
  - `skor_urgensi`: number (integer 0 - 100)
  - `urgency_level`: string (rendah | sedang | tinggi | kritis)
  - `urgensi_keywords`: array of strings
  - `upvotes_count`: number (integer)
  - `photos`: array of strings (URL S3/local)
  - `completion_photos`: array of strings
  - `completion_note`: string|null
  - `audio_url`: string|null
  - `audio_transcript`: string|null
  - `user_id`: string (UUID pelapor)
  - `user_name`: string (denormalisasi untuk menghindari read user)
  - `user_avatar`: string|null (denormalisasi)
  - `status_logs`: array of maps (di-embed langsung, berisi: `{ id, from_status, to_status, note, changed_by_id, changed_by_name, changed_by_role, changed_at }`)
  - `created_at`: timestamp
  - `updated_at`: timestamp
  - `resolved_at`: timestamp|null
- **Catatan Desain**: `status_logs` di-embed ke dalam dokumen `reports`. Karena jumlah perubahan status laporan maksimal 3-5 kali per laporan, ukuran dokumen tetap < 5KB dan detail laporan dapat dibaca dalam **1 kali read** tanpa subkoleksi.

### C. Koleksi: `users`
- **ID Dokumen**: `id` (UUID string)
- **Field**:
  - `id`: string (UUID)
  - `name`: string
  - `email`: string (lowercase)
  - `password`: string (hash bcrypt Laravel)
  - `phone`: string|null
  - `role`: string (WARGA | PETUGAS | ADMIN | SUPERADMIN)
  - `avatar`: string|null
  - `kelurahan_id`: string|null
  - `is_active`: boolean
  - `created_at`: timestamp
  - `updated_at`: timestamp

### D. Koleksi: `personal_access_tokens`
- **ID Dokumen**: `token_hash` (SHA-256 hash dari token plaintext)
- **Field**:
  - `token`: string (SHA-256 hash)
  - `tokenable_id`: string (UUID user)
  - `tokenable_type`: string (`App\Models\User`)
  - `name`: string
  - `abilities`: array of string
  - `last_used_at`: timestamp|null
  - `created_at`: timestamp
  - `updated_at`: timestamp

### E. Koleksi: `counters` (Dokumen Agregasi Terdistribusi)
Digunakan agar endpoint statistik dan leaderboard tidak membaca ratusan dokumen reports:
1. **Dokumen `counters/global_stats`**:
   - `total`: number
   - `baru`: number
   - `diproses`: number
   - `selesai`: number
   - `ditolak`: number
   - `high_urgency`: number
   - `by_day`: map of `{ "YYYY-MM-DD": count }` (14 hari terakhir)
   - `updated_at`: timestamp
2. **Dokumen `counters/leaderboard`**:
   - `kelurahans`: array of maps / map of kelurahan stats:
     - `kelurahan_id`: string
     - `total_reports`: number
     - `resolved_reports`: number
     - `resolution_rate`: number
     - `avg_response_hours`: number|null
     - `score`: number
3. **Dokumen `counters/kecamatan_density`**:
   - `density`: array of `{ kecamatan: string, total: number, avg_urgensi: number }`

---

## 3. Indeks Komposit Firestore (`firestore.indexes.json`)
Untuk mendukung query multi-field:
1. Koleksi `reports`: `status` (ASC) + `created_at` (DESC)
2. Koleksi `reports`: `kecamatan` (ASC) + `created_at` (DESC)
3. Koleksi `reports`: `category` (ASC) + `created_at` (DESC)
4. Koleksi `reports`: `user_id` (ASC) + `created_at` (DESC)

---

## 4. Aturan Keamanan (`firestore.rules`)
Sesuai aturan, semua akses klien langsung ditolak total:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Akses hanya melalui server Laravel menggunakan Google Service Account kredensial.

---

## 5. Analisis Anggaran Kuota (Batas Harian: 20.000 Baca & 5.000 Tulis)
Perhitungan beban harian untuk skenario ~50 pengunjung aktif per hari:

| Halaman / Fitur | Frekuensi / Hari | Read per Request | Total Read / Hari | Write per Request | Total Write / Hari | Keterangan Optimasi |
|---|---|---|---|---|---|---|
| Landing Page (`/`) | 100 kunjungan | 1 read | 100 read | 0 | 0 | Baca 1 dokumen `counters/global_stats` |
| Peta Publik (`/peta`) | 60 query efektif | 50 dokumen | 3.000 read | 0 | 0 | Server-side cache TTL 20s + HTTP Cache-Control s-maxage 20s, limit 50 |
| Papan Skor (`/leaderboard`) | 50 kunjungan | 1 read | 50 read | 0 | 0 | Baca 1 dokumen `counters/leaderboard` |
| Detail Laporan (`/laporan/{id}`) | 200 view | 1 read | 200 read | 0 | 0 | 1 read dokumen `reports/{id}` (status_logs ter-embed) |
| Lacak Tiket (`/api/reports/track`) | 50 pencarian | 1 read | 50 read | 0 | 0 | Direct lookup by document ID `tracking_code` |
| Dashboard Warga (`/dashboard`) | 40 kunjungan | 5 dokumen | 200 read | 0 | 0 | Query `user_id == current` limit 10 |
| Dashboard Petugas (`/petugas`) | 50 kunjungan | 30 dokumen | 1.500 read | 0 | 0 | Query status aktif limit 30 |
| Login / Auth Web (`/login`) | 50 login | 1 read + token | 100 read | 1 write (token) | 50 write | Lookup email + insert token |
| Buat Laporan Baru | 20 laporan | 0 | 0 | 2 write | 40 write | 1 doc report + 1 doc counter update |
| Ubah Status Laporan | 20 update | 1 read | 20 read | 2 write | 40 write | Update report + update counter |
| Upvote Laporan | 50 upvote | 0 | 0 | 1 write | 50 write | Firestore increment pada report |
| **TOTAL ESTIMASI** | | | **~5.220 READS** | | **~180 WRITES** |

**Margin Keamanan Kuota:**
- Target Anggaran Baca: Maksimal 20.000 read/hari -> Realisasi: **5.220 reads (26% dari batas aman, 10% dari limit gratis Firebase)**.
- Target Anggaran Tulis: Maksimal 5.000 write/hari -> Realisasi: **180 writes (3.6% dari batas aman, 0.9% dari limit gratis Firebase)**.
- Desain 100% aman dan memenuhi kriteria kuota paket gratis Spark.

