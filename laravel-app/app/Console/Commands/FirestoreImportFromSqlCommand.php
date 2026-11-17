<?php

namespace App\Console\Commands;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Impor data dari TiDB/MySQL ke Firestore.
 *
 * Urutan: users -> reports (dengan status_logs embed) -> recalculate counters
 *
 * Idempoten: dokumen Firestore yang sudah ada akan dilewati (kecuali --force).
 * Gunakan --dry-run untuk pratinjau tanpa menulis ke Firestore.
 * Gunakan --limit=N untuk membatasi jumlah records per entitas.
 *
 * PENTING: Command ini membaca dari koneksi 'mysql' (TiDB) dan menulis ke Firestore.
 * Pastikan FIREBASE_DRIVER=firestore dan kredensial Firestore sudah dikonfigurasi.
 *
 * Penggunaan:
 *   php artisan firestore:import-from-sql --dry-run
 *   php artisan firestore:import-from-sql --limit=10
 *   php artisan firestore:import-from-sql
 *   php artisan firestore:import-from-sql --force
 */
class FirestoreImportFromSqlCommand extends Command
{
    protected $signature = 'firestore:import-from-sql
                            {--dry-run : Pratinjau impor tanpa menulis ke Firestore}
                            {--force : Timpa dokumen Firestore yang sudah ada}
                            {--limit=0 : Batasi jumlah records per entitas (0 = tanpa batas)}
                            {--skip-users : Lewati impor users}
                            {--skip-reports : Lewati impor reports}
                            {--skip-counters : Lewati kalkulasi ulang counters}';

    protected $description = 'Impor data dari TiDB/MySQL ke Firestore (idempoten, mendukung --dry-run)';

    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly ReportRepositoryInterface $reportRepository,
        private readonly CounterRepositoryInterface $counterRepository,
        private readonly KelurahanRepositoryInterface $kelurahanRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $limit = (int) $this->option('limit');
        $skipUsers = (bool) $this->option('skip-users');
        $skipReports = (bool) $this->option('skip-reports');
        $skipCounters = (bool) $this->option('skip-counters');

        $this->info('');
        $this->info('=== Firestore Import dari TiDB/MySQL ===');
        $this->info('Mode : ' . ($dryRun ? 'DRY-RUN (tidak ada yang ditulis)' : 'TULIS KE FIRESTORE'));
        if ($limit > 0) {
            $this->info('Limit: ' . $limit . ' records per entitas');
        }
        $this->info('');

        if ($dryRun) {
            $this->warn('Mode dry-run aktif. Tidak ada data yang akan ditulis ke Firestore.');
            $this->warn('Jalankan tanpa --dry-run untuk memulai impor sesungguhnya.');
            $this->info('');
        }

        if (!$this->verifyDatabaseConnection()) {
            return self::FAILURE;
        }

        // --- Impor Users ---
        if (!$skipUsers) {
            $userCount = $this->importUsers($dryRun, $force, $limit);
            $this->info('');
        }

        // --- Impor Reports ---
        $allImportedReports = [];
        if (!$skipReports) {
            $allImportedReports = $this->importReports($dryRun, $force, $limit);
            $this->info('');
        }

        // --- Kalkulasi Ulang Counter ---
        if (!$skipCounters && !$dryRun) {
            $this->info('--- Kalkulasi ulang counter agregasi ---');

            if (empty($allImportedReports) && !$skipReports) {
                $this->warn('Tidak ada laporan yang diimpor. Counter tidak diubah.');
            } elseif ($skipReports) {
                $this->warn('Impor laporan dilewati (--skip-reports). Counter tidak dikalkulasi ulang.');
            } else {
                $this->info('Menghitung ulang global_stats, leaderboard, dan kecamatan_density...');
                try {
                    $this->counterRepository->recalculate($allImportedReports);
                    $this->info('[OK]  Counter dikalkulasi ulang dari ' . count($allImportedReports) . ' laporan.');
                } catch (\Throwable $e) {
                    $this->error('[ERROR] Kalkulasi counter gagal: ' . $e->getMessage());
                }
            }
            $this->info('');
        } elseif ($skipCounters) {
            $this->warn('Kalkulasi counter dilewati (--skip-counters).');
            $this->info('');
        }

