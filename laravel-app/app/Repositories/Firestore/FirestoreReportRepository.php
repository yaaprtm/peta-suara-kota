<?php

namespace App\Repositories\Firestore;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Services\Firebase\FirestoreClientInterface;
use Illuminate\Support\Str;

class FirestoreReportRepository implements ReportRepositoryInterface
{
    private const COLLECTION = 'reports';

    protected FirestoreClientInterface $client;
    protected ?CounterRepositoryInterface $counterRepository;

    public function __construct(
        FirestoreClientInterface $client,
        ?CounterRepositoryInterface $counterRepository = null
    ) {
        $this->client = $client;
        $this->counterRepository = $counterRepository;
    }

    public function findById(string $id): ?array
    {
        return $this->client->getDocument(self::COLLECTION, $id);
    }

    public function findByTrackingCode(string $code): ?array
    {
        $normalized = strtoupper(trim(ltrim($code, '#')));

        // 1. Coba cari via tracking_code
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'tracking_code'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $normalized],
                ],
            ],
            'limit' => 1,
        ];

        try {
            $results = $this->client->runQuery(self::COLLECTION, $query);
            if (!empty($results[0])) {
                return $results[0];
            }
        } catch (\Throwable $e) {
            // Lanjut ke fallback pencarian ID
        }

        // 2. Fallback cari via ID dokumen
        return $this->findById($normalized);
    }

    public function list(array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'limit' => $limit,
        ];

        if ($offset > 0) {
            $query['offset'] = $offset;
        }

        // Filter sederhana tunggal untuk optimasi kuota Firestore
        if (!empty($filters['status'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'status'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => strtoupper($filters['status'])],
                ],
            ];
        } elseif (!empty($filters['category'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'category'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => strtoupper($filters['category'])],
                ],
            ];
        } elseif (!empty($filters['user_id'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'user_id'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => (string) $filters['user_id']],
                ],
            ];
        }

        $results = $this->client->runQuery(self::COLLECTION, $query);

        // Filter tambahan in-memory untuk fleksibilitas (search, skor, kelurahan)
        if (!empty($filters['search'])) {
            $q = mb_strtolower(trim($filters['search']));
            $results = array_filter($results, function ($r) use ($q) {
                return str_contains(mb_strtolower($r['title'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['description'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['tracking_code'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['address'] ?? ''), $q);
            });
        }

        if (!empty($filters['kelurahan_id'])) {
            $kid = (string) $filters['kelurahan_id'];
            $results = array_filter($results, fn($r) => (string) ($r['kelurahan_id'] ?? '') === $kid);
        }

        if (!empty($filters['kecamatan'])) {
            $kec = mb_strtolower(trim($filters['kecamatan']));
            $results = array_filter($results, fn($r) => mb_strtolower(trim($r['kecamatan'] ?? '')) === $kec);
        }

        $total = count($results);

        return [
            'data' => array_values($results),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    public function viewport(array $params): array
    {
        $limit = min((int) ($params['limit'] ?? 300), 500);

        // Ambil batch laporan aktif dari Firestore
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'limit' => $limit,
        ];

        if (!empty($params['status'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'status'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => strtoupper($params['status'])],
                ],
            ];
        } elseif (!empty($params['kecamatan'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'kecamatan'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $params['kecamatan']],
                ],
            ];
        }

        $items = $this->client->runQuery(self::COLLECTION, $query);

        // Bounding box filter in-memory di server
        $minLat = isset($params['minLat']) ? (float) $params['minLat'] : null;
        $maxLat = isset($params['maxLat']) ? (float) $params['maxLat'] : null;
        $minLng = isset($params['minLng']) ? (float) $params['minLng'] : null;
        $maxLng = isset($params['maxLng']) ? (float) $params['maxLng'] : null;
        $category = !empty($params['category']) ? strtoupper($params['category']) : null;

        $filtered = [];
        foreach ($items as $r) {
            if ($category && strtoupper($r['category'] ?? '') !== $category) {
                continue;
            }

            $lat = (float) ($r['latitude'] ?? $r['lat'] ?? 0);
            $lng = (float) ($r['longitude'] ?? $r['lng'] ?? 0);

            if ($minLat !== null && $lat < $minLat) continue;
            if ($maxLat !== null && $lat > $maxLat) continue;
            if ($minLng !== null && $lng < $minLng) continue;
            if ($maxLng !== null && $lng > $maxLng) continue;

            $filtered[] = $r;
        }

        // Urutkan berdasarkan skor urgensi dan tanggal dibuat
        usort($filtered, function ($a, $b) {
            $urgencyDiff = ($b['skor_urgensi'] ?? 0) <=> ($a['skor_urgensi'] ?? 0);
            if ($urgencyDiff !== 0) return $urgencyDiff;
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        });

        return array_values($filtered);
    }

    public function nearby(float $lat, float $lng, float $radiusKm = 2.0, int $limit = 20): array
    {
        // Ambil laporan aktif
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'limit' => 100,
        ];

        $items = $this->client->runQuery(self::COLLECTION, $query);
        $earthRadius = 6371.0; // km
        $nearbyItems = [];

        foreach ($items as $r) {
            $status = strtoupper($r['status'] ?? 'BARU');
            if ($status === 'SELESAI' || $status === 'DITOLAK') {
                continue;
            }

            $rLat = (float) ($r['latitude'] ?? $r['lat'] ?? 0);
            $rLng = (float) ($r['longitude'] ?? $r['lng'] ?? 0);

            $dLat = deg2rad($rLat - $lat);
            $dLng = deg2rad($rLng - $lng);

            $a = sin($dLat / 2) ** 2 +
                cos(deg2rad($lat)) * cos(deg2rad($rLat)) * sin($dLng / 2) ** 2;
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distance = $earthRadius * $c;

            if ($distance <= ($radiusKm + 0.01)) {
                $copy = $r;
                $copy['distance_km'] = round($distance, 3);
                $nearbyItems[] = $copy;
            }
        }

        usort($nearbyItems, fn($a, $b) => $a['distance_km'] <=> $b['distance_km']);

        return array_slice($nearbyItems, 0, $limit);
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? (string) Str::uuid();
        $code = $data['tracking_code'] ?? ('PSK-' . strtoupper(substr(str_replace('-', '', $id), 0, 8)));
        $now = now()->toISOString();

        $initialLog = [
            'id' => (string) Str::uuid(),
            'report_id' => $id,
            'from_status' => null,
            'to_status' => $data['status'] ?? 'BARU',
            'note' => $data['note'] ?? 'Laporan diterima oleh sistem',
            'changed_by_id' => $data['user_id'] ?? null,
            'changed_at' => $now,
        ];

        $report = array_merge([
            'id' => $id,
            'tracking_code' => $code,
            'title' => '',
            'description' => '',
            'status' => 'BARU',
            'category' => 'LAINNYA',
            'latitude' => (float) ($data['latitude'] ?? $data['lat'] ?? 0),
            'longitude' => (float) ($data['longitude'] ?? $data['lng'] ?? 0),
            'address' => '',
            'kelurahan_id' => null,
            'kecamatan' => '',
            'skor_urgensi' => 30,
            'upvotes_count' => 0,
            'urgensi_keywords' => [],
            'photos' => [],
            'audio_url' => null,
            'audio_transcript' => null,
            'user_id' => null,
            'status_logs' => [$initialLog],
            'created_at' => $now,
            'updated_at' => $now,
            'resolved_at' => null,
        ], $data);

        $report['id'] = $id;
        $report['tracking_code'] = $code;
        $report['latitude'] = (float) ($report['latitude'] ?? $report['lat'] ?? 0);
        $report['longitude'] = (float) ($report['longitude'] ?? $report['lng'] ?? 0);

        $saved = $this->client->createDocument(self::COLLECTION, $id, $report);

        if ($this->counterRepository) {
            $this->counterRepository->incrementReportCreated($report);
        }

        return $saved;
    }

    public function updateStatus(
        string $id,
        string $status,
        ?string $note = null,
        ?array $changedBy = null,
        ?array $completionData = null
    ): ?array {
        $report = $this->findById($id);
        if (!$report) {
            return null;
        }

        $oldStatus = $report['status'] ?? 'BARU';
        $now = now()->toISOString();

        $log = [
            'id' => (string) Str::uuid(),
            'report_id' => $id,
            'from_status' => $oldStatus,
            'to_status' => $status,
            'note' => $note ?? "Status diubah menjadi {$status}",
            'changed_by_id' => $changedBy['id'] ?? null,
            'changed_by' => $changedBy ? [
                'id' => $changedBy['id'],
                'name' => $changedBy['name'] ?? '',
                'role' => $changedBy['role'] ?? '',
            ] : null,
            'changed_at' => $now,
        ];

        $logs = $report['status_logs'] ?? [];
        $logs[] = $log;

        $update = [
            'status' => $status,
            'updated_at' => $now,
            'status_logs' => $logs,
        ];

        if ($status === 'SELESAI') {
            $update['resolved_at'] = $now;
            if (!empty($completionData['note'])) {
                $update['completion_note'] = $completionData['note'];
            }
            if (!empty($completionData['photos'])) {
                $update['completion_photos'] = $completionData['photos'];
            }
        } elseif ($oldStatus === 'SELESAI' && $status !== 'SELESAI') {
            $update['resolved_at'] = null;
        }

        if ($status === 'DITOLAK' && !empty($completionData['note'])) {
            $update['completion_note'] = $completionData['note'];
        }

        $patched = $this->client->patchDocument(self::COLLECTION, $id, $update);

        if ($this->counterRepository) {
            $this->counterRepository->updateReportStatus($oldStatus, $status, $patched);
        }

        return $patched;
    }

    public function upvote(string $id): ?array
    {
        $report = $this->findById($id);
        if (!$report) {
            return null;
        }

        $currentUpvotes = (int) ($report['upvotes_count'] ?? $report['upvotes'] ?? 0);
        $newUpvotes = $currentUpvotes + 1;

        return $this->client->patchDocument(self::COLLECTION, $id, [
            'upvotes_count' => $newUpvotes,
            'updated_at' => now()->toISOString(),
        ], ['upvotes_count', 'updated_at']);
    }

    public function delete(string $id): bool
    {
        return $this->client->deleteDocument(self::COLLECTION, $id);
    }
}
