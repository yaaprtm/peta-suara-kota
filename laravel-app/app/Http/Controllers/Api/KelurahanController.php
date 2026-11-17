<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class KelurahanController extends Controller
{
    protected KelurahanRepositoryInterface $kelurahanRepository;
    protected CounterRepositoryInterface $counterRepository;

    public function __construct(
        KelurahanRepositoryInterface $kelurahanRepository,
        CounterRepositoryInterface $counterRepository
    ) {
        $this->kelurahanRepository = $kelurahanRepository;
        $this->counterRepository = $counterRepository;
    }

    /**
     * GET /api/kelurahans
     */
    public function index(): JsonResponse
    {
        // Ambil data laporan per kelurahan dari counter leaderboard (1 read dokumen atau in-memory)
        $leaderboard = $this->counterRepository->getLeaderboard();
        $counts = [];
        foreach ($leaderboard as $item) {
            $kid = (string) ($item['kelurahan']['id'] ?? '');
            if ($kid !== '') {
                $counts[$kid] = (int) ($item['totalReports'] ?? 0);
            }
        }

        $all = $this->kelurahanRepository->allWithReportCounts($counts);

        usort($all, function ($a, $b) {
            $cmpKec = strcmp($a['kecamatan'], $b['kecamatan']);
            if ($cmpKec !== 0) return $cmpKec;
            return strcmp($a['name'], $b['name']);
        });

        $kelurahans = array_map(function ($k) {
            return [
                'id' => (string) $k['id'],
                'name' => $k['name'],
                'kecamatan' => $k['kecamatan'],
                'kota' => $k['kota'] ?? 'Surabaya',
                'centroidLat' => (float) ($k['centroid_lat'] ?? $k['centroidLat'] ?? 0),
                'centroidLng' => (float) ($k['centroid_lng'] ?? $k['centroidLng'] ?? 0),
                '_count' => [
                    'reports' => (int) ($k['reports_count'] ?? 0),
                ],
            ];
        }, $all);

        return response()->json([
            'kelurahans' => $kelurahans,
        ])->header('Cache-Control', 'public, max-age=60, s-maxage=60');
    }

    /**
     * GET /api/kelurahans/{id}
     */
    public function show(string $id): JsonResponse
    {
        $k = $this->kelurahanRepository->findById($id);

        if (!$k) {
            return response()->json(['message' => 'Kelurahan tidak ditemukan'], 404);
        }

        $leaderboard = $this->counterRepository->getLeaderboard();
        $reportCount = 0;
        foreach ($leaderboard as $item) {
            if ((string) ($item['kelurahan']['id'] ?? '') === (string) $id) {
                $reportCount = (int) ($item['totalReports'] ?? 0);
                break;
            }
        }

        return response()->json([
            'kelurahan' => [
                'id' => (string) $k['id'],
                'name' => $k['name'],
                'kecamatan' => $k['kecamatan'],
                'kota' => $k['kota'] ?? 'Surabaya',
                'centroidLat' => (float) ($k['centroid_lat'] ?? $k['centroidLat'] ?? 0),
                'centroidLng' => (float) ($k['centroid_lng'] ?? $k['centroidLng'] ?? 0),
                '_count' => [
                    'reports' => $reportCount,
                ],
            ],
        ]);
    }

    /**
     * GET /api/kelurahans/geo/bounds
     */
    public function geoBounds(): JsonResponse
    {
        return response()->json([
            'bounds' => [
                'minLat' => -7.3500,
                'maxLat' => -7.1500,
                'minLng' => 112.6000,
                'maxLng' => 112.8500,
            ],
            'center' => [
                'lat' => -7.2575,
                'lng' => 112.7521,
            ],
        ]);
    }
}
