<?php

namespace App\Services;

class KecamatanService
{
    private const MIN_LAT = -7.45;
    private const MAX_LAT = -7.10;
    private const MIN_LNG = 112.50;
    private const MAX_LNG = 112.95;

    private static ?array $geoJson = null;

    public static function getGeoJson(): ?array
    {
        if (self::$geoJson !== null) {
            return self::$geoJson;
        }

        $paths = [
            public_path('data/kecamatan-surabaya.geojson'),
        ];

        foreach ($paths as $path) {
            if (file_exists($path)) {
                $content = file_get_contents($path);
                if ($content !== false) {
                    $json = json_decode($content, true);
                    if (is_array($json)) {
                        self::$geoJson = $json;
                        return self::$geoJson;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Determine kecamatan from longitude and latitude.
     * Returns kecamatan name if inside Surabaya, or null if outside.
     */
    public static function determineKecamatan(float $lng, float $lat): ?string
    {
        // 1. Initial bounding box check
        if ($lat < self::MIN_LAT || $lat > self::MAX_LAT || $lng < self::MIN_LNG || $lng > self::MAX_LNG) {
            return null;
        }

        $geoJson = self::getGeoJson();
        if (!$geoJson || !isset($geoJson['features'])) {
            // Fallback if geojson missing but within bounding box
            return 'Surabaya';
        }

        foreach ($geoJson['features'] as $feature) {
            $geom = $feature['geometry'] ?? null;
            if (!$geom) continue;

            $type = $geom['type'] ?? '';
            $coordinates = $geom['coordinates'] ?? [];
            $name = $feature['properties']['name'] ?? null;

            if ($type === 'Polygon') {
                foreach ($coordinates as $ring) {
                    if (self::pointInRing($lng, $lat, $ring)) {
                        return $name;
                    }
                }
            } elseif ($type === 'MultiPolygon') {
                foreach ($coordinates as $polygon) {
                    foreach ($polygon as $ring) {
                        if (self::pointInRing($lng, $lat, $ring)) {
                            return $name;
                        }
                    }
                }
            }
        }

        // Check if coordinate is within general Surabaya city bounds (edge cases near boundary)
        return null;
    }

    private static function pointInRing(float $lng, float $lat, array $ring): bool
    {
        $inside = false;
        $count = count($ring);
        for ($i = 0, $j = $count - 1; $i < $count; $j = $i++) {
            $xi = $ring[$i][0];
            $yi = $ring[$i][1];
            $xj = $ring[$j][0];
            $yj = $ring[$j][1];

            $intersect = (($yi > $lat) !== ($yj > $lat))
                && ($lng < ($xj - $xi) * ($lat - $yi) / ($yj - $yi) + $xi);
            if ($intersect) {
                $inside = !$inside;
            }
        }
        return $inside;
    }
}