        $this->info('=== Impor selesai ===');
        $this->info('');

        return self::SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Helper: Verifikasi Koneksi Database SQL
    // -------------------------------------------------------------------------

    private function verifyDatabaseConnection(): bool
    {
        $this->info('Memeriksa koneksi ke database MySQL/TiDB...');

        try {
            DB::connection('mysql')->getPdo();
            $this->info('[OK]  Koneksi MySQL/TiDB berhasil.');
            return true;
        } catch (\Throwable $e) {
            $this->error('[ERROR] Tidak dapat terhubung ke database MySQL/TiDB:');
            $this->error('  ' . $e->getMessage());
            $this->error('');
            $this->error('Pastikan konfigurasi koneksi "mysql" di config/database.php sudah benar');
            $this->error('dan environment variable DB_HOST, DB_DATABASE, dll. sudah diset di .env');
            return false;
        }
    }

    // -------------------------------------------------------------------------
    // Impor Users
    // -------------------------------------------------------------------------

    private function importUsers(bool $dryRun, bool $force, int $limit): int
    {
        $this->info('--- Impor Users ---');

        $query = DB::connection('mysql')->table('users')->orderBy('created_at');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $users = $query->get();
        $this->info('Ditemukan ' . $users->count() . ' user di MySQL.');

        if ($users->isEmpty()) {
            $this->warn('Tidak ada user ditemukan di MySQL. Lewati.');
            return 0;
        }

        $created = 0;
        $skipped = 0;
        $errors = 0;

        foreach ($users as $sqlUser) {
            $email = mb_strtolower(trim($sqlUser->email ?? ''));
            if (!$email) {
                $this->warn('  [SKIP]  User ID=' . ($sqlUser->id ?? '?') . ' tidak memiliki email, dilewati.');
                $skipped++;
                continue;
            }

            // Gunakan UUID yang ada atau buat baru
            $firestoreId = !empty($sqlUser->id) ? (string) $sqlUser->id : (string) Str::uuid();

            // Pastikan format UUID
            if (!Str::isUuid($firestoreId)) {
                $firestoreId = (string) Str::uuid();
            }

            $data = [
                'id'           => $firestoreId,
                'name'         => $sqlUser->name ?? '',
                'email'        => $email,
                'password'     => $sqlUser->password ?? '',
                'role'         => strtoupper($sqlUser->role ?? 'WARGA'),
                'phone'        => $sqlUser->phone ?? null,
                'kelurahan_id' => $sqlUser->kelurahan_id ? (string) $sqlUser->kelurahan_id : null,
                'is_active'    => (bool) ($sqlUser->is_active ?? true),
                'created_at'   => $this->toIso($sqlUser->created_at),
                'updated_at'   => $this->toIso($sqlUser->updated_at),
            ];

            if ($dryRun) {
                $this->line('  [DRY]   ' . $email . ' (' . $data['role'] . ')');
                $created++;
                continue;
            }

            try {
                $existing = $this->userRepository->findByEmail($email);

                if ($existing && !$force) {
                    $this->line('  [SKIP]  ' . $email . ' (sudah ada di Firestore)');
                    $skipped++;
                    continue;
                }

                if ($existing && $force) {
                    $this->userRepository->update($existing['id'], $data);
                    $this->line('  [UPDATE] ' . $email . ' (' . $data['role'] . ')');
                    $created++;
                    continue;
                }

                $this->userRepository->create($data);
                $this->line('  [CREATE] ' . $email . ' (' . $data['role'] . ')');
                $created++;
            } catch (\Throwable $e) {
                $this->error('  [ERROR] ' . $email . ': ' . $e->getMessage());
                $errors++;
            }
        }

        $label = $dryRun ? 'akan diimpor' : 'diimpor';
        $this->info('Users: ' . $created . ' ' . $label . ', ' . $skipped . ' dilewati, ' . $errors . ' error.');
        return $created;
    }

    // -------------------------------------------------------------------------
    // Impor Reports
    // -------------------------------------------------------------------------

