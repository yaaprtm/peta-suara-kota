<?php

namespace Database\Seeders;

use App\Models\Kelurahan;
use Illuminate\Database\Seeder;

class KelurahanLengkapSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = __DIR__ . '/kelurahan_surabaya_lengkap.json';

        if (!file_exists($jsonPath)) {
            $this->command->error("File kelurahan_surabaya_lengkap.json tidak ditemukan.");
            return;
        }

        $data = json_decode(file_get_contents($jsonPath), true);

        $this->command->info("🗺️  Menyinkronkan " . count($data) . " kelurahan Surabaya ke database...");

        $inserted = 0;
        $updated  = 0;

        foreach ($data as $k) {
            $existed = Kelurahan::where('name', $k['name'])
                ->where('kecamatan', $k['kecamatan'])
                ->exists();

            Kelurahan::updateOrCreate(
                ['name' => $k['name'], 'kecamatan' => $k['kecamatan']],
                [
                    'kota'         => 'Surabaya',
                    'centroid_lat' => $k['centroidLat'],
                    'centroid_lng' => $k['centroidLng'],
                ]
            );

            $existed ? $updated++ : $inserted++;
        }

        $total = Kelurahan::count();
        $this->command->info("✅ Selesai: {$inserted} ditambah, {$updated} diperbarui.");
        $this->command->info("📊 Total kelurahan di database: {$total}");

        // Ringkasan per kecamatan
        $kecamatanList = Kelurahan::selectRaw('kecamatan, COUNT(*) as jumlah')
            ->groupBy('kecamatan')
            ->orderBy('kecamatan')
            ->get();

        $this->command->table(
            ['Kecamatan', 'Jumlah Kelurahan'],
            $kecamatanList->map(fn($k) => [$k->kecamatan, $k->jumlah])->toArray()
        );
    }
}
