import { PrismaClient, UserRole, ReportStatus, ReportCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper untuk offset koordinat acak kecil agar pin tidak menumpuk di 1 titik presisi
function randomOffset(range: number = 0.006) {
  return (Math.random() - 0.5) * range;
}

// Helper untuk menentukan tanggal acak berdasarkan rentang hari (hari ke minDays s/d maxDays lalu)
function dateDaysAgo(minDays: number, maxDays: number): Date {
  const days = minDays + Math.random() * (maxDays - minDays);
  const now = new Date();
  const result = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  // Jam acak antara 06:00 sampai 22:00
  result.setHours(6 + Math.floor(Math.random() * 16), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return result;
}

// ─── Daftar Kelurahan & Kecamatan Asli Kota Surabaya ──────────────────────────
const kelurahansData = [
  // Kec. Genteng (Pusat)
  { name: 'Genteng', kecamatan: 'Genteng', kota: 'Surabaya', centroidLat: -7.2575, centroidLng: 112.7400 },
  { name: 'Embong Kaliasin', kecamatan: 'Genteng', kota: 'Surabaya', centroidLat: -7.2619, centroidLng: 112.7375 },
  { name: 'Ketabang', kecamatan: 'Genteng', kota: 'Surabaya', centroidLat: -7.2558, centroidLng: 112.7450 },
  { name: 'Peneleh', kecamatan: 'Genteng', kota: 'Surabaya', centroidLat: -7.2480, centroidLng: 112.7410 },

  // Kec. Tegalsari (Pusat / Selatan)
  { name: 'Tegalsari', kecamatan: 'Tegalsari', kota: 'Surabaya', centroidLat: -7.2720, centroidLng: 112.7380 },
  { name: 'Dr. Soetomo', kecamatan: 'Tegalsari', kota: 'Surabaya', centroidLat: -7.2810, centroidLng: 112.7350 },
  { name: 'Kedungdoro', kecamatan: 'Tegalsari', kota: 'Surabaya', centroidLat: -7.2650, centroidLng: 112.7310 },
  { name: 'Keputran', kecamatan: 'Tegalsari', kota: 'Surabaya', centroidLat: -7.2790, centroidLng: 112.7440 },

  // Kec. Gubeng (Timur / Pusat)
  { name: 'Gubeng', kecamatan: 'Gubeng', kota: 'Surabaya', centroidLat: -7.2750, centroidLng: 112.7520 },
  { name: 'Airlangga', kecamatan: 'Gubeng', kota: 'Surabaya', centroidLat: -7.2710, centroidLng: 112.7580 },
  { name: 'Kertajaya', kecamatan: 'Gubeng', kota: 'Surabaya', centroidLat: -7.2820, centroidLng: 112.7600 },
  { name: 'Mojo', kecamatan: 'Gubeng', kota: 'Surabaya', centroidLat: -7.2680, centroidLng: 112.7640 },

  // Kec. Wonokromo (Selatan)
  { name: 'Darmo', kecamatan: 'Wonokromo', kota: 'Surabaya', centroidLat: -7.2910, centroidLng: 112.7350 },
  { name: 'Sawunggaling', kecamatan: 'Wonokromo', kota: 'Surabaya', centroidLat: -7.2980, centroidLng: 112.7290 },
  { name: 'Jagir', kecamatan: 'Wonokromo', kota: 'Surabaya', centroidLat: -7.3050, centroidLng: 112.7450 },
  { name: 'Ngagel', kecamatan: 'Wonokromo', kota: 'Surabaya', centroidLat: -7.2930, centroidLng: 112.7490 },

  // Kec. Sawahan (Barat)
  { name: 'Petemon', kecamatan: 'Sawahan', kota: 'Surabaya', centroidLat: -7.2680, centroidLng: 112.7220 },
  { name: 'Sawahan', kecamatan: 'Sawahan', kota: 'Surabaya', centroidLat: -7.2750, centroidLng: 112.7240 },
  { name: 'Kupang Krajan', kecamatan: 'Sawahan', kota: 'Surabaya', centroidLat: -7.2650, centroidLng: 112.7150 },
  { name: 'Banyu Urip', kecamatan: 'Sawahan', kota: 'Surabaya', centroidLat: -7.2740, centroidLng: 112.7180 },

  // Kec. Tambaksari (Utara / Timur)
  { name: 'Tambaksari', kecamatan: 'Tambaksari', kota: 'Surabaya', centroidLat: -7.2520, centroidLng: 112.7600 },
  { name: 'Pacar Keling', kecamatan: 'Tambaksari', kota: 'Surabaya', centroidLat: -7.2600, centroidLng: 112.7570 },
  { name: 'Gading', kecamatan: 'Tambaksari', kota: 'Surabaya', centroidLat: -7.2430, centroidLng: 112.7680 },
  { name: 'Rangkah', kecamatan: 'Tambaksari', kota: 'Surabaya', centroidLat: -7.2490, centroidLng: 112.7620 },

  // Kec. Sukolilo (Timur)
  { name: 'Keputih', kecamatan: 'Sukolilo', kota: 'Surabaya', centroidLat: -7.2950, centroidLng: 112.7950 },
  { name: 'Gebang Putih', kecamatan: 'Sukolilo', kota: 'Surabaya', centroidLat: -7.2850, centroidLng: 112.7900 },
  { name: 'Menur Pumpungan', kecamatan: 'Sukolilo', kota: 'Surabaya', centroidLat: -7.2880, centroidLng: 112.7720 },
  { name: 'Semolowaru', kecamatan: 'Sukolilo', kota: 'Surabaya', centroidLat: -7.3010, centroidLng: 112.7760 },

  // Kec. Rungkut (Selatan / Timur)
  { name: 'Rungkut Kidul', kecamatan: 'Rungkut', kota: 'Surabaya', centroidLat: -7.3250, centroidLng: 112.7650 },
  { name: 'Kali Rungkut', kecamatan: 'Rungkut', kota: 'Surabaya', centroidLat: -7.3180, centroidLng: 112.7720 },
  { name: 'Medokan Ayu', kecamatan: 'Rungkut', kota: 'Surabaya', centroidLat: -7.3200, centroidLng: 112.7880 },
  { name: 'Wonorejo', kecamatan: 'Rungkut', kota: 'Surabaya', centroidLat: -7.3100, centroidLng: 112.7920 },

  // Kec. Dukuh Pakis (Barat)
  { name: 'Gunung Sari', kecamatan: 'Dukuh Pakis', kota: 'Surabaya', centroidLat: -7.3020, centroidLng: 112.7090 },
  { name: 'Dukuh Kupang', kecamatan: 'Dukuh Pakis', kota: 'Surabaya', centroidLat: -7.2880, centroidLng: 112.7150 },

  // Kec. Kenjeran (Utara)
  { name: 'Kenjeran', kecamatan: 'Kenjeran', kota: 'Surabaya', centroidLat: -7.2340, centroidLng: 112.7860 },
  { name: 'Bulak Banteng', kecamatan: 'Kenjeran', kota: 'Surabaya', centroidLat: -7.2250, centroidLng: 112.7690 },

  // Kec. Wiyung (Barat)
  { name: 'Wiyung', kecamatan: 'Wiyung', kota: 'Surabaya', centroidLat: -7.3120, centroidLng: 112.6950 },
  { name: 'Babatan', kecamatan: 'Wiyung', kota: 'Surabaya', centroidLat: -7.3190, centroidLng: 112.6850 },

  // Kec. Mulyorejo (Timur)
  { name: 'Mulyorejo', kecamatan: 'Mulyorejo', kota: 'Surabaya', centroidLat: -7.2670, centroidLng: 112.7870 },
  { name: 'Kalisari', kecamatan: 'Mulyorejo', kota: 'Surabaya', centroidLat: -7.2580, centroidLng: 112.7980 },
];

const categoriesData = [
  { name: 'Infrastruktur', type: ReportCategory.INFRASTRUKTUR, icon: '🏗️', description: 'Jalan rusak, jembatan, fasilitas umum, penerangan jalan', baseScore: 40 },
  { name: 'Kebersihan', type: ReportCategory.KEBERSIHAN, icon: '🗑️', description: 'Sampah, TPS liar, limbah lingkungan, bau menyengat', baseScore: 30 },
  { name: 'Keamanan', type: ReportCategory.KEAMANAN, icon: '🛡️', description: 'Pencurian, balap liar, gangguan ketertiban, tawuran', baseScore: 50 },
  { name: 'Banjir', type: ReportCategory.BANJIR, icon: '🌊', description: 'Genangan jalan, saluran mampet, banjir rob, pompa rusak', baseScore: 60 },
  { name: 'Lainnya', type: ReportCategory.LAINNYA, icon: '📋', description: 'Pohon tumbang, kabel semrawut, fasilitas umum rusak', baseScore: 20 },
];

// Definisi 75 laporan realistis dengan nada warga biasa & sebaran target
interface SeedReportDef {
  title: string;
  description: string;
  category: ReportCategory;
  kecamatan: string;
  kelurahan: string;
  address: string;
  skorUrgensi: number; // 0-100
  urgensiKeywords: string[];
  status: ReportStatus; // BARU | DIPROSES | SELESAI
  daysAgoRange: [number, number]; // [minDays, maxDays]
}

const rawReports: SeedReportDef[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. INFRASTRUKTUR (~23 Laporan)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Aspal amblas parah depan RS Darmo, motor banyak terpelanting',
    description: 'Ada lubang aspal amblas sedalam 20cm pas di lajur kiri Jl Raya Darmo arah Wonokromo. Tadi malam ada 2 pengendara motor jatuh gara-gara nggak kelihatan pas hujan.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Darmo',
    address: 'Jl. Raya Darmo No. 90 (depan RS Darmo)',
    skorUrgensi: 92,
    urgensiKeywords: ['amblas', 'motor jatuh', 'parah', 'kritis', 'bahaya'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [1, 5],
  },
  {
    title: 'Jembatan penyeberangan orang (JPO) bautnya copot goyang-goyang',
    description: 'Baut penyangga tangga JPO di Jl. Urip Sumoharjo banyak yang lepas dan berkarat parah. Kalau dilewati orang banyak goyang kencang, takut roboh.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Tegalsari',
    kelurahan: 'Dr. Soetomo',
    address: 'Jl. Urip Sumoharjo depan pertokoan',
    skorUrgensi: 88,
    urgensiKeywords: ['baut copot', 'jembatan goyang', 'rawan roboh', 'kritis'],
    status: ReportStatus.BARU,
    daysAgoRange: [0, 3],
  },
  {
    title: 'Lampu PJU mati total dari prapatan Tunjungan sampai Genteng Kali',
    description: 'Sepanjang jalan gelap gulita sudah 3 hari berturut-turut. Padahal ini area ramai turis dan pejalan kaki, banyak motor ngebut nggak kelihatan jalan.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Genteng',
    kelurahan: 'Genteng',
    address: 'Jl. Tunjungan No. 45-80',
    skorUrgensi: 72,
    urgensiKeywords: ['lampu padam', 'gelap gulita', 'pju mati'],
    status: ReportStatus.BARU,
    daysAgoRange: [2, 6],
  },
  {
    title: 'Paving trotoar hancur berantakan depan kampus B Unair',
    description: 'Paving walk trotoar pejalan kaki hancur bergelombang gara-gara akar pohon beringin. Banyak mahasiswa kesandung pas jalan buru-buru.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Gubeng',
    kelurahan: 'Airlangga',
    address: 'Jl. Prof. Dr. Moestopo depan Kampus B Unair',
    skorUrgensi: 45,
    urgensiKeywords: ['trotoar rusak', 'kesandung', 'paving hancur'],
    status: ReportStatus.BARU,
    daysAgoRange: [15, 25],
  },
  {
    title: 'Penutup got besi hilang dicuri orang di Jl. Banyu Urip',
    description: 'Tutup manhole got besi di pinggir jalan hilang entah ke mana, sekarang bolong menganga lebar. Warga sementara cuma kasih ranting pohon biar nggak kelindes mobil.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Sawahan',
    kelurahan: 'Banyu Urip',
    address: 'Jl. Banyu Urip Gang 4 No. 12',
    skorUrgensi: 84,
    urgensiKeywords: ['tutup got hilang', 'lubang menganga', 'bahaya ban masuk'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [3, 7],
  },
  {
    title: 'Jalanan paving gang rusak parah di Pacar Keling',
    description: 'Paving jalan masuk gang sudah ambles dan pecah-pecah kena gerobak sampah tiap hari. Kalau becek jadi kubangan lumpur.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Tambaksari',
    kelurahan: 'Pacar Keling',
    address: 'Jl. Pacar Keling Gang 5 No. 18',
    skorUrgensi: 48,
    urgensiKeywords: ['paving ambles', 'gang rusak', 'kubangan'],
    status: ReportStatus.BARU,
    daysAgoRange: [18, 28],
  },
  {
    title: 'Rambu lalu lintas tikungan patah dihantam truk di Rungkut Industri',
    description: 'Rambu penunjuk arah dan cermin cembung tikungan roboh ke semak-semak bekas ditabrak truk tronton mundur semalam.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Rungkut',
    kelurahan: 'Kali Rungkut',
    address: 'Jl. Rungkut Industri Raya Blok C',
    skorUrgensi: 63,
    urgensiKeywords: ['rambu patah', 'cermin tikungan rusak', 'tertabrak'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [35, 50],
  },
  {
    title: 'Batas separator jalur sepeda roboh di Jl. Pemuda',
    description: 'Pembatas beton jalur sepeda copot dan melintang separuh ke jalan raya. Bikin mobil pada banting setir mendadak.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Genteng',
    kelurahan: 'Embong Kaliasin',
    address: 'Jl. Pemuda depan Monumen Kapal Selam',
    skorUrgensi: 67,
    urgensiKeywords: ['separator roboh', 'banting setir', 'halangi jalan'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [40, 60],
  },
  {
    title: 'Lampu merah error kedap-kedip kuning terus di Prapatan Ngagel',
    description: 'Traffic light simpang Ngagel Jaya - Bratang mati cuma kuning kedip-kedip dari pagi. Arus kendaraan semrawut saling serobot bikin macet total.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Ngagel',
    address: 'Simpang Empat Jl. Ngagel Jaya Selatan',
    skorUrgensi: 81,
    urgensiKeywords: ['lampu merah error', 'macet parah', 'saling serobot'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [1, 4],
  },
  {
    title: 'Aspal mengelupas bergelombang di Jl. Jagir Wonokromo',
    description: 'Permukaan aspal melepuh dan bergelombang tinggi di dekat stasiun Wonokromo. Motor yang lewat kecepatan sedang gampang oleng.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Jagir',
    address: 'Jl. Jagir Wonokromo No. 110',
    skorUrgensi: 69,
    urgensiKeywords: ['aspal melepuh', 'bergelombang', 'motor oleng'],
    status: ReportStatus.BARU,
    daysAgoRange: [8, 14],
  },
  {
    title: 'Pagar pengaman jembatan Kali Mas keropos dan patah',
    description: 'Railing besi pembatas bibir sungai Kali Mas di Ketabang patah sepanjang 3 meter. Takut ada anak kecil main kepeleset nyemplung kali.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Genteng',
    kelurahan: 'Ketabang',
    address: 'Jl. Ketabang Kali belakang WTC',
    skorUrgensi: 85,
    urgensiKeywords: ['pagar patah', 'kali mas', 'rawan nyemplung', 'anak kecil'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [4, 9],
  },
  {
    title: 'Tutup bak kontrol PDAM jebol di Jl. Menur Pumpungan',
    description: 'Bak kontrol saluran air di pinggir jalan pecah terlindas roda truk galon. Roda motor sering kejeblos kalau pas malam.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Sukolilo',
    kelurahan: 'Menur Pumpungan',
    address: 'Jl. Menur Pumpungan No. 34',
    skorUrgensi: 75,
    urgensiKeywords: ['bak kontrol jebol', 'kejeblos', 'pdam'],
    status: ReportStatus.BARU,
    daysAgoRange: [10, 20],
  },
  {
    title: 'Marka jalan dan zebra cross depan SDN Dr Soetomo pudar total',
    description: 'Garis penyeberangan jalan anak sekolah sudah hilang total warnanya. Mobil motor nggak ada yang mau melambat pas jam masuk sekolah.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Tegalsari',
    kelurahan: 'Dr. Soetomo',
    address: 'Jl. Kupang Panjaan depan SDN',
    skorUrgensi: 55,
    urgensiKeywords: ['zebra cross hilang', 'marka pudar', 'anak sekolah'],
    status: ReportStatus.BARU,
    daysAgoRange: [25, 45],
  },
  {
    title: 'Lampu taman dan bangku rusak di Taman Bungkul',
    description: 'Beberapa tiang lampu hias taman kacanya pecah dan bangku kayu panjang patah tengahnya belum diperbaiki petugas.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Darmo',
    address: 'Area Plaza Taman Bungkul',
    skorUrgensi: 35,
    urgensiKeywords: ['bangku patah', 'lampu taman pecah', 'taman bungkul'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [50, 75],
  },
  {
    title: 'Jalan turunan underpass Mayjen Sungkono berlubang',
    description: 'Pas turunan masuk underpass Mayjen arah HR Muhammad ada lubang tajam pinggir kanan. Sangat berbahaya untuk kecepatan tinggi.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Sawahan',
    kelurahan: 'Petemon',
    address: 'Akses Underpass Mayjen Sungkono',
    skorUrgensi: 89,
    urgensiKeywords: ['underpass berlubang', 'kecepatan tinggi', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [2, 6],
  },
  {
    title: 'Papan plang penunjuk jalan roboh di Jl. Dharmawangsa',
    description: 'Plang besi penunjuk arah RSUD Dr Soetomo doyong miring hampir nempel kabel optik.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Gubeng',
    kelurahan: 'Airlangga',
    address: 'Jl. Dharmawangsa No. 20',
    skorUrgensi: 42,
    urgensiKeywords: ['plang roboh', 'penunjuk jalan'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [60, 85],
  },
  {
    title: 'Jalan paving bergelombang di perumahan Medokan Ayu',
    description: 'Paving jalan masuk blok barat medokan ayu banyak yang amblas kena genangan dan truk material.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Rungkut',
    kelurahan: 'Medokan Ayu',
    address: 'Jl. Medokan Ayu Blok MA 2',
    skorUrgensi: 39,
    urgensiKeywords: ['paving amblas', 'jalan gelombang'],
    status: ReportStatus.BARU,
    daysAgoRange: [30, 60],
  },
  {
    title: 'Tiang besi pembatas trotoar (bollard) copot di Jl. Basuki Rahmat',
    description: 'Dua tiang bollard trotoar dicopot paksa dan sekarang motor sering naik ke trotoar buat hindari macet.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Tegalsari',
    kelurahan: 'Kedungdoro',
    address: 'Jl. Basuki Rahmat No. 102',
    skorUrgensi: 52,
    urgensiKeywords: ['bollard copot', 'motor naik trotoar'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [12, 22],
  },
  {
    title: 'Lubang galian pipa dibiarkan urukan tanah saja di Jl. Dukuh Kupang',
    description: 'Bekas galian pipa sebelah pom bensin cuma ditutup tanah liat dan batu kricak, pas hujan becek motor sering kepeleset.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Dukuh Pakis',
    kelurahan: 'Dukuh Kupang',
    address: 'Jl. Dukuh Kupang Barat No. 50',
    skorUrgensi: 65,
    urgensiKeywords: ['galian pipa', 'becek licin', 'tanah liat'],
    status: ReportStatus.BARU,
    daysAgoRange: [5, 11],
  },
  {
    title: 'Kerusakan lantai ubin jembatan penyeberangan Wonokromo',
    description: 'Lantai keramik JPO stasiun wonokromo banyak yang pecah dan licin kalau hujan.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Sawunggaling',
    address: 'JPO Stasiun Wonokromo',
    skorUrgensi: 38,
    urgensiKeywords: ['keramik pecah', 'jpo licin'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [70, 88],
  },
  {
    title: 'Pagar besi pembatas rel kereta api di Sawahan bolong',
    description: 'Pagar kawat besi perlintasan KA Sawahan dijebol warga buat jalan pintas nyebrang rel. Sangat rawan tertabrak kereta.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Sawahan',
    kelurahan: 'Sawahan',
    address: 'Perlintasan Rel KA Jl. Sawahan Baru',
    skorUrgensi: 86,
    urgensiKeywords: ['pagar rel dijebol', 'rawan ketabrak kereta', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [3, 8],
  },
  {
    title: 'Lampu penerangan jembatan Mulyorejo mati semua',
    description: 'Jembatan kali kenjeran mulyorejo gelap gulita pas malam hari, rawan aksi kejahatan.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Mulyorejo',
    kelurahan: 'Mulyorejo',
    address: 'Jembatan Mulyorejo Baru',
    skorUrgensi: 60,
    urgensiKeywords: ['lampu jembatan mati', 'gelap'],
    status: ReportStatus.BARU,
    daysAgoRange: [7, 15],
  },
  {
    title: 'Tutup bak drainase pecah depan ruko Kertajaya Indah',
    description: 'Cor penutup saluran drainase depan parkiran ruko patah terbelah dua.',
    category: ReportCategory.INFRASTRUKTUR,
    kecamatan: 'Gubeng',
    kelurahan: 'Kertajaya',
    address: 'Jl. Kertajaya Indah Blok G No. 8',
    skorUrgensi: 53,
    urgensiKeywords: ['penutup drainase retak', 'saluran'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [45, 65],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. BANJIR & SALURAN AIR (~19 Laporan)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Genangan air setinggi lutut di Jl. Mayjen Sungkono pasca hujan deras',
    description: 'Hujan deras 2 jam saluran air depan ruko Mayjen langsung meluap. Mobil sedan dan motor mogok massal, air masuk ke teras toko warga.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sawahan',
    kelurahan: 'Petemon',
    address: 'Jl. Mayjen Sungkono No. 128',
    skorUrgensi: 95,
    urgensiKeywords: ['banjir tinggi', 'motor mogok', 'lutut', 'kritis', 'meluap'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [0, 2],
  },
  {
    title: 'Got depan gang mampet total dari kemarin, air item bau meluber ke jalan',
    description: 'Saluran drainase gang ketutup endapan lemak sisa warung dan sampah plastik tebal. Air comberan warna hitam pekat naik sampai depan teras rumah.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Genteng',
    kelurahan: 'Peneleh',
    address: 'Jl. Peneleh Gang 7 No. 24',
    skorUrgensi: 78,
    urgensiKeywords: ['got mampet', 'comberan meluber', 'bau banget', 'tersumbat'],
    status: ReportStatus.BARU,
    daysAgoRange: [1, 4],
  },
  {
    title: 'Banjir rob air laut pasang rendam pemukiman Kenjeran & Tambak Wedi',
    description: 'Air laut pasang naik merendam jalanan kampung nelayan sampai 30cm sejak siang tadi. Warga kesulitan akses keluar masuk kampung.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Kenjeran',
    kelurahan: 'Kenjeran',
    address: 'Jl. Tambak Deres Kenjeran',
    skorUrgensi: 82,
    urgensiKeywords: ['banjir rob', 'air pasang', 'kenjeran', 'rendam kampung'],
    status: ReportStatus.BARU,
    daysAgoRange: [2, 5],
  },
  {
    title: 'Pompa air rumah pompa bozem Keputih bunyi kasar dan macet',
    description: 'Mesin pompa submersible di bozem keputih suaranya ngadat dan debit hisapnya drop. Takutnya pas hujan deras keputih tenggelam.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sukolilo',
    kelurahan: 'Keputih',
    address: 'Rumah Pompa Bozem Keputih Makmur',
    skorUrgensi: 90,
    urgensiKeywords: ['pompa rusak', 'bozem', 'rawan tenggelam', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [1, 3],
  },
  {
    title: 'Endapan lumpur saluran primer Kertajaya belum dikeruk sudah 6 bulan',
    description: 'Kedalaman saluran primer berkurang drastis tinggal semata kaki gara-gara lumpur dan endapan pasir padat. Tolong dikirim alat berat buat normalisasi.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Gubeng',
    kelurahan: 'Kertajaya',
    address: 'Jl. Kertajaya Indah Timur No. 44',
    skorUrgensi: 62,
    urgensiKeywords: ['pengerukan lumpur', 'saluran primer', 'endapan pasir'],
    status: ReportStatus.BARU,
    daysAgoRange: [10, 20],
  },
  {
    title: 'Gorong-gorong tersumbat balok kayu dan sampah bambu di Jagir',
    description: 'Di bawah jembatan saluran air ada tumpukan kayu bekas bekisting proyek nyangkut bikin sampah plastik numpuk jadi bendungan liar.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Wonokromo',
    kelurahan: 'Jagir',
    address: 'Saluran Kali Jagir Wonokromo',
    skorUrgensi: 74,
    urgensiKeywords: ['gorong tersumbat', 'sampah bambu', 'bendungan liar'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [4, 8],
  },
  {
    title: 'Genangan 15cm langganan di depan ruko Dharmahusada',
    description: 'Tiap gerimis selalu muncul genangan air di lajur lambat Jl Dharmahusada gara-gara mulut inlet got ketutup paving liar ruko.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Gubeng',
    kelurahan: 'Mojo',
    address: 'Jl. Dharmahusada No. 112',
    skorUrgensi: 55,
    urgensiKeywords: ['genangan langganan', 'mulut got ketutup'],
    status: ReportStatus.BARU,
    daysAgoRange: [14, 25],
  },
  {
    title: 'Saluran air meluap di pemukiman padat Kedungdoro',
    description: 'Hujan sedang saluran lingkungan meluap bau comberan masuk ke jalan sempit gang.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Tegalsari',
    kelurahan: 'Kedungdoro',
    address: 'Jl. Kedungdoro Gang 8 No. 5',
    skorUrgensi: 68,
    urgensiKeywords: ['meluap', 'pemukiman padat', 'bau comberan'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [32, 45],
  },
  {
    title: 'Genangan air di turunan jembatan baru Semolowaru',
    description: 'Air hujan mengantong di cekungan aspal depan ruko semolowaru, motor banyak yang ciprat-cipratan.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sukolilo',
    kelurahan: 'Semolowaru',
    address: 'Jl. Semolowaru Elok No. 10',
    skorUrgensi: 49,
    urgensiKeywords: ['air mengantong', 'cekungan aspal'],
    status: ReportStatus.BARU,
    daysAgoRange: [9, 18],
  },
  {
    title: 'Eceng gondok dan sampah menutup 80% permukaan kali Rungkut',
    description: 'Permukaan kali tertutup rapat tanaman liar dan botol plastik, aliran air ke hilir macet total.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Rungkut',
    kelurahan: 'Rungkut Kidul',
    address: 'Bantaran Kali Rungkut Kidul',
    skorUrgensi: 66,
    urgensiKeywords: ['eceng gondok', 'aliran macet', 'sungai mampet'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [15, 30],
  },
  {
    title: 'Pintu air darurat bozem Wonorejo macet tidak bisa ditutup',
    description: 'Engsel pintu besi pengendali debit air berkarat macet, posisi terbuka separuh.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Rungkut',
    kelurahan: 'Wonorejo',
    address: 'Pintu Air Bozem Wonorejo Timur',
    skorUrgensi: 87,
    urgensiKeywords: ['pintu air macet', 'bozem wonorejo', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [3, 7],
  },
  {
    title: 'Banjir lokal di jalan akses perumahan Dukuh Kupang',
    description: 'Saluran air dari bukit atas mengalir terlalu deras membawa pasir menutup selokan bawah.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Dukuh Pakis',
    kelurahan: 'Dukuh Kupang',
    address: 'Jl. Dukuh Kupang Barat XX',
    skorUrgensi: 58,
    urgensiKeywords: ['banjir lokal', 'endapan pasir'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [40, 60],
  },
  {
    title: 'Saluran drainase tersumbat kantong semen proyek di Wiyung',
    description: 'Sisa semen dan adukan pasir pekerja ruko dibuang langsung ke selokan pinggir jalan raya wiyung.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Wiyung',
    kelurahan: 'Wiyung',
    address: 'Jl. Raya Wiyung No. 78',
    skorUrgensi: 76,
    urgensiKeywords: ['buang semen', 'selokan keras', 'tersumbat'],
    status: ReportStatus.BARU,
    daysAgoRange: [6, 12],
  },
  {
    title: 'Genangan air depan RS Dr Soetomo saat hujan',
    description: 'Lajur ambulans dan drop off pasien tergenang air 15cm karena talang saluran air mampet.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Gubeng',
    kelurahan: 'Airlangga',
    address: 'Akses Drop Zone RSUD Dr Soetomo',
    skorUrgensi: 79,
    urgensiKeywords: ['akses rs tergenang', 'ambulans terhambat', 'darurat'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [35, 55],
  },
  {
    title: 'Air selokan meluber ke halaman SD Pacar Keling',
    description: 'Selokan pemukiman warga meluap masuk ke lapangan upacara dan ruang kelas 1 pas hujan deras kemarin lusa.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Tambaksari',
    kelurahan: 'Pacar Keling',
    address: 'Jl. Pacar Keling Gang 3',
    skorUrgensi: 83,
    urgensiKeywords: ['meluap ke sekolah', 'ruang kelas basah', 'mendesak'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [2, 5],
  },
  {
    title: 'Endapan lumpur saluran perumahan Gebang Putih',
    description: 'Saluran depan rumah warga sudah dangkal perlu pembersihan swadaya atau bantuan petugas kebersihan dinas.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sukolilo',
    kelurahan: 'Gebang Putih',
    address: 'Jl. Gebang Putih No. 12',
    skorUrgensi: 36,
    urgensiKeywords: ['lumpur selokan', 'dangkal'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [65, 85],
  },
  {
    title: 'Tanggul tanah darurat di bantaran kali Petemon retak',
    description: 'Tanggul pembatas kali dengan rumah warga tampak amblas dan retak 5 meter.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sawahan',
    kelurahan: 'Petemon',
    address: 'Bantaran Kali Petemon Barat',
    skorUrgensi: 91,
    urgensiKeywords: ['tanggul retak', 'rawan jebol', 'kritis'],
    status: ReportStatus.BARU,
    daysAgoRange: [1, 3],
  },
  {
    title: 'Genangan air rob di akses jalan Bulak Banteng',
    description: 'Jalanan paving terendam air asin pasang rob laut, licin berlumut.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Kenjeran',
    kelurahan: 'Bulak Banteng',
    address: 'Jl. Bulak Banteng Wetan No. 30',
    skorUrgensi: 64,
    urgensiKeywords: ['air rob', 'jalan berlumut', 'kenjeran'],
    status: ReportStatus.BARU,
    daysAgoRange: [12, 22],
  },
  {
    title: 'Genangan sisa air hujan lama surut di Jl. Kupang Krajan',
    description: 'Air tergenang 3 hari tidak kunjung surut karena gorong-gorong pembuangan lebih tinggi dari jalan.',
    category: ReportCategory.BANJIR,
    kecamatan: 'Sawahan',
    kelurahan: 'Kupang Krajan',
    address: 'Jl. Kupang Krajan Gang 2',
    skorUrgensi: 54,
    urgensiKeywords: ['lama surut', 'salah elevasi got'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [50, 70],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. KEBERSIHAN & SAMPAH (~15 Laporan)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Tumpukan sampah liar dekat Pasar Kembang baunya sampai ke jalan raya',
    description: 'Sampah sisa pasar dan rumah tangga numpuk setinggi 1.5 meter belum diangkut truk kuning dinas kebersihan sudah seminggu. Baunya bikin enek orang lewat.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Sawahan',
    kelurahan: 'Sawahan',
    address: 'Jl. Pasar Kembang sudut jembatan',
    skorUrgensi: 77,
    urgensiKeywords: ['sampah liar', 'bau busuk', 'pasar kembang', 'numpuk seminggu'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [2, 5],
  },
  {
    title: 'TPS liar di tanah kosong Keputih dibakar oknum bikin asap pekat sesak nafas',
    description: 'Ada lahan kosong dijadikan tempat buang sampah liar, terus tiap malam dibakar sama orang nggak bertanggung jawab. Asapnya masuk ke pemukiman warga bikin batuk.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Sukolilo',
    kelurahan: 'Keputih',
    address: 'Jl. Keputih Timur Lahan Kosong Kav 14',
    skorUrgensi: 83,
    urgensiKeywords: ['bakar sampah', 'asap pekat', 'sesak nafas', 'tps liar'],
    status: ReportStatus.BARU,
    daysAgoRange: [1, 3],
  },
  {
    title: 'Sampah sisa pasar tumpah pagi tercecer di Jl. Peneleh',
    description: 'Bekas lapak jualan sayur dan kulit buah dibiarkan berserakan di aspal pas pasar bubar jam 9 pagi.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Genteng',
    kelurahan: 'Peneleh',
    address: 'Jl. Peneleh depan Makam Belanda',
    skorUrgensi: 42,
    urgensiKeywords: ['sampah pasar', 'tercecer', 'jalanan kotor'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [20, 35],
  },
  {
    title: 'Limbah cair oli bekas dibuang sembarangan ke selokan Jl. Rungkut Kidul',
    description: 'Ada bengkel motor tanpa izin buang oli bekas langsung ke saluran air warga, airnya jadi hitam berminyak dan bau menyengat.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Rungkut',
    kelurahan: 'Rungkut Kidul',
    address: 'Jl. Rungkut Kidul Industri Gang 2',
    skorUrgensi: 79,
    urgensiKeywords: ['limbah oli', 'bengkel liar', 'mencemari', 'bau oli'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [4, 9],
  },
  {
    title: 'Bangkai kucing tertabrak di tengah jalan Jl. Ngagel Jaya',
    description: 'Ada bangkai kucing di tengah marka jalan belum dievakuasi, kasihan dan rawan dilindes pengendara lain.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Wonokromo',
    kelurahan: 'Ngagel',
    address: 'Jl. Ngagel Jaya Selatan depan toko buku',
    skorUrgensi: 45,
    urgensiKeywords: ['bangkai kucing', 'tengah jalan'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [1, 3],
  },
  {
    title: 'Tumpukan dahan kayu pangkasan DKRTH dibiarkan di trotoar Jl. Pemuda',
    description: 'Sisa ranting pohon ditebang 4 hari lalu masih numpuk di pedestrian jalan pemuda, pejalan kaki terpaksa turun ke jalan raya.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Genteng',
    kelurahan: 'Embong Kaliasin',
    address: 'Jl. Pemuda seberang Delta Plaza',
    skorUrgensi: 56,
    urgensiKeywords: ['dahan pohon', 'halangi trotoar', 'pangkasan'],
    status: ReportStatus.BARU,
    daysAgoRange: [5, 10],
  },
  {
    title: 'Kontainer sampah TPS Tambaksari penuh meluber sampai badan jalan',
    description: 'Bak kontainer sampah besi sudah penuh over kapasitas, sampah berhamburan ke aspal sampai bikin motor harus minggir.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Tambaksari',
    kelurahan: 'Tambaksari',
    address: 'Jl. Tambaksari depan Gelora 10 Nopember',
    skorUrgensi: 71,
    urgensiKeywords: ['kontainer penuh', 'meluber', 'sampah tps'],
    status: ReportStatus.BARU,
    daysAgoRange: [2, 6],
  },
  {
    title: 'Coretan cat pilox liar di dinding cagar budaya Peneleh',
    description: 'Tembok bangunan tua bersejarah dicorat-coret graviti liar menggunakan pilox hitam.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Genteng',
    kelurahan: 'Peneleh',
    address: 'Jl. Peneleh No. 10 (Kawasan Cagar Budaya)',
    skorUrgensi: 33,
    urgensiKeywords: ['vandalisme', 'coretan pilox', 'cagar budaya'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [55, 75],
  },
  {
    title: 'Puing bekas bongkaran ruko dibuang di pinggir Jl. Kutai',
    description: 'Tumpukan bongkaran bata semen dan keramik pecah ditaruh sembarangan di bahu jalan.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Wonokromo',
    kelurahan: 'Darmo',
    address: 'Jl. Kutai No. 33',
    skorUrgensi: 47,
    urgensiKeywords: ['puing bangunan', 'bahu jalan'],
    status: ReportStatus.BARU,
    daysAgoRange: [16, 28],
  },
  {
    title: 'Gerobak sampah mangkrak rusak berhari-hari di Jl. Mojo',
    description: 'Gerobak dorong sampah besi patah rodanya ditinggal begitu saja di pinggir jalan gang.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Gubeng',
    kelurahan: 'Mojo',
    address: 'Jl. Mojo Klanggru Gang 4',
    skorUrgensi: 28,
    urgensiKeywords: ['gerobak sampah', 'mangkrak'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [60, 80],
  },
  {
    title: 'Bungkusan sampah rumah tangga dilempar ke saluran air Jl. Kapas Krampung',
    description: 'Banyak warga buang plastik kresek isi sampah langsung ke parit depan toko malam hari.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Tambaksari',
    kelurahan: 'Rangkah',
    address: 'Jl. Kapas Krampung No. 70',
    skorUrgensi: 59,
    urgensiKeywords: ['buang sampah parit', 'plastik kresek'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [8, 16],
  },
  {
    title: 'Kotoran unggas ayam berserakan di gang pemukiman Keputran',
    description: 'Kandang ayam di pinggir gang kotor tidak pernah dibersihkan pemiliknya, baunya mengganggu tetangga.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Tegalsari',
    kelurahan: 'Keputran',
    address: 'Jl. Keputran Kejambon Gang 2',
    skorUrgensi: 31,
    urgensiKeywords: ['kotoran ayam', 'bau', 'gang sempit'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [45, 65],
  },
  {
    title: 'Tumpukan kulit kelapa muda menggunung di trotoar Jl. Dharmahusada',
    description: 'Pedagang es degan buang sisa serutan kelapa berkarung-karung di trotoar jalan.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Gubeng',
    kelurahan: 'Mojo',
    address: 'Jl. Dharmahusada No. 88',
    skorUrgensi: 50,
    urgensiKeywords: ['kulit kelapa', 'pedagang liar', 'trotoar'],
    status: ReportStatus.BARU,
    daysAgoRange: [11, 21],
  },
  {
    title: 'Limbah cair cucian piring warung pecel lele meluber ke aspal Babatan',
    description: 'Air cucian berminyak dibuang ke got kecil yang mampet sampai menggenang di aspal bikin licin motor.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Wiyung',
    kelurahan: 'Babatan',
    address: 'Jl. Raya Babatan Pratama',
    skorUrgensi: 62,
    urgensiKeywords: ['limbah minyak', 'jalan licin', 'warung tenda'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [7, 14],
  },
  {
    title: 'Sampah botol kaca dan plastik mengapung di pesisir pantai Kenjeran',
    description: 'Garis pantai kenjeran dekat jembatan suroboyo penuh kiriman sampah plastik pas air pasang.',
    category: ReportCategory.KEBERSIHAN,
    kecamatan: 'Kenjeran',
    kelurahan: 'Kenjeran',
    address: 'Bibir Pantai Wisata Kenjeran Baru',
    skorUrgensi: 51,
    urgensiKeywords: ['sampah pantai', 'kenjeran', 'plastik'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [70, 90],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. KEAMANAN & KETERTIBAN UMUM (~11 Laporan)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Aksi balap liar motor knalpot brong tiap jam 1 malam di Jl. Raya Darmo',
    description: 'Puluhan pemuda kumpul balap liar menutup jalan dari lampu merah Al-Falah sampai Santa Maria. Suara knalpot bising sekali dan sangat meresahkan warga sekitar.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Wonokromo',
    kelurahan: 'Darmo',
    address: 'Jl. Raya Darmo (segmen Al-Falah - Santa Maria)',
    skorUrgensi: 88,
    urgensiKeywords: ['balap liar', 'knalpot brong', 'meresahkan', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [1, 4],
  },
  {
    title: 'Marak pencurian helm dan spion motor di parkiran liar Jl. Rungkut Madya',
    description: 'Dalam 3 hari ini sudah 4 motor mahasiswa kehilangan helm bogo dan kaca spion saat parkir beli makanan. Mohon ditingkatkan patroli satpol PP / polisi.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Rungkut',
    kelurahan: 'Kali Rungkut',
    address: 'Jl. Rungkut Madya depan deretan depot',
    skorUrgensi: 74,
    urgensiKeywords: ['pencurian helm', 'spion', 'resah', 'patroli'],
    status: ReportStatus.BARU,
    daysAgoRange: [2, 6],
  },
  {
    title: 'Sekelompok remaja nongkrong bawa sajam celurit di kuburan Rangkah',
    description: 'Tadi malam warga memergoki gerombolan anak muda nongkrong mencurigakan di pinggir makam rangkah bawa pipa besi dan benda tajam. Warga takut tawuran.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Tambaksari',
    kelurahan: 'Rangkah',
    address: 'Area luar Makam Rangkah Jl. Kenjeran',
    skorUrgensi: 96,
    urgensiKeywords: ['senjata tajam', 'tawuran', 'bahaya', 'kritis', 'darurat'],
    status: ReportStatus.BARU,
    daysAgoRange: [0, 2],
  },
  {
    title: 'Penerangan jalan mati total di gang sepi Kedungdoro rawan jambret',
    description: 'Sudah 5 hari gang tembusan gelap sekali karena lampu neon pos ronda mati. Kemarin ada ibu-ibu dipepet motor pas pulang kerja malam.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Tegalsari',
    kelurahan: 'Kedungdoro',
    address: 'Jl. Kedungdoro Gang 9',
    skorUrgensi: 82,
    urgensiKeywords: ['rawan jambret', 'gang gelap', 'lampu mati'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [3, 7],
  },
  {
    title: 'Kamera CCTV pantau Dishub di simpang Diponegoro mati tidak berfungsi',
    description: 'Kamera CCTV pemantau lampu merah simpang jl diponegoro - dr soetomo kelihatan mati mati terus kabelnya putus.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Tegalsari',
    kelurahan: 'Dr. Soetomo',
    address: 'Simpang Traffic Light Jl. Diponegoro',
    skorUrgensi: 64,
    urgensiKeywords: ['cctv mati', 'dishub', 'pantauan lalu lintas'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [30, 45],
  },
  {
    title: 'Pos kamling RT 03 Keputran dirusak orang mabuk',
    description: 'Papan pos ronda dan kaca jendela pecah dihantam balok kayu sama orang mabuk semalam.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Tegalsari',
    kelurahan: 'Keputran',
    address: 'Pos Kamling RT 03 RW 05 Keputran',
    skorUrgensi: 57,
    urgensiKeywords: ['pos kamling rusak', 'orang mabuk', 'rusuh'],
    status: ReportStatus.BARU,
    daysAgoRange: [6, 12],
  },
  {
    title: 'Juru parkir liar pasang tarif 10 ribu maksa di Jl. Ketabang Kali',
    description: 'Ada oknum jukir tanpa karcis resmi mematok tarif mobil Rp 10.000 dan motor Rp 5.000 di dekat wisata sungai.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Genteng',
    kelurahan: 'Ketabang',
    address: 'Jl. Ketabang Kali belakang mall',
    skorUrgensi: 52,
    urgensiKeywords: ['jukir liar', 'tarif maksa', 'tanpa karcis'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [40, 60],
  },
  {
    title: 'Gerbang portal gang gemboknya dirusak di Dukuh Kupang',
    description: 'Gembok rantai portal keamanan lingkungan gang 18 dipotong orang tak dikenal waktu subuh.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Dukuh Pakis',
    kelurahan: 'Dukuh Kupang',
    address: 'Portal Gang 18 Dukuh Kupang',
    skorUrgensi: 70,
    urgensiKeywords: ['portal dirusak', 'gembok dipotong', 'mencurigakan'],
    status: ReportStatus.BARU,
    daysAgoRange: [8, 15],
  },
  {
    title: 'Pencurian burung peliharaan dalam sangkar di teras rumah Petemon',
    description: 'Dua rumah tetangga kemalingan burung kicau pas subuh, pelaku terekam cctv warga naik motor matic.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Sawahan',
    kelurahan: 'Petemon',
    address: 'Jl. Petemon Kali Gang 2',
    skorUrgensi: 48,
    urgensiKeywords: ['kemalingan', 'pencurian burung', 'cctv'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [50, 70],
  },
  {
    title: 'Pengamen maksa minta uang di lampu merah simpang Kenjeran - Mulyorejo',
    description: 'Pengamen menggedor-gedor kaca mobil kalau tidak dikasih uang pas lampu merah.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Mulyorejo',
    kelurahan: 'Mulyorejo',
    address: 'Simpang Empat Kenjeran Mulyorejo',
    skorUrgensi: 53,
    urgensiKeywords: ['pengamen maksa', 'gedor kaca'],
    status: ReportStatus.BARU,
    daysAgoRange: [14, 25],
  },
  {
    title: 'Aksi copet di halte bus Trans Semanggi RSUD Dr Soetomo',
    description: 'Banyak calon penumpang kehilangan dompet dan hp pas jam sibuk antre bus.',
    category: ReportCategory.KEAMANAN,
    kecamatan: 'Gubeng',
    kelurahan: 'Airlangga',
    address: 'Halte Trans Semanggi depan Poliklinik Soetomo',
    skorUrgensi: 78,
    urgensiKeywords: ['copet', 'halte bus', 'antrean'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [4, 9],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. LAINNYA (~7 Laporan)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    title: 'Pohon angsana tua patah dahannya gantung kena kabel PLN di Jl. Basuki Rahmat',
    description: 'Dahan pohon ukuran diameter 30cm patah kena angin kencang kemarin, posisinya nyangkut di kabel listrik tegangan tinggi dan mau jatuh ke jalan raya.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Tegalsari',
    kelurahan: 'Dr. Soetomo',
    address: 'Jl. Basuki Rahmat depan hotel',
    skorUrgensi: 94,
    urgensiKeywords: ['pohon patah', 'kabel pln', 'bahaya kesetrum', 'kritis'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [1, 3],
  },
  {
    title: 'Kabel fiber optik putus menjuntai sampai ke aspal di Jl. Kertajaya',
    description: 'Untaian kabel hitam tebal kendor dan jatuh melintang di jalan. Tadi ada mobil boks lewat nyangkut kabelnya sampai tiangnya ikut goyang.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Gubeng',
    kelurahan: 'Kertajaya',
    address: 'Jl. Kertajaya depan toko kue',
    skorUrgensi: 86,
    urgensiKeywords: ['kabel putus', 'menjuntai', 'nyangkut mobil', 'kritis'],
    status: ReportStatus.BARU,
    daysAgoRange: [0, 3],
  },
  {
    title: 'Sarang lebah tawon vespa besar di pohon pinggir lapangan Pacar Keling',
    description: 'Ada sarang tawon vespa ukuran bola basket di dahan pohon dekat tempat bermain anak-anak. Kemarin ada 2 anak disengat lebah.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Tambaksari',
    kelurahan: 'Pacar Keling',
    address: 'Lapangan Olahraga RW 04 Pacar Keling',
    skorUrgensi: 80,
    urgensiKeywords: ['tawon vespa', 'sarang lebah', 'disengat', 'damkar'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [3, 7],
  },
  {
    title: 'Ular sanca 3 meter masuk ke saluran pipa pembuangan rumah warga Wiyung',
    description: 'Warga melihat ular piton besar masuk ke dalam pipa pembuangan air di dapur, butuh bantuan dinas pemadam kebakaran / BPBD.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Wiyung',
    kelurahan: 'Wiyung',
    address: 'Perumahan Wiyung Pratama Blok B No. 9',
    skorUrgensi: 79,
    urgensiKeywords: ['ular masuk rumah', 'damkar', 'evakuasi ular'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [25, 40],
  },
  {
    title: 'Kucing liar terjebak di dalam gorong-gorong beton sempit Gubeng',
    description: 'Ada anak kucing mengeong lemas kejebak di dalam lubang gorong saluran sejak kemarin siang.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Gubeng',
    kelurahan: 'Gubeng',
    address: 'Jl. Gubeng Masjid Gang 1',
    skorUrgensi: 35,
    urgensiKeywords: ['hewan terjebak', 'kucing', 'gorong got'],
    status: ReportStatus.SELESAI,
    daysAgoRange: [35, 55],
  },
  {
    title: 'Pohon pelindung condong miring ke atap rumah warga di Wonorejo',
    description: 'Batang pohon kersen sudah rapuh dan miring hampir menimpa genteng rumah saat angin kencang.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Rungkut',
    kelurahan: 'Wonorejo',
    address: 'Jl. Wonorejo Timur No. 71',
    skorUrgensi: 63,
    urgensiKeywords: ['pohon miring', 'timpa genteng', 'rawan patah'],
    status: ReportStatus.BARU,
    daysAgoRange: [15, 30],
  },
  {
    title: 'Tiang telkom miring kena kabel tertarik truk di Gunung Sari',
    description: 'Tiang telepon besi miring 45 derajat ke arah jalan gang setelah kabelnya tersangkut truk.',
    category: ReportCategory.LAINNYA,
    kecamatan: 'Dukuh Pakis',
    kelurahan: 'Gunung Sari',
    address: 'Jl. Raya Gunung Sari No. 104',
    skorUrgensi: 70,
    urgensiKeywords: ['tiang miring', 'tersangkut truk'],
    status: ReportStatus.DIPROSES,
    daysAgoRange: [9, 18],
  },
];

async function main() {
  console.log('🌱 Menjalankan script SEED realistis Kota Surabaya (BAGIAN 2)...');

  // 1. Bersihkan database terlebih dahulu (Idempotent execution)
  console.log('🧹 Menghapus data lama...');
  await prisma.statusLog.deleteMany();
  await prisma.report.deleteMany();
  await prisma.category.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.kelurahan.deleteMany();
  console.log('✅ Database bersih (Idempotent ready).');

  // 2. Insert Kategori
  const createdCategories = await Promise.all(
    categoriesData.map(cat => prisma.category.create({ data: cat }))
  );
  console.log(`✅ Dibuat ${createdCategories.length} kategori.`);

  // 3. Insert Kelurahan Surabaya
  const createdKelurahans = await Promise.all(
    kelurahansData.map(k => prisma.kelurahan.create({ data: k }))
  );
  console.log(`✅ Dibuat ${createdKelurahans.length} kelurahan/kecamatan Surabaya.`);

  // 4. Insert Pengguna Akun Demo (Admin, Petugas, Warga)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@petasuarakota.id',
      password: hashedPassword,
      name: 'Admin Command Center Surabaya',
      role: UserRole.ADMIN,
      kelurahanId: createdKelurahans[0].id,
    },
  });

  const petugasPu = await prisma.user.create({
    data: {
      email: 'petugas.pu@petasuarakota.id',
      password: hashedPassword,
      name: 'Ir. Agus Wahyudi (Dinas Bina Marga & Pematusan)',
      role: UserRole.PETUGAS,
      phone: '081234567891',
      kelurahanId: createdKelurahans[0].id,
    },
  });

  const petugasSatpol = await prisma.user.create({
    data: {
      email: 'petugas.satpol@petasuarakota.id',
      password: hashedPassword,
      name: 'Hendra Setiawan (Satpol PP Kota Surabaya)',
      role: UserRole.PETUGAS,
      phone: '081234567892',
      kelurahanId: createdKelurahans[1].id,
    },
  });

  const wargaUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'demo@petasuarakota.id',
        password: hashedPassword,
        name: 'Cak Suroboyo (Warga Aktif)',
        role: UserRole.WARGA,
        phone: '081399887766',
        kelurahanId: createdKelurahans[0].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'bambang.darmo@gmail.com',
        password: hashedPassword,
        name: 'Bambang Soedjarwo (Warga Darmo)',
        role: UserRole.WARGA,
        phone: '081288771122',
        kelurahanId: createdKelurahans[12].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'siti.rungkut@gmail.com',
        password: hashedPassword,
        name: 'Siti Aminah (Warga Rungkut)',
        role: UserRole.WARGA,
        phone: '081233445566',
        kelurahanId: createdKelurahans[28].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'doni.gubeng@gmail.com',
        password: hashedPassword,
        name: 'Doni Prasetyo (Warga Gubeng)',
        role: UserRole.WARGA,
        phone: '085611223344',
        kelurahanId: createdKelurahans[8].id,
      },
    }),
    prisma.user.create({
      data: {
        email: 'ratna.sukolilo@gmail.com',
        password: hashedPassword,
        name: 'Ratna Kusuma (Warga Sukolilo)',
        role: UserRole.WARGA,
        phone: '087788990011',
        kelurahanId: createdKelurahans[24].id,
      },
    }),
  ]);

  console.log(`✅ Dibuat akun user (1 Admin, 2 Petugas dinas, 5 Warga pelapor).`);

  // 5. Buat 75 Laporan Realistis
  console.log(`📝 Memasukkan ${rawReports.length} laporan autentik ke database...`);
  const allWarga = wargaUsers;

  for (let i = 0; i < rawReports.length; i++) {
    const item = rawReports[i];
    
    // Cari kelurahan yang sesuai atau fallback ke terdekat
    const matchedKel = createdKelurahans.find(k => k.name.toLowerCase() === item.kelurahan.toLowerCase()) 
      || createdKelurahans.find(k => k.kecamatan.toLowerCase() === item.kecamatan.toLowerCase())
      || createdKelurahans[i % createdKelurahans.length];

    const categoryRef = createdCategories.find(c => c.type === item.category);
    const assignedUser = allWarga[i % allWarga.length];

    // Generate tanggal sesuai rentang waktu target (Time Slider testing)
    const createdAt = dateDaysAgo(item.daysAgoRange[0], item.daysAgoRange[1]);

    // Beri offset acak pada centroid kelurahan agar pin menyebar natural di jalan/lingkungan
    const latitude = (matchedKel.centroidLat || -7.2575) + randomOffset(0.007);
    const longitude = (matchedKel.centroidLng || 112.7521) + randomOffset(0.007);

    const report = await prisma.report.create({
      data: {
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        latitude,
        longitude,
        address: `${item.address}, ${matchedKel.name}, Kec. ${matchedKel.kecamatan}, Surabaya`,
        kelurahanId: matchedKel.id,
        skorUrgensi: item.skorUrgensi,
        urgensiKeywords: item.urgensiKeywords,
        userId: assignedUser.id,
        categoryId: categoryRef?.id,
        createdAt,
        updatedAt: createdAt,
      },
    });

    // 1. StatusLog awal: BARU
    await prisma.statusLog.create({
      data: {
        reportId: report.id,
        fromStatus: null,
        toStatus: ReportStatus.BARU,
        note: 'Laporan warga berhasil masuk dan diverifikasi oleh sistem Peta Suara Kota.',
        changedById: assignedUser.id,
        changedAt: createdAt,
      },
    });

    // 2. StatusLog jika DIPROSES / SELESAI
    if (item.status === ReportStatus.DIPROSES || item.status === ReportStatus.SELESAI) {
      const processedAt = new Date(createdAt.getTime() + (2 + Math.random() * 8) * 3600000); // 2-10 jam setelah laporan
      const petugas = item.category === ReportCategory.KEAMANAN ? petugasSatpol : petugasPu;

      await prisma.statusLog.create({
        data: {
          reportId: report.id,
          fromStatus: ReportStatus.BARU,
          toStatus: ReportStatus.DIPROSES,
          note: item.category === ReportCategory.KEAMANAN
            ? 'Regu Satpol PP Kota Surabaya telah meluncur ke lokasi untuk patroli & penertiban.'
            : 'Diteruskan ke Satgas Dinas Sumber Daya Air dan Bina Marga untuk tindakan teknis.',
          changedById: petugas.id,
          changedAt: processedAt,
        },
      });

      // 3. StatusLog jika SELESAI
      if (item.status === ReportStatus.SELESAI) {
        const completedAt = new Date(processedAt.getTime() + (8 + Math.random() * 36) * 3600000); // 8-44 jam kemudian
        await prisma.statusLog.create({
          data: {
            reportId: report.id,
            fromStatus: ReportStatus.DIPROSES,
            toStatus: ReportStatus.SELESAI,
            note: 'Penanganan lapangan telah selesai tuntas dan kondisi lokasi sudah normal kembali.',
            changedById: petugas.id,
            changedAt: completedAt,
          },
        });
      }
    }
  }

  // ─── Laporan Statistik Ringkas ───────────────────────────────────────────────
  const total = await prisma.report.count();
  const allData = await prisma.report.findMany();

  const countCat = {
    INFRASTRUKTUR: allData.filter(r => r.category === ReportCategory.INFRASTRUKTUR).length,
    BANJIR: allData.filter(r => r.category === ReportCategory.BANJIR).length,
    KEBERSIHAN: allData.filter(r => r.category === ReportCategory.KEBERSIHAN).length,
    KEAMANAN: allData.filter(r => r.category === ReportCategory.KEAMANAN).length,
    LAINNYA: allData.filter(r => r.category === ReportCategory.LAINNYA).length,
  };

  const countUrgensi = {
    Kritis: allData.filter(r => r.skorUrgensi >= 80).length,
    Tinggi: allData.filter(r => r.skorUrgensi >= 60 && r.skorUrgensi < 80).length,
    Sedang: allData.filter(r => r.skorUrgensi >= 40 && r.skorUrgensi < 60).length,
    Rendah: allData.filter(r => r.skorUrgensi < 40).length,
  };

  const countStatus = {
    BARU: allData.filter(r => r.status === ReportStatus.BARU).length,
    DIPROSES: allData.filter(r => r.status === ReportStatus.DIPROSES).length,
    SELESAI: allData.filter(r => r.status === ReportStatus.SELESAI).length,
  };

  const now = new Date().getTime();
  const countTime = {
    '0 - 7 Hari': allData.filter(r => (now - r.createdAt.getTime()) <= 7 * 86400000).length,
    '8 - 30 Hari': allData.filter(r => {
      const diff = now - r.createdAt.getTime();
      return diff > 7 * 86400000 && diff <= 30 * 86400000;
    }).length,
    '31 - 90 Hari': allData.filter(r => (now - r.createdAt.getTime()) > 30 * 86400000).length,
  };

  console.log('\n=============================================================');
  console.log('📊 SEED STATISTIK LAPORAN SURABAYA:');
  console.log('=============================================================');
  console.log(`TOTAL LAPORAN: ${total}`);
  console.log('\n📁 Sebaran Kategori:');
  console.table(countCat);
  console.log('\n🎯 Sebaran Urgensi (Skor):');
  console.table(countUrgensi);
  console.log('\n🔄 Sebaran Status Laporan:');
  console.table(countStatus);
  console.log('\n⏳ Sebaran Waktu Laporan (Time Slider Filter):');
  console.table(countTime);
  console.log('=============================================================\n');
}

main()
  .catch(e => {
    console.error('❌ Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
