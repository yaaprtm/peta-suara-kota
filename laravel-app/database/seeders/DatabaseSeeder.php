<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed master data: kelurahan, kategori, dan akun demo.
     * Data laporan tidak di-seed — diisi oleh pengguna nyata via web.
     */
    public function run(): void
    {
        $this->command->info("🌱 Seeding Peta Suara Kota (PATROL) — master data only...");

        // 1. Kelurahan lengkap 156 kelurahan / 31 kecamatan Surabaya
        $this->call(KelurahanLengkapSeeder::class);

        // 2. Kategori laporan
        $categories = [
            ['type' => 'INFRASTRUKTUR', 'name' => 'Infrastruktur',  'icon' => 'road',    'description' => 'Jalan, jembatan, drainase, lampu jalan, fasilitas umum.', 'base_score' => 40],
            ['type' => 'KEBERSIHAN',    'name' => 'Kebersihan',     'icon' => 'trash',   'description' => 'Sampah, TPS, kebersihan fasilitas publik.',              'base_score' => 30],
            ['type' => 'KEAMANAN',      'name' => 'Keamanan',       'icon' => 'shield',  'description' => 'Gangguan ketertiban, kriminalitas, kerawanan wilayah.',   'base_score' => 50],
            ['type' => 'BANJIR',        'name' => 'Banjir',         'icon' => 'water',   'description' => 'Genangan, banjir rob, saluran tersumbat.',                'base_score' => 45],
            ['type' => 'LAINNYA',       'name' => 'Lainnya',        'icon' => 'dots',    'description' => 'Laporan lain yang tidak masuk kategori di atas.',         'base_score' => 25],
        ];

        foreach ($categories as $c) {
            Category::updateOrCreate(
                ['type' => $c['type']],
                [
                    'name'        => $c['name'],
                    'icon'        => $c['icon'],
                    'description' => $c['description'],
                    'base_score'  => $c['base_score'],
                ]
            );
        }
        $this->command->info("✅ " . count($categories) . " kategori laporan.");

        // 3. Akun demo (idempoten — tidak akan duplikat jika dijalankan ulang)
        $kelurahans   = Kelurahan::all();
        $first        = $kelurahans->first();
        $hashedPass   = Hash::make('password123');

        $accounts = [
            // Superadmin
            ['email' => 'admin@petasuarakota.id',        'name' => 'Admin Command Center Surabaya',              'role' => 'ADMIN',   'phone' => null],
            // Petugas
            ['email' => 'petugas.pu@petasuarakota.id',   'name' => 'Ir. Agus Wahyudi (Dinas Bina Marga)',        'role' => 'PETUGAS', 'phone' => '081234567891'],
            ['email' => 'petugas.satpol@petasuarakota.id','name' => 'Hendra Setiawan (Satpol PP Surabaya)',       'role' => 'PETUGAS', 'phone' => '081234567892'],
            // Warga demo
            ['email' => 'demo@petasuarakota.id',          'name' => 'Cak Suroboyo (Warga Demo)',                  'role' => 'WARGA',   'phone' => '081399887766'],
            ['email' => 'warga@petasuarakota.id',         'name' => 'Warga Surabaya',                             'role' => 'WARGA',   'phone' => null],
        ];

        foreach ($accounts as $acc) {
            User::updateOrCreate(
                ['email' => $acc['email']],
                [
                    'name'         => $acc['name'],
                    'password'     => $hashedPass,
                    'role'         => $acc['role'],
                    'phone'        => $acc['phone'],
                    'kelurahan_id' => $first?->id,
                    'is_active'    => true,
                ]
            );
        }
        $this->command->info("✅ " . count($accounts) . " akun demo (password: password123).");

        $this->command->info("");
        $this->command->info("===========================================");
        $this->command->info("✅ PATROL — master data selesai.");
        $this->command->info("   Kelurahan : " . Kelurahan::count());
        $this->command->info("   Kategori  : " . Category::count());
        $this->command->info("   Users     : " . User::count());
        $this->command->info("   Laporan   : diisi pengguna nyata via web.");
        $this->command->info("===========================================");
    }
}
