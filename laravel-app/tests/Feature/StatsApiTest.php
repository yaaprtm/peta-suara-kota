<?php

namespace Tests\Feature;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\ReportRepositoryInterface;
use Tests\TestCase;

class StatsApiTest extends TestCase
{
    private ReportRepositoryInterface $reportRepo;

    protected function setUp(): void
    {
        parent::setUp();
        $this->reportRepo = app(ReportRepositoryInterface::class);

        // Buat beberapa laporan untuk menguji counter & stats
        $this->reportRepo->create([
            'title' => 'Laporan 1',
            'category' => 'INFRASTRUKTUR',
            'status' => 'BARU',
            'skor_urgensi' => 80,
            'kecamatan' => 'Genteng',
            'kelurahan_id' => '1',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
        ]);

        $this->reportRepo->create([
            'title' => 'Laporan 2',
            'category' => 'BANJIR',
            'status' => 'SELESAI',
            'skor_urgensi' => 40,
            'kecamatan' => 'Gubeng',
            'kelurahan_id' => '2',
            'latitude' => -7.2700,
            'longitude' => 112.7600,
        ]);
    }

    public function test_stats_overview(): void
    {
        $response = $this->getJson('/api/stats/overview');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control', 'max-age=20, public, s-maxage=20')
            ->assertJsonStructure([
                'total',
                'baru',
                'diproses',
                'selesai',
                'highUrgency',
                'byDay' => [
                    '*' => ['date', 'count'],
                ],
            ]);

        $this->assertGreaterThanOrEqual(2, $response->json('total'));
    }

    public function test_stats_leaderboard(): void
    {
        $response = $this->getJson('/api/stats/leaderboard');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control', 'max-age=20, public, s-maxage=20')
            ->assertJsonStructure([
                'leaderboard' => [
                    '*' => [
                        'kelurahan' => ['id', 'name', 'kecamatan', 'kota'],
                        'totalReports',
                        'resolvedReports',
                        'resolutionRate',
                        'score',
                    ],
                ],
            ]);
    }

    public function test_stats_kecamatan_density(): void
    {
        $response = $this->getJson('/api/stats/kecamatan-density');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control', 'max-age=20, public, s-maxage=20')
            ->assertJsonStructure([
                'density',
                'maxTotal',
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('maxTotal'));
    }
}
