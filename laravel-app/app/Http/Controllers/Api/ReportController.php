<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Http\Resources\ReportResource;
use App\Models\Category;
use App\Models\Report;
use App\Models\StatusLog;
use App\Services\KecamatanService;
use App\Services\UrgencyScorer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * GET /api/reports/viewport
     */
    public function viewport(Request $request): JsonResponse
    {
        $query = Report::query()->with([
            'user' => fn($q) => $q->select(['id', 'name', 'avatar']),
            'kelurahan' => fn($q) => $q->select(['id', 'name', 'kecamatan']),
        ]);

        // 1. Bounding box filter [minLng, minLat, maxLng, maxLat]
        if ($bbox = $request->query('bbox')) {
            $parts = array_map('floatval', explode(',', $bbox));
            if (count($parts) === 4) {
                [$minLng, $minLat, $maxLng, $maxLat] = $parts;
                $query->whereBetween('latitude', [min($minLat, $maxLat), max($minLat, $maxLat)])
                      ->whereBetween('longitude', [min($minLng, $maxLng), max($minLng, $maxLng)]);
            }
        }

        // 2. Date filters
        if ($startDate = $request->query('startDate')) {
            $query->where('created_at', '>=', Carbon::parse($startDate));
        }
        if ($endDate = $request->query('endDate')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        // 3. Category & Status
        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // 4. Kecamatan
        if ($kecamatan = $request->query('kecamatan')) {
            $query->where(function ($q) use ($kecamatan) {
                $q->where('kecamatan', $kecamatan)
                  ->orWhereHas('kelurahan', fn($k) => $k->where('kecamatan', $kecamatan));
            });
        }

        // Limit up to 500
        $limit = min((int) ($request->query('limit') ?: 300), 500);

        $reports = $query->orderByDesc('skor_urgensi')
                         ->orderByDesc('created_at')
                         ->limit($limit)
                         ->get();

        $zoom = $request->query('zoom');

        return response()->json([
            'reports' => ReportResource::collection($reports),
            'count' => $reports->count(),
            'zoom' => $zoom !== null ? (float) $zoom : null,
        ]);
    }

    /**
     * GET /api/reports
     */
    public function index(Request $request): JsonResponse
    {
        $query = Report::query()->with([
            'user' => fn($q) => $q->select(['id', 'name', 'avatar']),
            'kelurahan' => fn($q) => $q->select(['id', 'name', 'kecamatan']),
        ]);

        if ($startDate = $request->query('startDate')) {
            $query->where('created_at', '>=', Carbon::parse($startDate));
        }
        if ($endDate = $request->query('endDate')) {
            $query->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
        }

        if ($category = $request->query('category')) {
            $query->where('category', $category);
        }
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($kelurahanId = $request->query('kelurahanId')) {
            $query->where('kelurahan_id', $kelurahanId);
        }
        if ($kecamatan = $request->query('kecamatan')) {
            $query->where(function ($q) use ($kecamatan) {
                $q->where('kecamatan', $kecamatan)
                  ->orWhereHas('kelurahan', fn($k) => $k->where('kecamatan', $kecamatan));
            });
        }

        if ($minScore = $request->query('minScore')) {
            $query->where('skor_urgensi', '>=', (int) $minScore);
        }
        if ($maxScore = $request->query('maxScore')) {
            $query->where('skor_urgensi', '<=', (int) $maxScore);
        }

        $limit = min((int) ($request->query('limit') ?: 100), 100);
        $page = (int) ($request->query('page') ?: 1);

        $paginator = $query->orderByDesc('created_at')->paginate($limit, ['*'], 'page', $page);

        return response()->json([
            'reports' => ReportResource::collection($paginator->items()),
            'pagination' => [
                'total' => $paginator->total(),
                'page' => $paginator->currentPage(),
                'limit' => $paginator->perPage(),
                'pages' => $paginator->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/reports/{id}
     */
    public function show(string $id): JsonResponse
    {
        $report = Report::with([
            'user' => fn($q) => $q->select(['id', 'name', 'avatar']),
            'kelurahan',
            'statusLogs.changedBy' => fn($q) => $q->select(['id', 'name', 'role']),
            'categoryRef',
        ])->find($id);

        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        return response()->json([
            'report' => new ReportResource($report),
        ]);
    }

    /**
     * POST /api/reports
     */
    public function store(StoreReportRequest $request): JsonResponse
    {
        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;

        // Validasi batasan Surabaya
        $detectedKecamatan = KecamatanService::determineKecamatan($lng, $lat);
        if (!$detectedKecamatan) {
            return response()->json([
                'message' => 'Koordinat lokasi laporan berada di luar cakupan wilayah Surabaya. Silakan pilih titik lokasi di dalam area Surabaya.',
            ], 400);
        }

        // Upload media files
        $photoPaths = [];
        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $file) {
                $path = $file->store('photos', 'public');
                $photoPaths[] = $path;
            }
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            $audioPath = $request->file('audio')->store('audio', 'public');
        }

        // Urgency scoring
        $textToAnalyze = trim($request->title . ' ' . $request->description . ' ' . ($request->audioTranscript ?? ''));
        $urgency = UrgencyScorer::analyzeUrgency($textToAnalyze, $request->category);

        $categoryRef = Category::where('type', $request->category)->first();

        $report = Report::create([
            'title' => $request->title,
            'description' => $request->description,
            'category' => $request->category,
            'status' => 'BARU',
            'latitude' => $lat,
            'longitude' => $lng,
            'address' => $request->address,
            'kelurahan_id' => $request->kelurahanId,
            'kecamatan' => $detectedKecamatan,
            'skor_urgensi' => $urgency['skorUrgensi'],
            'urgensi_keywords' => $urgency['urgensiKeywords'],
            'photos' => $photoPaths,
            'audio_url' => $audioPath,
            'audio_transcript' => $request->audioTranscript,
            'user_id' => $request->user()->id,
            'category_id' => $categoryRef?->id,
        ]);

        // Status log awal
        StatusLog::create([
            'report_id' => $report->id,
            'from_status' => null,
            'to_status' => 'BARU',
            'note' => 'Laporan diterima oleh sistem',
            'changed_by_id' => $request->user()->id,
            'changed_at' => now(),
        ]);

        $report->load(['user', 'kelurahan']);

        return response()->json([
            'message' => 'Laporan berhasil dibuat',
            'report' => new ReportResource($report),
        ], 201);
    }

    /**
     * PATCH /api/reports/{id}/status
     */
    public function updateStatus(UpdateReportStatusRequest $request, string $id): JsonResponse
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $oldStatus = $report->status;
        $newStatus = $request->status;

        $report->update(['status' => $newStatus]);

        StatusLog::create([
            'report_id' => $report->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'note' => $request->note,
            'changed_by_id' => $request->user()->id,
            'changed_at' => now(),
        ]);

        $report->load(['user', 'kelurahan']);

        return response()->json([
            'message' => 'Status berhasil diperbarui',
            'report' => new ReportResource($report),
        ]);
    }

    /**
     * DELETE /api/reports/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Only owner or admin can delete
        if ($report->user_id !== $user->id && !in_array($user->role, ['ADMIN', 'SUPERADMIN'])) {
            return response()->json(['message' => 'Tidak memiliki akses'], 403);
        }

        $report->delete();

        return response()->json(['message' => 'Laporan berhasil dihapus']);
    }

    /**
     * GET /api/reports/stream
     * Server-Sent Events (SSE) stream
     */
    public function stream(): StreamedResponse
    {
        return response()->stream(function () {
            echo "retry: 5000\n\n";
            ob_flush();
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'Connection' => 'keep-alive',
            'X-Accel-Buffering' => 'no',
        ]);
    }
}
