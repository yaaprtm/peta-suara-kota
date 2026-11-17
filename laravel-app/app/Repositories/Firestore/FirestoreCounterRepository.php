<?php

namespace App\Repositories\Firestore;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Services\Firebase\FirestoreClientInterface;
use Carbon\Carbon;

class FirestoreCounterRepository implements CounterRepositoryInterface
{
    private const COLLECTION = 'counters';
    private const DOC_GLOBAL_STATS = 'global_stats';
    private const DOC_LEADERBOARD = 'leaderboard';
    private const DOC_KECAMATAN_DENSITY = 'kecamatan_density';

    protected FirestoreClientInterface $client;
    protected ?KelurahanRepositoryInterface $kelurahanRepository;

    public function __construct(
        FirestoreClientInterface $client,
        ?KelurahanRepositoryInterface $kelurahanRepository = null
    ) {
        $this->client = $client;
        $this->kelurahanRepository = $kelurahanRepository;
    }

    private function defaultByDay(): array
    {
        $byDay = [];
        for ($i = 0; $i < 14; $i++) {
            $byDay[] = [
                'date' => Carbon::today()->subDays(13 - $i)->format('Y-m-d'),
                'count' => 0,
            ];
        }
        return $byDay;
    }

    public function getGlobalStats(): array
    {
        $doc = $this->client->getDocument(self::COLLECTION, self::DOC_GLOBAL_STATS);
        if ($doc) {
            return [
                'total' => (int) ($doc['total'] ?? 0),
                'baru' => (int) ($doc['baru'] ?? 0),
                'diproses' => (int) ($doc['diproses'] ?? 0),
                'selesai' => (int) ($doc['selesai'] ?? 0),
                'highUrgency' => (int) ($doc['highUrgency'] ?? 0),
                'byDay' => $doc['byDay'] ?? $this->defaultByDay(),
            ];
        }

        return [
            'total' => 0,
            'baru' => 0,
            'diproses' => 0,
            'selesai' => 0,
            'highUrgency' => 0,
            'byDay' => $this->defaultByDay(),
        ];
    }

    public function getLeaderboard(): array
    {
        $doc = $this->client->getDocument(self::COLLECTION, self::DOC_LEADERBOARD);
        if ($doc && !empty($doc['items'])) {
            return $doc['items'];
        }

        // Jika dokumen belum terisi, bangun daftar dari kelurahan statis
        $kelurahans = $this->kelurahanRepository ? $this->kelurahanRepository->all() : [];
        $leaderboard = array_map(function ($k) {
            return [
                'kelurahan' => [
                    'id' => $k['id'],
                    'name' => $k['name'],
                    'kecamatan' => $k['kecamatan'],
                    'kota' => $k['kota'] ?? 'Surabaya',
                ],
                'totalReports' => 0,
                'resolvedReports' => 0,
                'resolutionRate' => 0,
                'avgResponseHours' => null,
                'score' => 0,
            ];
        }, $kelurahans);

        return $leaderboard;
    }

    public function getKecamatanDensity(): array
    {
        $doc = $this->client->getDocument(self::COLLECTION, self::DOC_KECAMATAN_DENSITY);
        if ($doc) {
            return [
                'density' => $doc['density'] ?? [],
                'maxTotal' => (int) ($doc['maxTotal'] ?? 0),
            ];
        }

        return [
            'density' => [],
            'maxTotal' => 0,
        ];
    }

