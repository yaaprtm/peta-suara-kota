<?php

namespace App\Repositories\InMemory;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use Carbon\Carbon;

class InMemoryCounterRepository implements CounterRepositoryInterface
{
    protected array $globalStats = [
        'total' => 0,
        'baru' => 0,
        'diproses' => 0,
        'selesai' => 0,
        'highUrgency' => 0,
        'byDay' => [],
    ];

    /**
     * @var array<string, array> Keyed by kelurahan_id or slug
     */
    protected array $kelurahanStats = [];

    /**
     * @var array<string, array> Keyed by kecamatan name lowercase
     */
    protected array $kecamatanStats = [];

    protected ?KelurahanRepositoryInterface $kelurahanRepository;

    public function __construct(?KelurahanRepositoryInterface $kelurahanRepository = null)
    {
        $this->kelurahanRepository = $kelurahanRepository;
        $this->initDefaultByDay();
    }

    private function initDefaultByDay(): void
    {
        $byDay = [];
        for ($i = 0; $i < 14; $i++) {
            $byDay[] = [
                'date' => Carbon::today()->subDays(13 - $i)->format('Y-m-d'),
                'count' => 0,
            ];
        }
        $this->globalStats['byDay'] = $byDay;
    }

    public function getGlobalStats(): array
    {
        return $this->globalStats;
    }

    public function getLeaderboard(): array
    {
        $kelurahans = $this->kelurahanRepository ? $this->kelurahanRepository->all() : [];
        $leaderboard = [];

        foreach ($kelurahans as $k) {
            $kid = (string) $k['id'];
            $stats = $this->kelurahanStats[$kid] ?? [
                'totalReports' => 0,
                'resolvedReports' => 0,
                'totalResponseSeconds' => 0,
                'responseCount' => 0,
            ];

            $totalReports = $stats['totalReports'];
            $resolvedReports = $stats['resolvedReports'];
            $avgResponseHours = $stats['responseCount'] > 0
                ? ($stats['totalResponseSeconds'] / $stats['responseCount']) / 3600
                : null;
            $resolutionRatio = $totalReports > 0 ? $resolvedReports / $totalReports : 0;
            $resolutionRate = (int) round($resolutionRatio * 100);

            $score = 0;
            if ($totalReports > 0) {
                $scorePart1 = $resolutionRatio * 50;
                $scorePart2 = $avgResponseHours !== null
                    ? max(0, 50 - min(50, $avgResponseHours / 2))
                    : 0;
                $score = (int) round($scorePart1 + $scorePart2);
            }

            $leaderboard[] = [
                'kelurahan' => [
                    'id' => $k['id'],
                    'name' => $k['name'],
                    'kecamatan' => $k['kecamatan'],
                    'kota' => $k['kota'] ?? 'Surabaya',
                ],
                'totalReports' => $totalReports,
                'resolvedReports' => $resolvedReports,
                'resolutionRate' => $resolutionRate,
                'avgResponseHours' => $avgResponseHours !== null ? round($avgResponseHours, 1) : null,
                'score' => $score,
            ];
        }

        usort($leaderboard, fn($a, $b) => $b['score'] <=> $a['score']);
        return $leaderboard;
    }

    public function getKecamatanDensity(): array
    {
        $result = array_values($this->kecamatanStats);
        usort($result, fn($a, $b) => $b['total'] <=> $a['total']);

        return [
            'density' => $result,
            'maxTotal' => count($result) > 0 ? max(array_column($result, 'total')) : 0,
        ];
    }

    public function incrementReportCreated(array $report): void
    {
        $this->globalStats['total']++;
        $statusKey = strtolower($report['status'] ?? 'baru');
        if (isset($this->globalStats[$statusKey])) {
            $this->globalStats[$statusKey]++;
        }

        if (($report['skor_urgensi'] ?? 0) >= 70) {
            $this->globalStats['highUrgency']++;
        }

        // byDay update
        $today = Carbon::today()->format('Y-m-d');
        foreach ($this->globalStats['byDay'] as &$item) {
            if ($item['date'] === $today) {
                $item['count']++;
                break;
            }
        }
        unset($item);

        // kelurahan update
        $kid = (string) ($report['kelurahan_id'] ?? '');
        if ($kid !== '') {
            if (!isset($this->kelurahanStats[$kid])) {
                $this->kelurahanStats[$kid] = [
                    'totalReports' => 0,
                    'resolvedReports' => 0,
                    'totalResponseSeconds' => 0,
                    'responseCount' => 0,
                ];
            }
            $this->kelurahanStats[$kid]['totalReports']++;
            if (($report['status'] ?? '') === 'SELESAI') {
                $this->kelurahanStats[$kid]['resolvedReports']++;
            }
        }

        // kecamatan density update
        $kec = trim($report['kecamatan'] ?? '');
        if ($kec !== '') {
            $key = strtolower($kec);
            $urgensi = (float) ($report['skor_urgensi'] ?? 0);
            if (isset($this->kecamatanStats[$key])) {
                $oldTotal = $this->kecamatanStats[$key]['total'];
                $newTotal = $oldTotal + 1;
                $this->kecamatanStats[$key]['total'] = $newTotal;
                $this->kecamatanStats[$key]['avgUrgensi'] = round(
                    (($this->kecamatanStats[$key]['avgUrgensi'] * $oldTotal) + $urgensi) / $newTotal,
                    1
                );
            } else {
                $this->kecamatanStats[$key] = [
                    'kecamatan' => $kec,
                    'total' => 1,
                    'avgUrgensi' => $urgensi,
                ];
            }
        }
    }