    private function importReports(bool $dryRun, bool $force, int $limit): array
    {
        $this->info('--- Impor Reports ---');

        $query = DB::connection('mysql')->table('reports')->orderBy('created_at');
        if ($limit > 0) {
            $query->limit($limit);
        }

        $reports = $query->get();
        $this->info('Ditemukan ' . $reports->count() . ' laporan di MySQL.');

        if ($reports->isEmpty()) {
            $this->warn('Tidak ada laporan ditemukan di MySQL. Lewati.');
            return [];
        }

        // Ambil semua status_logs sekaligus untuk menghindari N+1 query ke SQL
        $allLogIds = $reports->pluck('id')->toArray();
        $sqlLogs = [];
        if (!empty($allLogIds)) {
            // Bagi ke chunks agar tidak melebihi batas parameter SQL
            $chunks = array_chunk($allLogIds, 200);
            foreach ($chunks as $chunk) {
                $rows = DB::connection('mysql')
                    ->table('status_logs')
                    ->whereIn('report_id', $chunk)
                    ->orderBy('created_at')
                    ->get();
                foreach ($rows as $row) {
                    $sqlLogs[(string) $row->report_id][] = $row;
                }
            }
        }

        // Build peta kelurahan: id -> data kelurahan
        $kelurahanMap = [];
        foreach ($this->kelurahanRepository->all() as $k) {
            $kelurahanMap[(string) $k['id']] = $k;
        }

        $created = 0;
        $skipped = 0;
        $errors = 0;
        $importedReports = [];

        foreach ($reports as $sqlReport) {
            $sqlId = (string) ($sqlReport->id ?? '');
            $trackingCode = strtoupper(trim($sqlReport->tracking_code ?? ''));

            if (!$trackingCode) {
                $trackingCode = 'RPT-' . strtoupper(Str::random(8));
            }

            // Gunakan tracking_code sebagai document ID (deterministik)
            $firestoreId = $trackingCode;

            // Bangun status_logs embed dari SQL
            $statusLogs = [];
            if (!empty($sqlLogs[$sqlId])) {
                foreach ($sqlLogs[$sqlId] as $log) {
                    $statusLogs[] = [
                        'status'     => strtoupper($log->status ?? 'BARU'),
                        'note'       => $log->note ?? null,
                        'changed_by' => [
                            'id'   => (string) ($log->changed_by_id ?? ''),
                            'name' => $log->changed_by_name ?? 'System',
                            'role' => strtoupper($log->changed_by_role ?? 'SYSTEM'),
                        ],
                        'timestamp'  => $this->toIso($log->created_at),
                    ];
                }
            } else {
                // Minimal: satu entri awal
                $statusLogs[] = [
                    'status'     => 'BARU',
                    'note'       => null,
                    'changed_by' => ['id' => '', 'name' => 'Import', 'role' => 'SYSTEM'],
                    'timestamp'  => $this->toIso($sqlReport->created_at),
                ];
            }

            // Kelurahan data
            $kelurahanId = (string) ($sqlReport->kelurahan_id ?? '');
            $kelData = $kelurahanMap[$kelurahanId] ?? null;
            $kelurahan = $kelData ? [
                'id'        => $kelData['id'],
                'name'      => $kelData['name'],
                'kecamatan' => $kelData['kecamatan'],
                'kota'      => $kelData['kota'] ?? 'Surabaya',
            ] : [
                'id'        => $kelurahanId,
                'name'      => $sqlReport->kelurahan_name ?? '',
                'kecamatan' => $sqlReport->kecamatan ?? '',
                'kota'      => 'Surabaya',
            ];

            $reportData = [
                'id'              => $firestoreId,
                'tracking_code'   => $trackingCode,
                'title'           => $sqlReport->title ?? '',
                'description'     => $sqlReport->description ?? '',
                'category'        => strtoupper($sqlReport->category ?? 'LAINNYA'),
                'status'          => strtoupper($sqlReport->status ?? 'BARU'),
                'lat'             => (float) ($sqlReport->lat ?? 0),
                'lng'             => (float) ($sqlReport->lng ?? 0),
                'latitude'        => (float) ($sqlReport->lat ?? 0),
                'longitude'       => (float) ($sqlReport->lng ?? 0),
                'address'         => $sqlReport->address ?? null,
                'kelurahan_id'    => $kelurahanId,
                'kelurahan'       => $kelurahan,
                'kecamatan'       => $kelurahan['kecamatan'],
                'reporter_id'     => (string) ($sqlReport->reporter_id ?? ''),
                'reporter_name'   => $sqlReport->reporter_name ?? 'Anonim',
                'reporter_phone'  => $sqlReport->reporter_phone ?? null,
                'photo_url'       => $sqlReport->photo_url ?? null,
                'audio_url'       => $sqlReport->audio_url ?? null,
                'skor_urgensi'    => (float) ($sqlReport->skor_urgensi ?? 0),
                'upvote_count'    => (int) ($sqlReport->upvote_count ?? 0),
                'status_logs'     => $statusLogs,
                'completion_data' => $this->parseJson($sqlReport->completion_data ?? null),
                'created_at'      => $this->toIso($sqlReport->created_at),
                'updated_at'      => $this->toIso($sqlReport->updated_at),
            ];

            if ($dryRun) {
                $this->line('  [DRY]   ' . $trackingCode . ' - ' . substr($reportData['title'], 0, 50));
                $importedReports[] = $reportData;
                $created++;
                continue;
            }

            try {
                $existing = $this->reportRepository->findByTrackingCode($trackingCode);

                if ($existing && !$force) {
                    $this->line('  [SKIP]  ' . $trackingCode . ' (sudah ada di Firestore)');
                    $skipped++;
                    // Tetap masukkan ke list untuk kalkulasi counter
                    $importedReports[] = $reportData;
                    continue;
                }

                // Gunakan createDocument langsung via client untuk menghindari double counter increment
                // (ReportRepository::create() akan increment counter, kita ingin kontrol manual via recalculate())
                // Inject ke Firestore via update/create document langsung
                if ($existing && $force) {
                    // Update menggunakan repository standar tanpa side effect counter
                    // Karena FirestoreReportRepository tidak punya updateFull(), kita patch langsung
                    $this->patchReportDirectly($reportData);
                    $this->line('  [UPDATE] ' . $trackingCode . ' - ' . substr($reportData['title'], 0, 50));
                } else {
                    $this->patchReportDirectly($reportData);
                    $this->line('  [CREATE] ' . $trackingCode . ' - ' . substr($reportData['title'], 0, 50));
                }

                $importedReports[] = $reportData;
                $created++;
            } catch (\Throwable $e) {
                $this->error('  [ERROR] ' . $trackingCode . ': ' . $e->getMessage());
                $errors++;
            }
        }

        $label = $dryRun ? 'akan diimpor' : 'diimpor';
        $this->info('Laporan: ' . $created . ' ' . $label . ', ' . $skipped . ' dilewati, ' . $errors . ' error.');
        return $importedReports;
    }

