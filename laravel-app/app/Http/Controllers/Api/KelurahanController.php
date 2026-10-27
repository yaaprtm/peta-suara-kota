<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelurahan;
use Illuminate\Http\JsonResponse;

class KelurahanController extends Controller
{
    /**
     * GET /api/kelurahans
     */
    public function index(): JsonResponse
    {
        $kelurahans = Kelurahan::withCount('reports')
            ->orderBy('kecamatan', 'asc')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function ($k) {
                return [
                    'id' => $k->id,
                    'name' => $k->name,
                    'kecamatan' => $k->kecamatan,
                    'kota' => $k->kota,
                    'centroidLat' => (float) $k->centroid_lat,
                    'centroidLng' => (float) $k->centroid_lng,
                    '_count' => [
                        'reports' => (int) $k->reports_count,
                    ],
                ];
            });

        return response()->json([
            'kelurahans' => $kelurahans,
        ]);
    }

    /**
     * GET /api/kelurahans/{id}
     */
    public function show(string $id): JsonResponse
    {
        $k = Kelurahan::withCount('reports')->find($id);

        if (!$k) {
            return response()->json(['message' => 'Kelurahan tidak ditemukan'], 404);
        }

        return response()->json([
            'kelurahan' => [
                'id' => $k->id,
                'name' => $k->name,
                'kecamatan' => $k->kecamatan,
                'kota' => $k->kota,
                'centroidLat' => (float) $k->centroid_lat,
                'centroidLng' => (float) $k->centroid_lng,
                '_count' => [
                    'reports' => (int) $k->reports_count,
                ],
            ],
        ]);
    }

    /**
     * GET /api/kelurahans/geo/bounds
     * 
     * Get Surabaya city bounding box and center coordinates
     */
    public function geoBounds(): JsonResponse
    {
        return response()->json([
            'bounds' => \App\Services\GeofenceValidator::getBoundingBox(),
            'center' => \App\Services\GeofenceValidator::getSurabayaCenter(),
        ]);
    }
}
