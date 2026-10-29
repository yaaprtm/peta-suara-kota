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
            // GeoJSON tidak tersedia (Vercel serverless) — gunakan fallback kecamatan
            // berdasarkan centroid kecamatan yang paling dekat
            return self::determineKecamatanByProximity($lng, $lat);
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

    /**
     * Fallback: tentukan kecamatan berdasarkan centroid terdekat.
     * Digunakan saat GeoJSON tidak tersedia (misal di Vercel serverless).
     */
    private static function determineKecamatanByProximity(float $lng, float $lat): string
    {
        $kecamatanCentroids = [
            'Genteng'         => [-7.2575,  112.7400],
            'Bubutan'         => [-7.2395,  112.7280],
            'Krembangan'      => [-7.2210,  112.7230],
            'Semampir'        => [-7.2280,  112.7560],
            'Kenjeran'        => [-7.2180,  112.7770],
            'Bulak'           => [-7.2080,  112.7800],
            'Tambaksari'      => [-7.2600,  112.7630],
            'Gubeng'          => [-7.2700,  112.7530],
            'Simokerto'       => [-7.2420,  112.7430],
            'Pabean Cantian'  => [-7.2250,  112.7380],
            'Wonokromo'       => [-7.3050,  112.7330],
            'Sawahan'         => [-7.2870,  112.7200],
            'Tegalsari'       => [-7.2700,  112.7320],
            'Dukuh Pakis'     => [-7.2980,  112.7100],
            'Sukomanunggal'   => [-7.2600,  112.7000],
            'Tandes'          => [-7.2400,  112.6880],
            'Asemrowo'        => [-7.2280,  112.6980],
            'Benowo'          => [-7.2450,  112.6530],
            'Pakal'           => [-7.2380,  112.6250],
            'Sambikerep'      => [-7.2700,  112.6550],
            'Lakarsantri'     => [-7.3050,  112.6580],
            'Wiyung'          => [-7.3180,  112.6980],
            'Karang Pilang'   => [-7.3380,  112.6950],
            'Jambangan'       => [-7.3480,  112.7150],
            'Gayungan'        => [-7.3280,  112.7280],
            'Wonocolo'        => [-7.3200,  112.7430],
            'Rungkut'         => [-7.3250,  112.7820],
            'Tenggilis Mejoyo'=> [-7.3250,  112.7600],
            'Gunung Anyar'    => [-7.3380,  112.7800],
            'Sukolilo'        => [-7.2950,  112.7920],
            'Mulyorejo'       => [-7.2700,  112.7900],
        ];

        $nearest = 'Surabaya';
        $minDist = PHP_FLOAT_MAX;

        foreach ($kecamatanCentroids as $name => $coord) {
            $dlat = $lat - $coord[0];
            $dlng = $lng - $coord[1];
            $dist = $dlat * $dlat + $dlng * $dlng;
            if ($dist < $minDist) {
                $minDist = $dist;
                $nearest = $name;
            }
        }

        return $nearest;
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
