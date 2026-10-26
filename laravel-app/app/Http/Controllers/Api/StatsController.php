<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelurahan;
use App\Models\Report;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * GET /api/stats/leaderboard
     * Aggregation for kelurahan ranking
     */
    public function leaderboard(): JsonResponse
    {
        $kelurahans = Kelurahan::with(['reports.statusLogs' => fn($q) => $q->orderBy('changed_at', 'asc')])->get();

        $leaderboard = $kelurahans->map(function ($k) {
            $reports = $k->reports;
            $totalReports = $reports->count();
            $resolvedReports = $reports->where('status', 'SELESAI')->count();

            $totalResponseSeconds = 0;
            $responseCount = 0;

            foreach ($reports as $report) {
                $baru = $report->statusLogs->firstWhere('to_status', 'BARU');
                $diproses = $report->statusLogs->firstWhere('to_status', 'DIPROSES');

                if ($baru && $diproses && $baru->changed_at && $diproses->changed_at) {
                    $diff = $diproses->changed_at->diffInSeconds($baru->changed_at);
                    $totalResponseSeconds += abs($diff);
                    $responseCount++;
                }
            }

            $avgResponseHours = $responseCount > 0 ? ($totalResponseSeconds / $responseCount) / 3600 : null;
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

            return [
                'kelurahan' => [
                    'id' => $k->id,
                    'name' => $k->name,
                    'kecamatan' => $k->kecamatan,
                    'kota' => $k->kota,
                ],
                'totalReports' => $totalReports,
                'resolvedReports' => $resolvedReports,
                'resolutionRate' => $resolutionRate,
                'avgResponseHours' => $avgResponseHours !== null ? round($avgResponseHours, 1) : null,
                'score' => $score,
            ];
        })->sortByDesc('score')->values();

        return response()->json([
            'leaderboard' => $leaderboard,
        ]);
    }

    /**
     * GET /api/stats/overview
     */
    public function overview(): JsonResponse
    {
        $total = Report::count();
        $baru = Report::where('status', 'BARU')->count();
        $diproses = Report::where('status', 'DIPROSES')->count();
        $selesai = Report::where('status', 'SELESAI')->count();
        $highUrgency = Report::where('skor_urgensi', '>=', 70)->count();

        // Activity for the last 14 days
        $startDate = Carbon::today()->subDays(13);
        $recentReports = Report::where('created_at', '>=', $startDate)->get(['created_at']);

        $byDayMap = [];
        for ($i = 0; $i < 14; $i++) {
            $d = Carbon::today()->subDays(13 - $i)->format('Y-m-d');
            $byDayMap[$d] = 0;
        }

        foreach ($recentReports as $r) {
            $dateKey = $r->created_at->format('Y-m-d');
            if (isset($byDayMap[$dateKey])) {
                $byDayMap[$dateKey]++;
            }
        }

        $byDay = [];
        foreach ($byDayMap as $date => $count) {
            $byDay[] = [
                'date' => $date,
                'count' => $count,
            ];
        }

        return response()->json([
            'total' => $total,
            'baru' => $baru,
            'diproses' => $diproses,
            'selesai' => $selesai,
            'highUrgency' => $highUrgency,
            'byDay' => $byDay,
        ]);
    }
}