    public function updateReportStatus(string $oldStatus, string $newStatus, array $report): void
    {
        $oldKey = strtolower($oldStatus);
        $newKey = strtolower($newStatus);

        if (isset($this->globalStats[$oldKey]) && $this->globalStats[$oldKey] > 0) {
            $this->globalStats[$oldKey]--;
        }
        if (isset($this->globalStats[$newKey])) {
            $this->globalStats[$newKey]++;
        }

        $kid = (string) ($report['kelurahan_id'] ?? '');
        if ($kid !== '' && isset($this->kelurahanStats[$kid])) {
            if ($newStatus === 'SELESAI' && $oldStatus !== 'SELESAI') {
                $this->kelurahanStats[$kid]['resolvedReports']++;
            } elseif ($oldStatus === 'SELESAI' && $newStatus !== 'SELESAI') {
                $this->kelurahanStats[$kid]['resolvedReports'] = max(0, $this->kelurahanStats[$kid]['resolvedReports'] - 1);
            }
        }
    }

    public function recalculate(array $reports): void
    {
        $this->globalStats = [
            'total' => count($reports),
            'baru' => 0,
            'diproses' => 0,
            'selesai' => 0,
            'highUrgency' => 0,
            'byDay' => [],
        ];
        $this->initDefaultByDay();
        $this->kelurahanStats = [];
        $this->kecamatanStats = [];

        foreach ($reports as $r) {
            $status = strtoupper($r['status'] ?? 'BARU');
            $statusKey = strtolower($status);
            if (isset($this->globalStats[$statusKey])) {
                $this->globalStats[$statusKey]++;
            }

            $urgensi = (float) ($r['skor_urgensi'] ?? 0);
            if ($urgensi >= 70) {
                $this->globalStats['highUrgency']++;
            }

            // byDay
            $createdAt = isset($r['created_at']) ? Carbon::parse($r['created_at'])->format('Y-m-d') : null;
            if ($createdAt) {
                foreach ($this->globalStats['byDay'] as &$item) {
                    if ($item['date'] === $createdAt) {
                        $item['count']++;
                        break;
                    }
                }
                unset($item);
            }

            // kelurahan
            $kid = (string) ($r['kelurahan_id'] ?? '');
            if ($kid !== '') {
                if (!isset($this->kelurahanStats[$kid])) {
                    $this->kelurahanStats[$kid] = [
                        'totalReports' => 0,
                        'resolvedReports' => 0,
                        'totalResponseSeconds' => 0,
                        'responseCount' => 0,
                    ];
                }
                $this->kelurahanStats[$kid]['totalReports']++;
                if ($status === 'SELESAI') {
                    $this->kelurahanStats[$kid]['resolvedReports']++;
                }
            }

            // kecamatan
            $kec = trim($r['kecamatan'] ?? '');
            if ($kec !== '') {
                $key = strtolower($kec);
                if (isset($this->kecamatanStats[$key])) {
                    $oldTotal = $this->kecamatanStats[$key]['total'];
                    $newTotal = $oldTotal + 1;
                    $this->kecamatanStats[$key]['total'] = $newTotal;
                    $this->kecamatanStats[$key]['avgUrgensi'] = round(
                        (($this->kecamatanStats[$key]['avgUrgensi'] * $oldTotal) + $urgensi) / $newTotal,
                        1
                    );
                } else {
                    $this->kecamatanStats[$key] = [
                        'kecamatan' => $kec,
                        'total' => 1,
                        'avgUrgensi' => $urgensi,
                    ];
                }
            }
        }
    }
}