    // -------------------------------------------------------------------------
    // Helper: Patch Firestore langsung (bypass counter logic di repository)
    // -------------------------------------------------------------------------

    /**
     * Menulis dokumen laporan langsung ke Firestore via FirestoreRestClient
     * tanpa memicu logika counter di FirestoreReportRepository::create().
     * Counter akan dikalkulasi ulang secara massal di akhir via recalculate().
     */
    private function patchReportDirectly(array $data): void
    {
        $client = app(\App\Services\Firebase\FirestoreClientInterface::class);
        $docId = $data['id'];

        try {
            $client->createDocument('reports', $docId, $data);
        } catch (\Throwable $e) {
            // Dokumen mungkin sudah ada, coba patch
            $client->patchDocument('reports', $docId, $data);
        }
    }

    // -------------------------------------------------------------------------
    // Helper: Konversi
    // -------------------------------------------------------------------------

    private function toIso(mixed $val): string
    {
        if (!$val) {
            return now()->toISOString();
        }

        try {
            return \Carbon\Carbon::parse($val)->toISOString();
        } catch (\Throwable $e) {
            return now()->toISOString();
        }
    }

    private function parseJson(mixed $val): ?array
    {
        if (!$val) {
            return null;
        }

        if (is_array($val)) {
            return $val;
        }

        try {
            $decoded = json_decode($val, true, 32, JSON_THROW_ON_ERROR);
            return is_array($decoded) ? $decoded : null;
        } catch (\Throwable $e) {
            return null;
        }
    }
}