    public function incrementReportCreated(array $report): void
    {
        $current = $this->getGlobalStats();
        $current['total']++;

        $statusKey = strtolower($report['status'] ?? 'baru');
        if (isset($current[$statusKey])) {
            $current[$statusKey]++;
        }

        if (($report['skor_urgensi'] ?? 0) >= 70) {
            $current['highUrgency']++;
        }

        $today = Carbon::today()->format('Y-m-d');
        $foundDay = false;
        foreach ($current['byDay'] as &$item) {
            if ($item['date'] === $today) {
                $item['count']++;
                $foundDay = true;
                break;
            }
        }
        unset($item);

        if (!$foundDay) {
            $current['byDay'][] = ['date' => $today, 'count' => 1];
            if (count($current['byDay']) > 14) {
                array_shift($current['byDay']);
            }
        }

        try {
            $this->client->patchDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $current);
        } catch (\Throwable $e) {
            $this->client->createDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $current);
        }

        // Update kepadatan kecamatan
        $kec = trim($report['kecamatan'] ?? '');
        if ($kec !== '') {
            $densityData = $this->getKecamatanDensity();
            $items = $densityData['density'];
            $key = strtolower($kec);
            $foundKec = false;
            $urgensi = (float) ($report['skor_urgensi'] ?? 0);

            foreach ($items as &$item) {
                if (strtolower($item['kecamatan']) === $key) {
                    $oldTotal = $item['total'];
                    $newTotal = $oldTotal + 1;
                    $item['total'] = $newTotal;
                    $item['avgUrgensi'] = round((($item['avgUrgensi'] * $oldTotal) + $urgensi) / $newTotal, 1);
                    $foundKec = true;
                    break;
                }
            }
            unset($item);

            if (!$foundKec) {
                $items[] = [
                    'kecamatan' => $kec,
                    'total' => 1,
                    'avgUrgensi' => $urgensi,
                ];
            }

            usort($items, fn($a, $b) => $b['total'] <=> $a['total']);
            $maxTotal = count($items) > 0 ? max(array_column($items, 'total')) : 0;

            $payload = ['density' => $items, 'maxTotal' => $maxTotal];
            try {
                $this->client->patchDocument(self::COLLECTION, self::DOC_KECAMATAN_DENSITY, $payload);
            } catch (\Throwable $e) {
                $this->client->createDocument(self::COLLECTION, self::DOC_KECAMATAN_DENSITY, $payload);
            }
        }
    }

    public function updateReportStatus(string $oldStatus, string $newStatus, array $report): void
    {
        $current = $this->getGlobalStats();
        $oldKey = strtolower($oldStatus);
        $newKey = strtolower($newStatus);

        if (isset($current[$oldKey]) && $current[$oldKey] > 0) {
            $current[$oldKey]--;
        }
        if (isset($current[$newKey])) {
            $current[$newKey]++;
        }

        try {
            $this->client->patchDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $current);
        } catch (\Throwable $e) {
            $this->client->createDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $current);
        }

        // Update leaderboard jika kelurahan tersedia
        $kid = (string) ($report['kelurahan_id'] ?? '');
        if ($kid !== '') {
            $leaderboard = $this->getLeaderboard();
            foreach ($leaderboard as &$row) {
                if ((string) ($row['kelurahan']['id'] ?? '') === $kid) {
                    if ($newStatus === 'SELESAI' && $oldStatus !== 'SELESAI') {
                        $row['resolvedReports']++;
                    } elseif ($oldStatus === 'SELESAI' && $newStatus !== 'SELESAI') {
                        $row['resolvedReports'] = max(0, $row['resolvedReports'] - 1);
                    }

                    $total = $row['totalReports'];
                    $resolved = $row['resolvedReports'];
                    $ratio = $total > 0 ? $resolved / $total : 0;
                    $row['resolutionRate'] = (int) round($ratio * 100);
                    $row['score'] = (int) round($ratio * 100);
                    break;
                }
            }
            unset($row);

            usort($leaderboard, fn($a, $b) => $b['score'] <=> $a['score']);
            try {
                $this->client->patchDocument(self::COLLECTION, self::DOC_LEADERBOARD, ['items' => $leaderboard]);
            } catch (\Throwable $e) {
                $this->client->createDocument(self::COLLECTION, self::DOC_LEADERBOARD, ['items' => $leaderboard]);
            }
        }
    }

    public function recalculate(array $reports): void
    {
        $globalStats = [
            'total' => count($reports),
            'baru' => 0,
            'diproses' => 0,
            'selesai' => 0,
            'highUrgency' => 0,
            'byDay' => $this->defaultByDay(),
        ];

        $kelStats = [];
        $kecStats = [];

        foreach ($reports as $r) {
            $status = strtoupper($r['status'] ?? 'BARU');
            $sKey = strtolower($status);
            if (isset($globalStats[$sKey])) {
                $globalStats[$sKey]++;
            }

            $urgensi = (float) ($r['skor_urgensi'] ?? 0);
            if ($urgensi >= 70) {
                $globalStats['highUrgency']++;
            }

            $createdAt = isset($r['created_at']) ? Carbon::parse($r['created_at'])->format('Y-m-d') : null;
            if ($createdAt) {
                foreach ($globalStats['byDay'] as &$item) {
                    if ($item['date'] === $createdAt) {
                        $item['count']++;
                        break;
                    }
                }
                unset($item);
            }

            // Kelurahan
            $kid = (string) ($r['kelurahan_id'] ?? '');
            if ($kid !== '') {
                if (!isset($kelStats[$kid])) {
                    $kelStats[$kid] = ['total' => 0, 'resolved' => 0];
                }
                $kelStats[$kid]['total']++;
                if ($status === 'SELESAI') {
                    $kelStats[$kid]['resolved']++;
                }
            }

            // Kecamatan
            $kec = trim($r['kecamatan'] ?? '');
            if ($kec !== '') {
                $key = strtolower($kec);
                if (isset($kecStats[$key])) {
                    $oldTotal = $kecStats[$key]['total'];
                    $newTotal = $oldTotal + 1;
                    $kecStats[$key]['total'] = $newTotal;
                    $kecStats[$key]['avgUrgensi'] = round((($kecStats[$key]['avgUrgensi'] * $oldTotal) + $urgensi) / $newTotal, 1);
                } else {
                    $kecStats[$key] = [
                        'kecamatan' => $kec,
                        'total' => 1,
                        'avgUrgensi' => $urgensi,
                    ];
                }
            }
        }

        // Leaderboard
        $kelurahans = $this->kelurahanRepository ? $this->kelurahanRepository->all() : [];
        $leaderboard = [];
        foreach ($kelurahans as $k) {
            $kid = (string) $k['id'];
            $st = $kelStats[$kid] ?? ['total' => 0, 'resolved' => 0];
            $tot = $st['total'];
            $res = $st['resolved'];
            $rate = $tot > 0 ? (int) round(($res / $tot) * 100) : 0;

            $leaderboard[] = [
                'kelurahan' => [
                    'id' => $k['id'],
                    'name' => $k['name'],
                    'kecamatan' => $k['kecamatan'],
                    'kota' => $k['kota'] ?? 'Surabaya',
                ],
                'totalReports' => $tot,
                'resolvedReports' => $res,
                'resolutionRate' => $rate,
                'avgResponseHours' => null,
                'score' => $rate,
            ];
        }
        usort($leaderboard, fn($a, $b) => $b['score'] <=> $a['score']);

        // Density
        $density = array_values($kecStats);
        usort($density, fn($a, $b) => $b['total'] <=> $a['total']);
        $maxTotal = count($density) > 0 ? max(array_column($density, 'total')) : 0;

        // Commit dokumen counter
        try {
            $this->client->createDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $globalStats);
        } catch (\Throwable $e) {
            $this->client->patchDocument(self::COLLECTION, self::DOC_GLOBAL_STATS, $globalStats);
        }

        try {
            $this->client->createDocument(self::COLLECTION, self::DOC_LEADERBOARD, ['items' => $leaderboard]);
        } catch (\Throwable $e) {
            $this->client->patchDocument(self::COLLECTION, self::DOC_LEADERBOARD, ['items' => $leaderboard]);
        }

        try {
            $this->client->createDocument(self::COLLECTION, self::DOC_KECAMATAN_DENSITY, ['density' => $density, 'maxTotal' => $maxTotal]);
        } catch (\Throwable $e) {
            $this->client->patchDocument(self::COLLECTION, self::DOC_KECAMATAN_DENSITY, ['density' => $density, 'maxTotal' => $maxTotal]);
        }
    }
}
