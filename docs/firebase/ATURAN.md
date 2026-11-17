# ATURAN

Arsitektur target (jangan diubah tanpa persetujuanku)
- Laravel tetap. Firestore diakses HANYA dari server lewat satu lapisan
  repository: interface per entitas, implementasi Firestore, dan
  implementasi in-memory untuk test. Browser tidak mengakses Firestore.
- Firestore Security Rules menolak semua akses klien
  (allow read, write: if false). Server memakai kredensial service account.
- Auth tetap sesi Laravel dengan UserProvider kustom yang membaca
  Firestore. Hash password tetap oleh Laravel. Jangan pakai Firebase Auth.
- Sesi: driver cookie. Cache dan queue tidak memakai database
  (cache di direktori sementara atau array, queue sync).
- Foto dan audio TIDAK ke Firebase Storage (butuh paket berbayar).
  Pertahankan disk S3-compatible yang ada.
- Tanpa Cloud Functions dan tanpa layanan berbayar.
- Transport diputuskan di Tahap 0: klien resmi (butuh ekstensi gRPC) hanya
  jika tersedia di lokal DAN runtime production. Jika tidak, usulkan klien
  REST tipis dan tunggu keputusanku.
- Data referensi statis (31 kecamatan, GeoJSON, kategori, daftar
  kelurahan) tetap di file, bukan di Firestore, agar tidak memakan baca.

Anggaran kuota (paket gratis Spark: 50.000 baca dan 20.000 tulis per hari)
- Maksimal 20.000 baca dan 5.000 tulis per hari untuk sekitar 50
  pengunjung aktif. Setiap rancangan query wajib disertai perhitungan baca.
  Tidak ada query tanpa limit. Jangan merancang query bounding box
  langsung di Firestore (dua rentang pada field berbeda bermasalah). Pakai
  kecamatan_id, sel grid, atau limit laporan terbaru yang di-cache.
- Statistik, papan skor, dan jumlah laporan memakai dokumen counter yang
  diperbarui dalam transaksi (counter terdistribusi bila laju tulis tinggi).
- Endpoint data peta publik diberi Cache-Control (s-maxage sekitar 20
  detik) dan cache server dengan TTL pendek.
- Kode tiket laporan sebagai ID dokumen. Idempotency key sebagai ID
  dokumen deterministik (pembuatan atomik, gagal jika sudah ada).

Larangan
- Jangan sentuh project Firebase production selama pengembangan. Pakai
  emulator atau project dev terpisah. Jangan menjalankan seeder atau
  skrip destruktif ke project mana pun tanpa konfirmasiku.
- Jangan hapus kode TiDB sebelum Tahap 6 dan perintahku "verifikasi lulus".
- Jangan mencetak atau commit kredensial (service account JSON). Kredensial
  lewat env: path file untuk lokal, base64 untuk production. Jangan ubah
  isi .env yang sudah ada nilainya. Pastikan nama file kredensial masuk
  .gitignore.
- Buat branch "migrasi-firebase". Jangan sentuh main. Commit kecil.
- Jangan ubah desain visual, teks UI, respons JSON, atau props Inertia.
  Tanpa refactor di luar lapisan data. Tanpa emoji.
- Jangan mencetak data pribadi (email, hash password, isi laporan) ke
  layar, log, atau commit.

Kejujuran
- Klaim wajib berbukti (file:baris, output test). Jangan menandai selesai
  tanpa menjalankan verifikasinya, dan laporkan kegagalan apa adanya.
- Terminal: jangan menjalankan perintah destruktif (git push --force,
  menghapus file di luar yang kamu buat) tanpa persetujuanku.
- Hemat konteks: baca STATE.md dulu, jangan baca ulang file yang sudah
  tercatat, jangan baca vendor, node_modules, build, atau lockfile. Potong
  output perintah dan simpan ringkasan di file.

