<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Http\Resources\ReportResource;
use App\Models\Category;
use App\Models\Report;
use App\Models\StatusLog;
use App\Services\GeofenceValidator;
use App\Services\KecamatanService;
use App\Services\StatusWorkflowManager;
use App\Services\StorageService;
use App\Services\UrgencyScorer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    /**
     * GET /api/reports/nearby?lat=&lng=&radius=&limit=
     * Cari laporan terdekat dari koordinat tertentu menggunakan Haversine formula.
     * Digunakan oleh fitur "Terdekat dari Saya" untuk petugas.
     */
    public function nearby(Request $request): JsonResponse
    {
        $lat    = (float) $request->query('lat', 0);
        $lng    = (float) $request->query('lng', 0);
        $radius = min((float) ($request->query('radius', 2)), 10); // max 10 km
        $limit  = min((int) ($request->query('limit', 20)), 50);

        if ($lat === 0.0 && $lng === 0.0) {
            return response()->json(['message' => 'Parameter lat dan lng wajib diisi.'], 400);
        }

        // Pre-filter bounding box ≈ radius/111 derajat (1 derajat ≈ 111 km)
        $delta = $radius / 111.0;

        $reports = Report::with([
            'user'     => fn($q) => $q->select(['id', 'name', 'avatar']),
            'kelurahan'=> fn($q) => $q->select(['id', 'name', 'kecamatan']),
        ])
        ->whereBetween('latitude',  [$lat - $delta, $lat + $delta])
        ->whereBetween('longitude', [$lng - $delta, $lng + $delta])
        ->whereNotIn('status', ['SELESAI', 'DITOLAK']) // hanya laporan aktif
        ->get();

        // Hitung jarak Haversine di PHP, filter tepat, urutkan terdekat
        $withDistance = $reports->map(function ($r) use ($lat, $lng) {
            $r->distance_km = self::haversineKm($lat, $lng, (float)$r->latitude, (float)$r->longitude);
            return $r;
        })
        ->filter(fn($r) => $r->distance_km <= $radius + 0.01)
        ->sortBy('distance_km')
        ->take($limit)
        ->values();

        $data = $withDistance->map(function ($r) {
            $resource = (new ReportResource($r))->resolve();
            $resource['distanceKm'] = round($r->distance_km, 3);
            return $resource;
        });

        return response()->json([
            'reports'    => $data,
            'count'      => $data->count(),
            'centerLat'  => $lat,
            'centerLng'  => $lng,
            'radiusKm'   => $radius,
        ]);
    }

    /**
     * Haversine formula — jarak antara dua koordinat dalam kilometer.
     */
    private static function haversineKm(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R  = 6371.0; // Radius bumi dalam km
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a  = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        $c  = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $R * $c;
    }

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

        // Validate coordinates using GeofenceValidator
        $validation = GeofenceValidator::validate($lat, $lng);
        if (!$validation['valid']) {
            return response()->json([
                'message' => $validation['message'],
            ], 400);
        }

        $detectedKecamatan = $validation['kecamatan'];

        // Upload media files — tangkap error agar laporan tetap bisa disimpan tanpa foto
        $photoPaths = [];
        if ($request->hasFile('photos')) {
            try {
                $photoPaths = StorageService::storeFiles(
                    $request->file('photos'),
                    'photos',
                    'public'
                );
            } catch (\Throwable $e) {
                // Log error tapi lanjutkan tanpa foto
                \Log::warning('Photo upload failed: ' . $e->getMessage());
            }
        }

        $audioPath = null;
        if ($request->hasFile('audio')) {
            try {
                $audioPath = StorageService::storeFile(
                    $request->file('audio'),
                    'audio',
                    'public'
                );
            } catch (\Throwable $e) {
                \Log::warning('Audio upload failed: ' . $e->getMessage());
            }
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
    /**
     * GET /api/reports/{id}/status/transitions
     * 
     * Get valid next status transitions for a report
     */
    public function getValidTransitions(string $id): JsonResponse
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $validNextStatuses = StatusWorkflowManager::getValidNextStatuses($report->status);

        $transitions = array_map(function ($status) {
            return [
                'status' => $status,
                'label' => StatusWorkflowManager::getStatusLabel($status),
                'color' => StatusWorkflowManager::getStatusColor($status),
                'requiresNote' => StatusWorkflowManager::requiresCompletionNote($status),
            ];
        }, $validNextStatuses);

        return response()->json([
            'currentStatus' => $report->status,
            'validTransitions' => array_values($transitions),
        ]);
    }

    /**
     * PATCH /api/reports/{id}/status
     * 
     * Update report status (PETUGAS, ADMIN, SUPERADMIN only)
     */
    public function updateStatus(UpdateReportStatusRequest $request, string $id): JsonResponse
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $oldStatus = $report->status;
        $newStatus = $request->status;

        // Validate status transition
        $transitionValidation = StatusWorkflowManager::validateTransition($oldStatus, $newStatus);
        if (!$transitionValidation['valid']) {
            return response()->json([
                'message' => $transitionValidation['message'],
            ], 400);
        }

        // Check if completion note is required
        if (StatusWorkflowManager::requiresCompletionNote($newStatus)) {
            $note = $request->completion_note ?? $request->note;
            if (empty($note)) {
                return response()->json([
                    'message' => "Catatan penyelesaian wajib diisi untuk status '{$newStatus}'.",
                ], 400);
            }
        }

        $updateData = ['status' => $newStatus];

        // Handle SELESAI status
        if ($newStatus === 'SELESAI') {
            $updateData['resolved_at'] = now();
            if ($request->filled('completion_note')) {
                $updateData['completion_note'] = $request->completion_note;
            } elseif ($request->filled('note')) {
                $updateData['completion_note'] = $request->note;
            }

            $compPhotos = $report->completion_photos ?? [];
            if ($request->hasFile('completion_photos')) {
                $newPhotos = StorageService::storeFiles(
                    $request->file('completion_photos'),
                    'photos',
                    'public'
                );
                $compPhotos = array_merge($compPhotos, $newPhotos);
            } elseif ($request->filled('completion_photos')) {
                $raw = $request->input('completion_photos');
                if (is_array($raw)) {
                    $compPhotos = array_values(array_unique(array_merge($compPhotos, $raw)));
                } elseif (is_string($raw)) {
                    $compPhotos[] = $raw;
                }
            }

            if (!empty($compPhotos)) {
                $updateData['completion_photos'] = $compPhotos;
            }
        }

        // Handle DITOLAK status
        if ($newStatus === 'DITOLAK') {
            if ($request->filled('completion_note')) {
                $updateData['completion_note'] = $request->completion_note;
            } elseif ($request->filled('note')) {
                $updateData['completion_note'] = $request->note;
            }
        }

        // Clear resolved_at if reverting from SELESAI
        if ($oldStatus === 'SELESAI' && $newStatus !== 'SELESAI') {
            $updateData['resolved_at'] = null;
        }

        $report->update($updateData);

        // Create status log entry
        StatusLog::create([
            'report_id' => $report->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'note' => $request->note ?? $request->completion_note,
            'changed_by_id' => $request->user()->id,
            'changed_at' => now(),
        ]);

        $report->load(['user', 'kelurahan', 'statusLogs.changedBy', 'categoryRef']);

        return response()->json([
            'message' => 'Status berhasil diperbarui',
            'report' => new ReportResource($report),
        ]);
    }

    /**
     * POST /api/reports/{id}/upvote
     * Citizen upvote / support count
     */
    public function upvote(Request $request, string $id): JsonResponse
    {
        $report = Report::find($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $report->increment('upvotes_count');

        return response()->json([
            'message' => 'Dukungan berhasil ditambahkan',
            'upvotesCount' => $report->upvotes_count,
            'report' => new ReportResource($report),
        ]);
    }

    /**
     * GET /api/reports/track/{code}
     * Quick public ticket search
     */
    public function track(string $code): JsonResponse
    {
        $code = trim($code);
        $cleanCode = ltrim($code, '#');

        $report = Report::with([
            'user' => fn($q) => $q->select(['id', 'name', 'avatar']),
            'kelurahan',
            'statusLogs.changedBy' => fn($q) => $q->select(['id', 'name', 'role']),
            'categoryRef',
        ])
        ->where('tracking_code', $cleanCode)
        ->orWhere('id', $cleanCode)
        ->orWhere('tracking_code', 'LIKE', "%{$cleanCode}%")
        ->first();

        if (!$report) {
            return response()->json(['message' => 'Nomor tiket laporan tidak ditemukan.'], 404);
        }

        return response()->json([
            'report' => new ReportResource($report),
        ]);
    }

    /**
     * GET /api/reports/export
     * Official CSV Export for administration & OPD disposition
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Report::with(['kelurahan', 'user'])->orderByDesc('created_at');

        if ($cat = $request->query('category')) {
            $query->where('category', $cat);
        }
        if ($st = $request->query('status')) {
            $query->where('status', $st);
        }

        $reports = $query->limit(1000)->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rekap-pengaduan-surabaya-' . now()->format('Ymd-His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($reports) {
            $handle = fopen('php://output', 'w');
            // Write UTF-8 BOM for Microsoft Excel compatibility
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'No. Tiket',
                'Tanggal Laporan',
                'Judul Aduan',
                'Kategori',
                'Kecamatan',
                'Kelurahan',
                'Alamat Lengkap',
                'Latitude',
                'Longitude',
                'Skor Urgensi',
                'Level Urgensi',
                'Dukungan Warga',
                'Status',
                'Waktu Selesai',
                'Pelapor',
            ]);

            foreach ($reports as $r) {
                fputcsv($handle, [
                    $r->tracking_code ?? ('PSK-' . strtoupper(substr(str_replace('-', '', (string) $r->id), 0, 8))),
                    $r->created_at ? $r->created_at->format('Y-m-d H:i') : '-',
                    $r->title,
                    $r->category,
                    $r->kecamatan ?? $r->kelurahan?->kecamatan ?? '-',
                    $r->kelurahan?->name ?? '-',
                    $r->address ?? '-',
                    $r->latitude,
                    $r->longitude,
                    $r->skor_urgensi,
                    strtoupper($r->urgency_level ?? 'SEDANG'),
                    $r->upvotes_count ?? 0,
                    $r->status,
                    $r->resolved_at ? $r->resolved_at->format('Y-m-d H:i') : ($r->status === 'SELESAI' ? 'Selesai' : '-'),
                    $r->user?->name ?? 'Warga Surabaya',
                ]);
            }

            fclose($handle);
        }, 200, $headers);
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
