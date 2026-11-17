<?php

namespace App\Console\Commands;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Seed akun demo ke Firestore.
 *
 * Idempoten: cek email dulu sebelum insert, skip jika sudah ada.
 * Tidak menyentuh laporan (data laporan diisi pengguna nyata via web).
 *
 * Penggunaan:
 *   php artisan firestore:seed
 *   php artisan firestore:seed --force   (timpa akun yang sudah ada)
 */
class FirestoreSeedCommand extends Command
{
    protected $signature = 'firestore:seed
                            {--force : Timpa akun yang sudah ada (update)}';

    protected $description = 'Seed akun demo ke Firestore (idempoten)';

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly KelurahanRepositoryInterface $kelurahanRepository,
        private readonly CounterRepositoryInterface $counterRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('');
        $this->info('=== Firestore Seed: PATROL Master Data ===');
        $this->info('');

        $force = (bool) $this->option('force');

        // Ambil kelurahan pertama sebagai default kelurahan_id
        $kelurahans = $this->kelurahanRepository->all();
        if (empty($kelurahans)) {
            $this->error('Gagal: data kelurahan tidak tersedia. Pastikan StaticKelurahanRepository dapat membaca file JSON.');
            return self::FAILURE;
        }

        $firstKelurahan = $kelurahans[0];
        $kelurahanId = $firstKelurahan['id'] ?? $firstKelurahan['kode'] ?? 'unknown';

        $this->info('Kelurahan default untuk seed: ' . ($firstKelurahan['name'] ?? $kelurahanId));
        $this->info('');

        $hashedPass = Hash::make('password123');

        $accounts = [
            [
                'email'        => 'admin@petasuarakota.id',
                'name'         => 'Admin Command Center Surabaya',
                'role'         => 'ADMIN',
                'phone'        => null,
                'kelurahan_id' => $kelurahanId,
                'is_active'    => true,
                'password'     => $hashedPass,
            ],
            [
                'email'        => 'petugas.pu@petasuarakota.id',
                'name'         => 'Ir. Agus Wahyudi (Dinas Bina Marga)',
                'role'         => 'PETUGAS',
                'phone'        => '081234567891',
                'kelurahan_id' => $kelurahanId,
                'is_active'    => true,
                'password'     => $hashedPass,
            ],
            [
                'email'        => 'petugas.satpol@petasuarakota.id',
                'name'         => 'Hendra Setiawan (Satpol PP Surabaya)',
                'role'         => 'PETUGAS',
                'phone'        => '081234567892',
                'kelurahan_id' => $kelurahanId,
                'is_active'    => true,
                'password'     => $hashedPass,
            ],
            [
                'email'        => 'demo@petasuarakota.id',
                'name'         => 'Cak Suroboyo (Warga Demo)',
                'role'         => 'WARGA',
                'phone'        => '081399887766',
                'kelurahan_id' => $kelurahanId,
                'is_active'    => true,
                'password'     => $hashedPass,
            ],
            [
                'email'        => 'warga@petasuarakota.id',
                'name'         => 'Warga Surabaya',
                'role'         => 'WARGA',
                'phone'        => null,
                'kelurahan_id' => $kelurahanId,
                'is_active'    => true,
                'password'     => $hashedPass,
            ],
        ];

        $created = 0;
        $skipped = 0;
        $updated = 0;

        foreach ($accounts as $acc) {
            $existing = $this->userRepository->findByEmail($acc['email']);

            if ($existing && !$force) {
                $this->line('  [SKIP]    ' . $acc['email'] . ' (sudah ada, gunakan --force untuk timpa)');
                $skipped++;
                continue;
            }

            if ($existing && $force) {
                // Update: perbarui data kecuali password (jangan timpa jika sudah diganti)
                $updateData = [
                    'name'         => $acc['name'],
                    'role'         => $acc['role'],
                    'phone'        => $acc['phone'],
                    'kelurahan_id' => $acc['kelurahan_id'],
                    'is_active'    => $acc['is_active'],
                ];
                $this->userRepository->update($existing['id'], $updateData);
                $this->line('  [UPDATE]  ' . $acc['email'] . ' (' . $acc['role'] . ')');
                $updated++;
                continue;
            }

            // Insert baru
            $data = array_merge($acc, [
                'id' => (string) Str::uuid(),
            ]);

            $this->userRepository->create($data);
            $this->line('  [CREATE]  ' . $acc['email'] . ' (' . $acc['role'] . ')');
            $created++;
        }

        $this->info('');
        $this->info('Hasil seed:');
        $this->info('  Dibuat  : ' . $created . ' akun');
        if ($updated > 0) {
            $this->info('  Diperbarui: ' . $updated . ' akun');
        }
        if ($skipped > 0) {
            $this->info('  Dilewati: ' . $skipped . ' akun (sudah ada)');
        }
        $this->info('');
        $this->info('Password demo: password123');
        $this->info('');
        $this->info('=== Seed selesai ===');
        $this->info('');

        return self::SUCCESS;
    }
}
