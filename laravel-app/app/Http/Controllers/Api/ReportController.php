<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\CategoryRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReportRequest;
use App\Http\Requests\UpdateReportStatusRequest;
use App\Services\Firebase\FirebaseStorageService;
use App\Services\GeofenceValidator;
use App\Services\StatusWorkflowManager;
use App\Services\UrgencyScorer;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    protected ReportRepositoryInterface $reportRepository;
    protected KelurahanRepositoryInterface $kelurahanRepository;
    protected CategoryRepositoryInterface $categoryRepository;
    protected UserRepositoryInterface $userRepository;

    public function __construct(
        ReportRepositoryInterface $reportRepository,
        KelurahanRepositoryInterface $kelurahanRepository,
        CategoryRepositoryInterface $categoryRepository,
        UserRepositoryInterface $userRepository
    ) {
        $this->reportRepository = $reportRepository;
        $this->kelurahanRepository = $kelurahanRepository;
        $this->categoryRepository = $categoryRepository;
        $this->userRepository = $userRepository;
    }

    /**
     * Helper: format laporan ke array JSON standar persis seperti ReportResource
     */
    private function formatReport(array $r): array
    {
        $id = (string) ($r['id'] ?? '');
        $trackingCode = $r['tracking_code'] ?? ('PSK-' . strtoupper(substr(str_replace('-', '', $id), 0, 8)));
        $skor = (int) ($r['skor_urgensi'] ?? 30);

        $urgencyLevel = 'RENDAH';
        if ($skor >= 70) {
            $urgencyLevel = 'TINGGI';
        } elseif ($skor >= 40) {
            $urgencyLevel = 'SEDANG';
        }

        // Relasi kelurahan
        $kelurahan = null;
        if (!empty($r['kelurahan_id'])) {
            $kData = $this->kelurahanRepository->findById((string) $r['kelurahan_id']);
            if ($kData) {
                $kelurahan = [
                    'id' => (string) $kData['id'],
                    'name' => $kData['name'],
                    'kecamatan' => $kData['kecamatan'],
                ];
            }
        }

        // Relasi user
        $user = null;
        if (!empty($r['user_id'])) {
            $uData = $this->userRepository->findById((string) $r['user_id']);
            if ($uData) {
                $user = [
                    'id' => (string) $uData['id'],
                    'name' => $uData['name'] ?? '',
                    'avatar' => $uData['avatar'] ?? null,
                ];
            }
        }

        // Status logs
        $rawLogs = $r['status_logs'] ?? [];
        $statusLogs = array_map(function ($log) {
            return [
                'id' => (string) ($log['id'] ?? ''),
                'reportId' => (string) ($log['report_id'] ?? ''),
                'fromStatus' => $log['from_status'] ?? null,
                'toStatus' => $log['to_status'] ?? '',
                'note' => $log['note'] ?? null,
                'changedById' => $log['changed_by_id'] ?? null,
                'changedAt' => $log['changed_at'] ?? $log['created_at'] ?? null,
                'changedBy' => !empty($log['changed_by']) ? $log['changed_by'] : null,
            ];
        }, $rawLogs);

        return [
            'id' => $id,
            'trackingCode' => $trackingCode,
            'title' => $r['title'] ?? '',
            'description' => $r['description'] ?? '',
            'category' => $r['category'] ?? 'LAINNYA',
            'status' => $r['status'] ?? 'BARU',
            'latitude' => (float) ($r['latitude'] ?? $r['lat'] ?? 0),
            'longitude' => (float) ($r['longitude'] ?? $r['lng'] ?? 0),
            'address' => $r['address'] ?? '',
            'kelurahanId' => $r['kelurahan_id'] ?? null,
            'kecamatan' => $r['kecamatan'] ?? '',
            'skorUrgensi' => $skor,
            'upvotesCount' => (int) ($r['upvotes_count'] ?? $r['upvotes'] ?? 0),
            'urgensiKeywords' => $r['urgensi_keywords'] ?? [],
            'urgencyLevel' => $urgencyLevel,
            'photos' => $r['photos'] ?? [],
            'completionPhotos' => $r['completion_photos'] ?? [],
            'completionNote' => $r['completion_note'] ?? null,
            'audioUrl' => $r['audio_url'] ?? null,
            'audioTranscript' => $r['audio_transcript'] ?? null,
            'userId' => $r['user_id'] ?? null,
            'categoryId' => $r['category_id'] ?? null,
            'createdAt' => $r['created_at'] ?? null,
            'updatedAt' => $r['updated_at'] ?? null,
            'resolvedAt' => $r['resolved_at'] ?? null,
            'user' => $user,
            'kelurahan' => $kelurahan,
            'categoryRef' => null,
            'statusLogs' => $statusLogs,
        ];
    }

    /**
     * GET /api/reports/nearby
     */
    public function nearby(Request $request): JsonResponse
    {
        $lat = (float) $request->query('lat', 0);
        $lng = (float) $request->query('lng', 0);
        $radius = min((float) ($request->query('radius', 2)), 10);
        $limit = min((int) ($request->query('limit', 20)), 50);

        if ($lat === 0.0 && $lng === 0.0) {
            return response()->json(['message' => 'Parameter lat dan lng wajib diisi.'], 400);
        }

        $items = $this->reportRepository->nearby($lat, $lng, $radius, $limit);

        $data = array_map(function ($r) {
            $formatted = $this->formatReport($r);
            $formatted['distanceKm'] = $r['distance_km'] ?? null;
            return $formatted;
        }, $items);

        return response()->json([
            'reports' => $data,
            'count' => count($data),
            'centerLat' => $lat,
            'centerLng' => $lng,
            'radiusKm' => $radius,
        ]);
    }

    /**
     * GET /api/reports/viewport
     */
    public function viewport(Request $request): JsonResponse
    {
        $params = [];
        if ($bbox = $request->query('bbox')) {
            $parts = array_map('floatval', explode(',', $bbox));
            if (count($parts) === 4) {
                [$minLng, $minLat, $maxLng, $maxLat] = $parts;
                $params['minLat'] = min($minLat, $maxLat);
                $params['maxLat'] = max($minLat, $maxLat);
                $params['minLng'] = min($minLng, $maxLng);
                $params['maxLng'] = max($minLng, $maxLng);
            }
        }

        if ($category = $request->query('category')) {
            $params['category'] = $category;
        }
        if ($status = $request->query('status')) {
            $params['status'] = $status;
        }
        if ($kecamatan = $request->query('kecamatan')) {
            $params['kecamatan'] = $kecamatan;
        }
        $params['limit'] = min((int) ($request->query('limit') ?: 300), 500);

        $reports = $this->reportRepository->viewport($params);
        $formatted = array_map(fn($r) => $this->formatReport($r), $reports);
        $zoom = $request->query('zoom');

        return response()->json([
            'reports' => $formatted,
            'count' => count($formatted),
            'zoom' => $zoom !== null ? (float) $zoom : null,
        ])->header('Cache-Control', 'public, max-age=20, s-maxage=20');
    }

    /**
     * GET /api/reports
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [];
        if ($category = $request->query('category')) {
            $filters['category'] = $category;
        }
        if ($status = $request->query('status')) {
            $filters['status'] = $status;
        }
        if ($kelurahanId = $request->query('kelurahanId')) {
            $filters['kelurahan_id'] = $kelurahanId;
        }
        if ($kecamatan = $request->query('kecamatan')) {
            $filters['kecamatan'] = $kecamatan;
        }
        if ($search = $request->query('search')) {
            $filters['search'] = $search;
        }

        $limit = min((int) ($request->query('limit') ?: 50), 100);
        $page = (int) ($request->query('page') ?: 1);
        $offset = ($page - 1) * $limit;

        $result = $this->reportRepository->list($filters, $limit, $offset);
        $formatted = array_map(fn($r) => $this->formatReport($r), $result['data']);

        $total = $result['total'];
        $pages = (int) ceil($total / max(1, $limit));

        return response()->json([
            'reports' => $formatted,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'pages' => max(1, $pages),
            ],
        ]);
    }

    /**
     * GET /api/reports/{id}
     */
    public function show(string $id): JsonResponse
    {
        $report = $this->reportRepository->findById($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        return response()->json([
            'report' => $this->formatReport($report),
        ]);
    }

    /**
     * POST /api/reports
     */
    public function store(StoreReportRequest $request): JsonResponse
    {
        $lat = (float) $request->latitude;
        $lng = (float) $request->longitude;

        // Validasi geofence Surabaya
        $validation = GeofenceValidator::validate($lat, $lng);
        if (!$validation['valid']) {
            return response()->json(['message' => $validation['message']], 400);
        }

        $detectedKecamatan = $validation['kecamatan'];

        // Upload foto (Firebase Storage dengan fallback otomatis Base64 Data URL)
        $photoPaths = [];
        if ($request->hasFile('photos')) {
            $rawPhotos = $request->file('photos');
            $photoList = is_array($rawPhotos) ? $rawPhotos : [$rawPhotos];

            try {
                $storageService = new FirebaseStorageService();
                $photoPaths = $storageService->uploadMany($photoList, 'photos');
            } catch (\Throwable $e) {
                error_log('Firebase Storage photo upload failed: ' . $e->getMessage());
                $photoPaths = [];
            }

            // Fallback: Jika upload ke Firebase Storage gagal (misal bucket belum aktif),
            // simpan foto sebagai Data URL langsung di Firestore agar foto TIDAK PERNAH HILANG!
            if (empty($photoPaths)) {
                foreach ($photoList as $file) {
                    if ($file instanceof \Illuminate\Http\UploadedFile && $file->isValid()) {
                        $dataUrl = self::fileToDataUrl($file);
                        if ($dataUrl) {
                            $photoPaths[] = $dataUrl;
                        }
                    }
                }
            }
        }

        // Upload audio
        $audioPath = null;
        if ($request->hasFile('audio')) {
            try {
                $audioPath = StorageService::storeFile(
                    $request->file('audio'),
                    'audio',
                    'public'
                );
            } catch (\Throwable $e) {
                error_log('Audio upload failed: ' . $e->getMessage());
            }
        }

        // Urgency scoring
        $textToAnalyze = trim(
            $request->title . ' ' .
            $request->description . ' ' .
            ($request->audioTranscript ?? '')
        );
        $urgency = UrgencyScorer::analyzeUrgency($textToAnalyze, $request->category);

        $currentUser = $request->user();
        $userId = $currentUser ? (string) $currentUser->id : null;

        $reportData = [
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
            'user_id' => $userId,
            'note' => 'Laporan diterima oleh sistem',
        ];

        try {
            $created = $this->reportRepository->create($reportData);
        } catch (\Throwable $e) {
            $requestId = substr(md5(uniqid('', true)), 0, 12);
            return response()->json([
                'message' => 'Laporan gagal disimpan. Coba lagi dalam beberapa saat.',
                'request_id' => $requestId,
            ], 500);
        }

        return response()->json([
            'message' => 'Laporan berhasil dibuat',
            'report' => $this->formatReport($created),
        ], 201);
    }

    /**
     * GET /api/reports/{id}/status/transitions
     */
    public function getValidTransitions(string $id): JsonResponse
    {
        $report = $this->reportRepository->findById($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $currentStatus = $report['status'] ?? 'BARU';
        $validNextStatuses = StatusWorkflowManager::getValidNextStatuses($currentStatus);

        $transitions = array_map(function ($status) {
            return [
                'status' => $status,
                'label' => StatusWorkflowManager::getStatusLabel($status),
                'color' => StatusWorkflowManager::getStatusColor($status),
                'requiresNote' => StatusWorkflowManager::requiresCompletionNote($status),
            ];
        }, $validNextStatuses);

        return response()->json([
            'currentStatus' => $currentStatus,
            'validTransitions' => array_values($transitions),
        ]);
    }

    /**
     * PATCH /api/reports/{id}/status
     */
    public function updateStatus(UpdateReportStatusRequest $request, string $id): JsonResponse
    {
        $report = $this->reportRepository->findById($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $oldStatus = $report['status'] ?? 'BARU';
        $newStatus = $request->status;

        $transitionValidation = StatusWorkflowManager::validateTransition($oldStatus, $newStatus);
        if (!$transitionValidation['valid']) {
            return response()->json([
                'message' => $transitionValidation['message'],
            ], 400);
        }

        if (StatusWorkflowManager::requiresCompletionNote($newStatus)) {
            $note = $request->completion_note ?? $request->note;
            if (empty($note)) {
                return response()->json([
                    'message' => "Catatan penyelesaian wajib diisi untuk status '{$newStatus}'.",
                ], 400);
            }
        }

        $completionData = null;
        if ($newStatus === 'SELESAI') {
            $compPhotos = $report['completion_photos'] ?? [];
            if ($request->hasFile('completion_photos')) {
                $rawComp = $request->file('completion_photos');
                $compList = is_array($rawComp) ? $rawComp : [$rawComp];
                $newPhotos = [];

                try {
                    $storageService = new FirebaseStorageService();
                    $newPhotos = $storageService->uploadMany($compList, 'photos');
                } catch (\Throwable $e) {
                    error_log('Firebase Storage completion_photos upload failed: ' . $e->getMessage());
                    $newPhotos = [];
                }

                if (empty($newPhotos)) {
                    foreach ($compList as $file) {
                        if ($file instanceof \Illuminate\Http\UploadedFile && $file->isValid()) {
                            $dataUrl = self::fileToDataUrl($file);
                            if ($dataUrl) {
                                $newPhotos[] = $dataUrl;
                            }
                        }
                    }
                }

                $compPhotos = array_merge($compPhotos, $newPhotos);
            }

            $completionData = [
                'note' => $request->completion_note ?? $request->note,
                'photos' => $compPhotos,
            ];
        } elseif ($newStatus === 'DITOLAK') {
            $completionData = [
                'note' => $request->completion_note ?? $request->note,
            ];
        }

        $currentUser = $request->user();
        $changedBy = $currentUser ? [
            'id' => (string) $currentUser->id,
            'name' => $currentUser->name,
            'role' => $currentUser->role,
        ] : null;

        $updated = $this->reportRepository->updateStatus(
            $id,
            $newStatus,
            $request->note ?? $request->completion_note,
            $changedBy,
            $completionData
        );

        return response()->json([
            'message' => 'Status berhasil diperbarui',
            'report' => $this->formatReport($updated),
        ]);
    }

    /**
     * POST /api/reports/{id}/upvote
     */
    public function upvote(Request $request, string $id): JsonResponse
    {
        $report = $this->reportRepository->findById($id);
        if (!$report) {
            return response()->json(['message' => 'Laporan tidak ditemukan'], 404);
        }

        $updated = $this->reportRepository->upvote($id);
        $upvotes = (int) ($updated['upvotes_count'] ?? $updated['upvotes'] ?? 0);

        return response()->json([
            'message' => 'Dukungan berhasil ditambahkan',
            'upvotesCount' => $upvotes,
            'report' => $this->formatReport($updated),
        ]);
    }

    /**
     * GET /api/reports/track/{code}
     */
    public function track(string $code): JsonResponse
    {
        $report = $this->reportRepository->findByTrackingCode($code);
        if (!$report) {
            return response()->json(['message' => 'Nomor tiket laporan tidak ditemukan.'], 404);
        }

        return response()->json([
            'report' => $this->formatReport($report),
        ]);
    }

    /**
     * GET /api/reports/export
     */
    public function export(Request $request): StreamedResponse
    {
        $filters = [];
        if ($cat = $request->query('category')) {
            $filters['category'] = $cat;
        }
        if ($st = $request->query('status')) {
            $filters['status'] = $st;
        }

        $result = $this->reportRepository->list($filters, 1000);
        $reports = $result['data'];

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rekap-pengaduan-surabaya-' . now()->format('Ymd-His') . '.csv"',
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        return response()->stream(function () use ($reports) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['ID', 'Nomor Tiket', 'Judul', 'Kategori', 'Status', 'Kecamatan', 'Alamat', 'Skor Urgensi', 'Dukungan Warga', 'Tanggal Dibuat']);

            foreach ($reports as $r) {
                fputcsv($handle, [
                    $r['id'] ?? '',
                    $r['tracking_code'] ?? '',
                    $r['title'] ?? '',
                    $r['category'] ?? '',
                    $r['status'] ?? '',
                    $r['kecamatan'] ?? '',
                    $r['address'] ?? '',
                    $r['skor_urgensi'] ?? 0,
                    $r['upvotes_count'] ?? $r['upvotes'] ?? 0,
                    $r['created_at'] ?? '',
                ]);
            }
            fclose($handle);
        }, 200, $headers);
    }

    /**
     * Konversi file gambar yang diunggah menjadi Base64 Data URL.
     * Digunakan sebagai fallback aman jika Firebase Storage bucket belum tersedia.
     */
    private static function fileToDataUrl(\Illuminate\Http\UploadedFile $file): ?string
    {
        $realPath = $file->getRealPath();
        if (!$realPath || !file_exists($realPath)) {
            return null;
        }

        $content = file_get_contents($realPath);
        if ($content === false || empty($content)) {
            return null;
        }

        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        $mimeMap = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
        ];
        $mime = $mimeMap[$ext] ?? 'image/jpeg';

        return 'data:' . $mime . ';base64,' . base64_encode($content);
    }
}
