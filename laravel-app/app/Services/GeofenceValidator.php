<?php

namespace App\Services;

class GeofenceValidator
{
    /**
     * Surabaya city bounding box (approximate boundaries)
     */
    private const SURABAYA_MIN_LAT = -7.45;
    private const SURABAYA_MAX_LAT = -7.10;
    private const SURABAYA_MIN_LNG = 112.50;
    private const SURABAYA_MAX_LNG = 112.95;

    /**
     * Validate if coordinates are within Surabaya city boundaries.
     * 
     * Uses two-step validation:
     * 1. Fast bounding box check
     * 2. Precise kecamatan polygon check
     *
     * @param  float  $latitude
     * @param  float  $longitude
     * @return bool
     */
    public static function isWithinSurabaya(float $latitude, float $longitude): bool
    {
        // Step 1: Fast bounding box check
        if (!self::isWithinBoundingBox($latitude, $longitude)) {
            return false;
        }

        // Step 2: Precise check - must be within at least one kecamatan polygon
        $kecamatan = KecamatanService::determineKecamatan($longitude, $latitude);

        return $kecamatan !== null;
    }

    /**
     * Check if coordinates are within Surabaya's approximate bounding box.
     * 
     * This is a fast pre-check before expensive polygon validation.
     *
     * @param  float  $latitude
     * @param  float  $longitude
     * @return bool
     */
    public static function isWithinBoundingBox(float $latitude, float $longitude): bool
    {
        return $latitude >= self::SURABAYA_MIN_LAT
            && $latitude <= self::SURABAYA_MAX_LAT
            && $longitude >= self::SURABAYA_MIN_LNG
            && $longitude <= self::SURABAYA_MAX_LNG;
    }

    /**
     * Get detailed validation result with error message.
     *
     * @param  float  $latitude
     * @param  float  $longitude
     * @return array{valid: bool, message: string|null, kecamatan: string|null}
     */
    public static function validate(float $latitude, float $longitude): array
    {
        // Bounding box check
        if (!self::isWithinBoundingBox($latitude, $longitude)) {
            return [
                'valid' => false,
                'message' => 'Koordinat lokasi berada di luar cakupan wilayah Surabaya. Pastikan titik lokasi berada di dalam area Kota Surabaya.',
                'kecamatan' => null,
            ];
        }

        // Precise kecamatan check
        $kecamatan = KecamatanService::determineKecamatan($longitude, $latitude);

        if ($kecamatan === null) {
            return [
                'valid' => false,
                'message' => 'Koordinat lokasi laporan berada di luar cakupan wilayah Surabaya. Silakan pilih titik lokasi di dalam area Surabaya.',
                'kecamatan' => null,
            ];
        }

        return [
            'valid' => true,
            'message' => null,
            'kecamatan' => $kecamatan,
        ];
    }

    /**
     * Get Surabaya bounding box coordinates.
     *
     * @return array{minLat: float, maxLat: float, minLng: float, maxLng: float}
     */
    public static function getBoundingBox(): array
    {
        return [
            'minLat' => self::SURABAYA_MIN_LAT,
            'maxLat' => self::SURABAYA_MAX_LAT,
            'minLng' => self::SURABAYA_MIN_LNG,
            'maxLng' => self::SURABAYA_MAX_LNG,
        ];
    }

    /**
     * Calculate the distance in meters between two coordinates.
     * Uses Haversine formula.
     *
     * @param  float  $lat1
     * @param  float  $lng1
     * @param  float  $lat2
     * @param  float  $lng2
     * @return float Distance in meters
     */
    public static function calculateDistance(
        float $lat1,
        float $lng1,
        float $lat2,
        float $lng2
    ): float {
        $earthRadius = 6371000; // meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }

    /**
     * Check if a coordinate is within a radius of another coordinate.
     *
     * @param  float  $centerLat
     * @param  float  $centerLng
     * @param  float  $pointLat
     * @param  float  $pointLng
     * @param  float  $radiusMeters
     * @return bool
     */
    public static function isWithinRadius(
        float $centerLat,
        float $centerLng,
        float $pointLat,
        float $pointLng,
        float $radiusMeters
    ): bool {
        $distance = self::calculateDistance($centerLat, $centerLng, $pointLat, $pointLng);

        return $distance <= $radiusMeters;
    }

    /**
     * Get center point of Surabaya (approximate).
     *
     * @return array{lat: float, lng: float}
     */
    public static function getSurabayaCenter(): array
    {
        return [
            'lat' => -7.2575, // Surabaya city center
            'lng' => 112.7388,
        ];
    }

    /**
     * Validate coordinates format.
     *
     * @param  float  $latitude
     * @param  float  $longitude
     * @return array{valid: bool, message: string|null}
     */
    public static function validateCoordinateFormat(float $latitude, float $longitude): array
    {
        // Latitude must be between -90 and 90
        if ($latitude < -90 || $latitude > 90) {
            return [
                'valid' => false,
                'message' => 'Latitude harus berada dalam rentang -90 hingga 90 derajat.',
            ];
        }

        // Longitude must be between -180 and 180
        if ($longitude < -180 || $longitude > 180) {
            return [
                'valid' => false,
                'message' => 'Longitude harus berada dalam rentang -180 hingga 180 derajat.',
            ];
        }

        return [
            'valid' => true,
            'message' => null,
        ];
    }
}

