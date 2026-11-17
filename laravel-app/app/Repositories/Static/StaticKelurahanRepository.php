<?php

namespace App\Repositories\Static;

use App\Contracts\Repositories\KelurahanRepositoryInterface;
use Illuminate\Support\Str;

class StaticKelurahanRepository implements KelurahanRepositoryInterface
{
    private static ?array $items = null;

    private function load(): array
    {
        if (self::$items !== null) {
            return self::$items;
        }

        $jsonPath = database_path('seeders/kelurahan_surabaya_lengkap.json');
        if (!file_exists($jsonPath)) {
            self::$items = [];
            return self::$items;
        }

        $raw = json_decode(file_get_contents($jsonPath), true) ?: [];
        $items = [];
        $id = 1;

        foreach ($raw as $k) {
            $slug = Str::slug($k['kecamatan'] . '-' . $k['name']);
            $items[] = [
                'id' => (string) $id,
                'slug' => $slug,
                'name' => $k['name'],
                'kecamatan' => $k['kecamatan'],
                'kota' => 'Surabaya',
                'centroid_lat' => (float) ($k['centroidLat'] ?? 0),
                'centroid_lng' => (float) ($k['centroidLng'] ?? 0),
            ];
            $id++;
        }

        self::$items = $items;
        return self::$items;
    }

    public function all(): array
    {
        return $this->load();
    }

    public function findById(string $id): ?array
    {
        $items = $this->load();
        foreach ($items as $item) {
            if ($item['id'] === (string) $id || ($item['slug'] ?? '') === $id) {
                return $item;
            }
        }
        return null;
    }

    public function findByName(string $name, ?string $kecamatan = null): ?array
    {
        $items = $this->load();
        $targetName = mb_strtolower(trim($name));
        $targetKecamatan = $kecamatan ? mb_strtolower(trim($kecamatan)) : null;

        foreach ($items as $item) {
            $matchName = mb_strtolower($item['name']) === $targetName;
            if ($targetKecamatan !== null) {
                if ($matchName && mb_strtolower($item['kecamatan']) === $targetKecamatan) {
                    return $item;
                }
            } elseif ($matchName) {
                return $item;
            }
        }
        return null;
    }

    public function allWithReportCounts(array $reportCountsByKelurahanId = []): array
    {
        $items = $this->load();
        return array_map(function ($item) use ($reportCountsByKelurahanId) {
            $id = $item['id'];
            $slug = $item['slug'];
            $count = $reportCountsByKelurahanId[$id] ?? $reportCountsByKelurahanId[$slug] ?? 0;
            $item['reports_count'] = (int) $count;
            return $item;
        }, $items);
    }
}

