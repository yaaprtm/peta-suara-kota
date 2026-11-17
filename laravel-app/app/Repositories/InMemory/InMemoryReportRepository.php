<?php

namespace App\Repositories\InMemory;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use Illuminate\Support\Str;

class InMemoryReportRepository implements ReportRepositoryInterface
{
    /**
     * @var array<string, array> Keyed by report ID
     */
    protected array $reports = [];

    protected ?CounterRepositoryInterface $counterRepository;

    public function __construct(
        array $initialReports = [],
        ?CounterRepositoryInterface $counterRepository = null
    ) {
        $this->counterRepository = $counterRepository;
        foreach ($initialReports as $r) {
            $id = (string) ($r['id'] ?? Str::uuid());
            $r['id'] = $id;
            $this->reports[$id] = $r;
        }
    }

    public function findById(string $id): ?array
    {
        return $this->reports[$id] ?? null;
    }

    public function findByTrackingCode(string $code): ?array
    {
        $normalized = strtoupper(trim($code));
        foreach ($this->reports as $r) {
            if (strtoupper($r['tracking_code'] ?? '') === $normalized) {
                return $r;
            }
        }
        return null;
    }

    public function list(array $filters = [], int $limit = 20, int $offset = 0): array
    {
        $results = array_values($this->reports);

        if (!empty($filters['status'])) {
            $status = strtoupper($filters['status']);
            $results = array_filter($results, fn($r) => strtoupper($r['status'] ?? '') === $status);
        }

        if (!empty($filters['category'])) {
            $cat = strtoupper($filters['category']);
            $results = array_filter($results, function ($r) use ($cat) {
                $c = strtoupper($r['category'] ?? $r['category_type'] ?? '');
                return $c === $cat;
            });
        }

        if (!empty($filters['kecamatan'])) {
            $kec = mb_strtolower(trim($filters['kecamatan']));
            $results = array_filter($results, fn($r) => mb_strtolower(trim($r['kecamatan'] ?? '')) === $kec);
        }

        if (!empty($filters['kelurahan_id'])) {
            $kid = (string) $filters['kelurahan_id'];
            $results = array_filter($results, fn($r) => (string) ($r['kelurahan_id'] ?? '') === $kid);
        }

        if (!empty($filters['user_id'])) {
            $uid = (string) $filters['user_id'];
            $results = array_filter($results, fn($r) => (string) ($r['user_id'] ?? '') === $uid);
        }

        if (!empty($filters['search'])) {
            $q = mb_strtolower(trim($filters['search']));
            $results = array_filter($results, function ($r) use ($q) {
                return str_contains(mb_strtolower($r['title'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['description'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['tracking_code'] ?? ''), $q)
                    || str_contains(mb_strtolower($r['address'] ?? ''), $q);
            });
        }

        $sort = $filters['sort'] ?? 'newest';
        usort($results, function ($a, $b) use ($sort) {
            switch ($sort) {
                case 'urgency_desc':
                    return ($b['skor_urgensi'] ?? 0) <=> ($a['skor_urgensi'] ?? 0);
                case 'oldest':
                    return strcmp($a['created_at'] ?? '', $b['created_at'] ?? '');
                case 'upvotes_desc':
                    return ($b['upvotes'] ?? 0) <=> ($a['upvotes'] ?? 0);
                case 'newest':
                default:
                    return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
            }
        });

        $total = count($results);
        $items = array_slice(array_values($results), $offset, $limit);

        return [
            'data' => $items,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
        ];
    }

    public function viewport(array $params): array
    {
        $minLat = isset($params['minLat']) ? (float) $params['minLat'] : null;
        $maxLat = isset($params['maxLat']) ? (float) $params['maxLat'] : null;
        $minLng = isset($params['minLng']) ? (float) $params['minLng'] : null;
        $maxLng = isset($params['maxLng']) ? (float) $params['maxLng'] : null;
        $status = !empty($params['status']) ? strtoupper($params['status']) : null;
        $category = !empty($params['category']) ? strtoupper($params['category']) : null;
        $kecamatan = !empty($params['kecamatan']) ? mb_strtolower(trim($params['kecamatan'])) : null;

        $results = [];
        foreach ($this->reports as $r) {
            if ($status && strtoupper($r['status'] ?? '') !== $status) {
                continue;
            }
            if ($category) {
                $c = strtoupper($r['category'] ?? $r['category_type'] ?? '');
                if ($c !== $category) {
                    continue;
                }
            }
            if ($kecamatan && mb_strtolower(trim($r['kecamatan'] ?? '')) !== $kecamatan) {
                continue;
            }

            $lat = (float) ($r['lat'] ?? $r['latitude'] ?? 0);
            $lng = (float) ($r['lng'] ?? $r['longitude'] ?? 0);

            if ($minLat !== null && $lat < $minLat) continue;
            if ($maxLat !== null && $lat > $maxLat) continue;
            if ($minLng !== null && $lng < $minLng) continue;
            if ($maxLng !== null && $lng > $maxLng) continue;

            $results[] = $r;
        }

        return $results;
    }

    public function nearby(float $lat, float $lng, float $radiusKm = 2.0, int $limit = 20): array
    {
        $items = [];
        $earthRadius = 6371; // km

        foreach ($this->reports as $r) {
            $rLat = (float) ($r['lat'] ?? $r['latitude'] ?? 0);
            $rLng = (float) ($r['lng'] ?? $r['longitude'] ?? 0);

            $dLat = deg2rad($rLat - $lat);
            $dLng = deg2rad($rLng - $lng);

            $a = sin($dLat / 2) * sin($dLat / 2) +
                cos(deg2rad($lat)) * cos(deg2rad($rLat)) *
                sin($dLng / 2) * sin($dLng / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distance = $earthRadius * $c;

            if ($distance <= $radiusKm) {
                $copy = $r;
                $copy['distance_km'] = round($distance, 3);
                $items[] = $copy;
            }
        }

        usort($items, fn($a, $b) => $a['distance_km'] <=> $b['distance_km']);

        return array_slice($items, 0, $limit);
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? (string) Str::uuid();
        $code = $data['tracking_code'] ?? ('PATROL-' . now()->format('Ymd') . '-' . strtoupper(Str::random(4)));
        $now = now()->toISOString();

        $initialLog = [
            'id' => (string) Str::uuid(),
            'from_status' => null,
            'to_status' => $data['status'] ?? 'BARU',
            'note' => $data['note'] ?? 'Laporan berhasil dibuat',
            'changed_by' => $data['user_id'] ?? 'system',
            'changed_at' => $now,
        ];

        $report = array_merge([
            'id' => $id,
            'tracking_code' => $code,
            'title' => '',
            'description' => '',
            'status' => 'BARU',
            'category' => 'LAINNYA',
            'kelurahan_id' => null,
            'kecamatan' => '',
            'address' => '',
            'lat' => 0.0,
            'lng' => 0.0,
            'skor_urgensi' => 30,
            'upvotes' => 0,
            'photo_url' => null,
            'audio_url' => null,
            'user_id' => null,
            'status_logs' => [$initialLog],
            'created_at' => $now,
            'updated_at' => $now,
        ], $data);

        $report['id'] = $id;
        $report['tracking_code'] = $code;
        $report['lat'] = (float) ($data['lat'] ?? $data['latitude'] ?? 0);
        $report['lng'] = (float) ($data['lng'] ?? $data['longitude'] ?? 0);
        $report['latitude'] = $report['lat'];
        $report['longitude'] = $report['lng'];

        $this->reports[$id] = $report;

        if ($this->counterRepository) {
            $this->counterRepository->incrementReportCreated($report);
        }

        return $report;
    }

    public function updateStatus(
        string $id,
        string $status,
        ?string $note = null,
        ?array $changedBy = null,
        ?array $completionData = null
    ): ?array {
        if (!isset($this->reports[$id])) {
            return null;
        }

        $report = $this->reports[$id];
        $oldStatus = $report['status'];
        $now = now()->toISOString();

        $log = [
            'id' => (string) Str::uuid(),
            'from_status' => $oldStatus,
            'to_status' => $status,
            'note' => $note ?? "Status diubah menjadi {$status}",
            'changed_by' => $changedBy['id'] ?? 'system',
            'changed_at' => $now,
        ];

        $report['status'] = $status;
        $report['updated_at'] = $now;
        $report['status_logs'][] = $log;

        if ($status === 'SELESAI' && $completionData) {
            $report['completed_at'] = $now;
            $report['completion_proof_url'] = $completionData['proof_url'] ?? null;
            $report['completion_notes'] = $completionData['notes'] ?? null;
        }

        $this->reports[$id] = $report;

        if ($this->counterRepository) {
            $this->counterRepository->updateReportStatus($oldStatus, $status, $report);
        }

        return $report;
    }

    public function upvote(string $id): ?array
    {
        if (!isset($this->reports[$id])) {
            return null;
        }

        $this->reports[$id]['upvotes'] = ($this->reports[$id]['upvotes'] ?? 0) + 1;
        $this->reports[$id]['updated_at'] = now()->toISOString();

        return $this->reports[$id];
    }

    public function delete(string $id): bool
    {
        if (isset($this->reports[$id])) {
            unset($this->reports[$id]);
            return true;
        }
        return false;
    }
}

