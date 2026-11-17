<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    protected CounterRepositoryInterface $counterRepository;

    public function __construct(CounterRepositoryInterface $counterRepository)
    {
        $this->counterRepository = $counterRepository;
    }

    /**
     * GET /api/stats/leaderboard
     * Aggregation for kelurahan ranking
     */
    public function leaderboard(): JsonResponse
    {
        $leaderboard = $this->counterRepository->getLeaderboard();

        return response()->json([
            'leaderboard' => $leaderboard,
        ])->header('Cache-Control', 'public, max-age=20, s-maxage=20');
    }

    /**
     * GET /api/stats/kecamatan-density
     * Aggregate report count + avg urgency per kecamatan (untuk choropleth map)
     */
    public function kecamatanDensity(): JsonResponse
    {
        $data = $this->counterRepository->getKecamatanDensity();

        return response()->json([
            'density' => $data['density'] ?? [],
            'maxTotal' => $data['maxTotal'] ?? 0,
        ])->header('Cache-Control', 'public, max-age=20, s-maxage=20');
    }

    /**
     * GET /api/stats/overview
     */
    public function overview(): JsonResponse
    {
        $stats = $this->counterRepository->getGlobalStats();

        return response()->json([
            'total' => $stats['total'] ?? 0,
            'baru' => $stats['baru'] ?? 0,
            'diproses' => $stats['diproses'] ?? 0,
            'selesai' => $stats['selesai'] ?? 0,
            'highUrgency' => $stats['highUrgency'] ?? 0,
            'byDay' => $stats['byDay'] ?? [],
        ])->header('Cache-Control', 'public, max-age=20, s-maxage=20');
    }
}
