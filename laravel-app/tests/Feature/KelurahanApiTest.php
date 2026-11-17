<?php

namespace Tests\Feature;

use Tests\TestCase;

class KelurahanApiTest extends TestCase
{
    public function test_can_list_kelurahans(): void
    {
        $response = $this->getJson('/api/kelurahans');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control', 'max-age=60, public, s-maxage=60')
            ->assertJsonStructure([
                'kelurahans' => [
                    '*' => [
                        'id',
                        'name',
                        'kecamatan',
                        'kota',
                        'centroidLat',
                        'centroidLng',
                        '_count' => ['reports'],
                    ],
                ],
            ]);

        $this->assertGreaterThanOrEqual(140, count($response->json('kelurahans')));
    }

    public function test_can_get_single_kelurahan(): void
    {
        $response = $this->getJson('/api/kelurahans/1');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'kelurahan' => [
                    'id',
                    'name',
                    'kecamatan',
                    'kota',
                    'centroidLat',
                    'centroidLng',
                    '_count' => ['reports'],
                ],
            ]);
    }

    public function test_can_get_geo_bounds(): void
    {
        $response = $this->getJson('/api/kelurahans/geo/bounds');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'bounds' => ['minLat', 'maxLat', 'minLng', 'maxLng'],
                'center' => ['lat', 'lng'],
            ]);
    }
}
