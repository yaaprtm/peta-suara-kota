<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\StatusLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database idempotently.
     */
    public function run(): void
    {
        $jsonPath = __DIR__ . '/seed_data.json';
        if (!file_exists($jsonPath)) {
            $this->command->error("File seed_data.json tidak ditemukan di {$jsonPath}");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);
        $kelurahansData = $data['kelurahans'] ?? [];
        $categoriesData = $data['categories'] ?? [];
        $rawReports = $data['rawReports'] ?? [];

        $this->command->info("🌱 Memulai seeding database Peta Suara Kota...");

        // 1. Insert / Update Categories
        $createdCategories = [];
        foreach ($categoriesData as $c) {
            $createdCategories[$c['type']] = Category::updateOrCreate(
                ['type' => $c['type']],
                [
                    'name' => $c['name'],
                    'icon' => $c['icon'],
                    'description' => $c['description'] ?? null,
                    'base_score' => $c['baseScore'] ?? 30,
                ]
            );
        }
        $this->command->info("✅ Berhasil memproses " . count($createdCategories) . " kategori laporan.");

        // 2. Insert / Update Kelurahans
        $createdKelurahans = [];
        foreach ($kelurahansData as $k) {
            $kelurahan = Kelurahan::updateOrCreate(
                ['name' => $k['name'], 'kecamatan' => $k['kecamatan']],
                [
                    'kota' => $k['kota'] ?? 'Surabaya',
                    'centroid_lat' => $k['centroidLat'] ?? null,
                    'centroid_lng' => $k['centroidLng'] ?? null,
                ]
            );
            $createdKelurahans[] = $kelurahan;
        }
        $this->command->info("✅ Berhasil memproses " . count($createdKelurahans) . " kelurahan/kecamatan Surabaya.");

        // 3. Insert / Update Users Demo
        $hashedPassword = Hash::make('password123');

        $adminUser = User::updateOrCreate(
            ['email' => 'admin@petasuarakota.id'],
            [
                'name' => 'Admin Command Center Surabaya',
                'password' => $hashedPassword,
                'role' => 'ADMIN',
                'kelurahan_id' => $createdKelurahans[0]->id,
                'is_active' => true,
            ]
        );

        $petugasPu = User::updateOrCreate(
            ['email' => 'petugas.pu@petasuarakota.id'],
            [
                'name' => 'Ir. Agus Wahyudi (Dinas Bina Marga & Pematusan)',
                'password' => $hashedPassword,
                'role' => 'PETUGAS',
                'phone' => '081234567891',
                'kelurahan_id' => $createdKelurahans[0]->id,
                'is_active' => true,
            ]
        );

        $petugasSatpol = User::updateOrCreate(
            ['email' => 'petugas.satpol@petasuarakota.id'],
            [
                'name' => 'Hendra Setiawan (Satpol PP Kota Surabaya)',
                'password' => $hashedPassword,
                'role' => 'PETUGAS',
                'phone' => '081234567892',
                'kelurahan_id' => $createdKelurahans[1]->id,
                'is_active' => true,
            ]
        );

        $wargaDemoDefs = [
            [
                'email' => 'demo@petasuarakota.id',
                'name' => 'Cak Suroboyo (Warga Aktif)',
                'phone' => '081399887766',
                'kelurahan_index' => 0,
            ],
            [
                'email' => 'bambang.darmo@gmail.com',
                'name' => 'Bambang Soedjarwo (Warga Darmo)',
                'phone' => '081288771122',
                'kelurahan_index' => 12,
            ],
            [
                'email' => 'siti.rungkut@gmail.com',
                'name' => 'Siti Aminah (Warga Rungkut)',
                'phone' => '081233445566',
                'kelurahan_index' => 28,
            ],
            [
                'email' => 'doni.gubeng@gmail.com',
                'name' => 'Doni Prasetyo (Warga Gubeng)',
                'phone' => '085611223344',
                'kelurahan_index' => 8,
            ],
            [
                'email' => 'ratna.sukolilo@gmail.com',
                'name' => 'Ratna Kusuma (Warga Sukolilo)',
                'phone' => '087788990011',
                'kelurahan_index' => 24,
            ],
        ];

        $wargaUsers = [];
        foreach ($wargaDemoDefs as $wDef) {
            $kelId = isset($createdKelurahans[$wDef['kelurahan_index']])
                ? $createdKelurahans[$wDef['kelurahan_index']]->id
                : $createdKelurahans[0]->id;

            $wargaUsers[] = User::updateOrCreate(
                ['email' => $wDef['email']],
                [
                    'name' => $wDef['name'],
                    'password' => $hashedPassword,
                    'role' => 'WARGA',
                    'phone' => $wDef['phone'],
                    'kelurahan_id' => $kelId,
                    'is_active' => true,
                ]
            );
        }
        $this->command->info("✅ Berhasil memproses 8 akun pengguna (1 Admin, 2 Petugas dinas, 5 Warga).");

        // 4. Insert / Update 75 Realistic Reports
        $this->command->info("📝 Memasukkan " . count($rawReports) . " laporan autentik ke database...");

        foreach ($rawReports as $i => $item) {
            // Match kelurahan
            $matchedKel = null;
            foreach ($createdKelurahans as $k) {
                if (strcasecmp($k->name, $item['kelurahan']) === 0) {
                    $matchedKel = $k;
                    break;
                }
            }
            if (!$matchedKel) {
                foreach ($createdKelurahans as $k) {
                    if (strcasecmp($k->kecamatan, $item['kecamatan']) === 0) {
                        $matchedKel = $k;
                        break;
                    }
                }
            }
            if (!$matchedKel) {
                $matchedKel = $createdKelurahans[$i % count($createdKelurahans)];
            }

            $categoryRef = $createdCategories[$item['category']] ?? null;
            $assignedUser = $wargaUsers[$i % count($wargaUsers)];

            // Random days ago between daysAgoRange
            $minDays = $item['daysAgoRange'][0] ?? 0;
            $maxDays = $item['daysAgoRange'][1] ?? 7;
            $daysAgo = $minDays + (mt_rand(0, 1000) / 1000) * max(0.1, ($maxDays - $minDays));

            $createdAt = Carbon::now()
                ->subSeconds((int) ($daysAgo * 86400))
                ->setHour(rand(6, 22))
                ->setMinute(rand(0, 59))
                ->setSecond(rand(0, 59));

            // Offset koordinat kecil agar titik menyebar alami
            $latOffset = (mt_rand(-35, 35) / 10000);
            $lngOffset = (mt_rand(-35, 35) / 10000);

            $latitude = ($matchedKel->centroid_lat ?? -7.2575) + $latOffset;
            $longitude = ($matchedKel->centroid_lng ?? 112.7400) + $lngOffset;

            $address = "{$item['address']}, {$matchedKel->name}, Kec. {$matchedKel->kecamatan}, Surabaya";

            $report = Report::updateOrCreate(
                ['title' => $item['title']],
                [
                    'description' => $item['description'],
                    'category' => $item['category'],
                    'status' => $item['status'],
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'address' => $address,
                    'kelurahan_id' => $matchedKel->id,
                    'kecamatan' => $matchedKel->kecamatan,
                    'skor_urgensi' => $item['skorUrgensi'],
                    'urgensi_keywords' => $item['urgensiKeywords'],
                    'user_id' => $assignedUser->id,
                    'category_id' => $categoryRef?->id,
                    'created_at' => $createdAt,
                    'updated_at' => $createdAt,
                ]
            );

            // 1. Status log BARU
            StatusLog::updateOrCreate(
                ['report_id' => $report->id, 'to_status' => 'BARU'],
                [
                    'from_status' => null,
                    'note' => 'Laporan diterima oleh sistem',
                    'changed_by_id' => $assignedUser->id,
                    'changed_at' => $createdAt,
                ]
            );

            // 2. Status log DIPROSES
            if (in_array($item['status'], ['DIPROSES', 'SELESAI'])) {
                $processedAt = $createdAt->copy()->addHours(rand(2, 8));
                $petugas = $item['category'] === 'KEAMANAN' ? $petugasSatpol : $petugasPu;
                $note = $item['category'] === 'KEAMANAN'
                    ? 'Regu Satpol PP Kota Surabaya telah meluncur ke lokasi untuk patroli & penertiban.'
                    : 'Diteruskan ke Satgas Dinas Sumber Daya Air dan Bina Marga untuk tindakan teknis.';

                StatusLog::updateOrCreate(
                    ['report_id' => $report->id, 'to_status' => 'DIPROSES'],
                    [
                        'from_status' => 'BARU',
                        'note' => $note,
                        'changed_by_id' => $petugas->id,
                        'changed_at' => $processedAt,
                    ]
                );

                // 3. Status log SELESAI
                if ($item['status'] === 'SELESAI') {
                    $completedAt = $processedAt->copy()->addHours(rand(8, 36));
                    StatusLog::updateOrCreate(
                        ['report_id' => $report->id, 'to_status' => 'SELESAI'],
                        [
                            'from_status' => 'DIPROSES',
                            'note' => 'Penanganan lapangan telah selesai tuntas dan kondisi lokasi sudah normal kembali.',
                            'changed_by_id' => $petugas->id,
                            'changed_at' => $completedAt,
                        ]
                    );
                }
            }
        }

        // 5. Statistik Seeder
        $allReports = Report::all();
        $total = $allReports->count();

        $catCounts = [
            ['INFRASTRUKTUR', $allReports->where('category', 'INFRASTRUKTUR')->count()],
            ['BANJIR', $allReports->where('category', 'BANJIR')->count()],
            ['KEBERSIHAN', $allReports->where('category', 'KEBERSIHAN')->count()],
            ['KEAMANAN', $allReports->where('category', 'KEAMANAN')->count()],
            ['LAINNYA', $allReports->where('category', 'LAINNYA')->count()],
        ];

        $urgencyCounts = [
            ['Kritis (>= 80)', $allReports->where('skor_urgensi', '>=', 80)->count()],
            ['Tinggi (60 - 79)', $allReports->filter(fn($r) => $r->skor_urgensi >= 60 && $r->skor_urgensi < 80)->count()],
            ['Sedang (40 - 59)', $allReports->filter(fn($r) => $r->skor_urgensi >= 40 && $r->skor_urgensi < 60)->count()],
            ['Rendah (< 40)', $allReports->where('skor_urgensi', '<', 40)->count()],
        ];

        $statusCounts = [
            ['BARU', $allReports->where('status', 'BARU')->count()],
            ['DIPROSES', $allReports->where('status', 'DIPROSES')->count()],
            ['SELESAI', $allReports->where('status', 'SELESAI')->count()],
        ];

        $now = Carbon::now();
        $timeCounts = [
            ['0 - 7 Hari Terakhir', $allReports->filter(fn($r) => $now->diffInDays($r->created_at) <= 7)->count()],
            ['8 - 30 Hari Lalu', $allReports->filter(fn($r) => $now->diffInDays($r->created_at) > 7 && $now->diffInDays($r->created_at) <= 30)->count()],
            ['31 - 90 Hari Lalu', $allReports->filter(fn($r) => $now->diffInDays($r->created_at) > 30)->count()],
        ];

        $this->command->info("\n=============================================================");
        $this->command->info("📊 SEED STATISTIK LAPORAN SURABAYA:");
        $this->command->info("=============================================================");
        $this->command->info("TOTAL LAPORAN: {$total}");

        $this->command->table(['Kategori', 'Jumlah'], $catCounts);
        $this->command->table(['Level Urgensi (Skor)', 'Jumlah'], $urgencyCounts);
        $this->command->table(['Status Laporan', 'Jumlah'], $statusCounts);
        $this->command->table(['Sebaran Waktu (Time Slider)', 'Jumlah'], $timeCounts);
        $this->command->info("=============================================================\n");
    }
}
