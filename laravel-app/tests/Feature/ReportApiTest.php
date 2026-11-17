<?php

namespace Tests\Feature;

use App\Contracts\Repositories\ReportRepositoryInterface;
use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    private string $wargaToken;
    private string $petugasToken;
    private array $warga;
    private array $petugas;
    private ReportRepositoryInterface $reportRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $userRepo = app(UserRepositoryInterface::class);
        $tokenRepo = app(TokenRepositoryInterface::class);
        $this->reportRepo = app(ReportRepositoryInterface::class);

        $this->warga = $userRepo->create([
            'name' => 'Warga Test',
            'email' => 'warga.report@example.com',
            'password' => Hash::make('password123'),
            'role' => 'WARGA',
            'is_active' => true,
        ]);

        $this->petugas = $userRepo->create([
            'name' => 'Petugas Test',
            'email' => 'petugas.report@example.com',
            'password' => Hash::make('password123'),
            'role' => 'PETUGAS',
            'is_active' => true,
        ]);

        $this->wargaToken = $tokenRepo->createToken($this->warga['id'], 'warga-token');
        $this->petugasToken = $tokenRepo->createToken($this->petugas['id'], 'petugas-token');
    }

    public function test_can_create_report(): void
    {
        $payload = [
            'title' => 'Jalan Rusak Berlubang',
            'description' => 'Ada lubang besar di dekat lampu merah yang membahayakan pengendara',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
            'address' => 'Jl. Pemuda No. 1, Genteng',
            'kelurahanId' => '1',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->wargaToken)
            ->postJson('/api/reports', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'report' => [
                    'id',
                    'trackingCode',
                    'title',
                    'status',
                    'latitude',
                    'longitude',
                    'skorUrgensi',
                    'statusLogs',
                ],
            ]);

        $this->assertEquals('BARU', $response->json('report.status'));
        $this->assertEquals(-7.2600, $response->json('report.latitude'));
    }

    public function test_reject_report_outside_surabaya(): void
    {
        $payload = [
            'title' => 'Laporan di Luar Surabaya',
            'description' => 'Lokasi laporan ada di Jakarta Pusat',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'address' => 'Jakarta',
        ];

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->wargaToken)
            ->postJson('/api/reports', $payload);

        $response->assertStatus(400);
    }

    public function test_can_query_viewport(): void
    {
        // Buat satu laporan di area Surabaya Pusat
        $this->reportRepo->create([
            'title' => 'Genangan Depan Balai Pemuda',
            'category' => 'BANJIR',
            'latitude' => -7.2630,
            'longitude' => 112.7430,
            'status' => 'BARU',
            'skor_urgensi' => 50,
        ]);

        $response = $this->getJson('/api/reports/viewport?bbox=112.70,-7.30,112.80,-7.20');

        $response->assertStatus(200)
            ->assertHeader('Cache-Control', 'max-age=20, public, s-maxage=20')
            ->assertJsonStructure([
                'reports',
                'count',
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('count'));
    }

    public function test_can_query_nearby(): void
    {
        $this->reportRepo->create([
            'title' => 'Lampu Jalan Padam',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2650,
            'longitude' => 112.7450,
            'status' => 'BARU',
        ]);

        $response = $this->getJson('/api/reports/nearby?lat=-7.2655&lng=112.7455&radius=1.0');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'reports' => [
                    '*' => ['id', 'title', 'distanceKm'],
                ],
                'count',
                'radiusKm',
            ]);

        $this->assertGreaterThanOrEqual(1, $response->json('count'));
    }

    public function test_can_upvote_report(): void
    {
        $report = $this->reportRepo->create([
            'title' => 'Trotoar Ambles',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
        ]);

        $response = $this->withHeader('Authorization', 'Bearer ' . $this->wargaToken)
            ->postJson("/api/reports/{$report['id']}/upvote");

        $response->assertStatus(200)
            ->assertJsonPath('upvotesCount', 1);
    }

    public function test_petugas_can_update_status(): void
    {
        $report = $this->reportRepo->create([
            'title' => 'Sampah Menumpuk di Pasar',
            'category' => 'KEBERSIHAN',
            'status' => 'BARU',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
        ]);

        // 1. Update ke DIPROSES
        $response1 = $this->withHeader('Authorization', 'Bearer ' . $this->petugasToken)
            ->patchJson("/api/reports/{$report['id']}/status", [
                'status' => 'DIPROSES',
                'note' => 'Petugas kebersihan diterjunkan',
            ]);

        $response1->assertStatus(200)
            ->assertJsonPath('report.status', 'DIPROSES');

        // 2. Update ke SELESAI dengan completion note
        $response2 = $this->withHeader('Authorization', 'Bearer ' . $this->petugasToken)
            ->patchJson("/api/reports/{$report['id']}/status", [
                'status' => 'SELESAI',
                'completion_note' => 'Sampah telah diangkut ke TPS Benowo',
            ]);

        $response2->assertStatus(200)
            ->assertJsonPath('report.status', 'SELESAI');
    }

    public function test_can_track_report_publicly(): void
    {
        $report = $this->reportRepo->create([
            'title' => 'Saluran Air Buntu',
            'category' => 'BANJIR',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
        ]);

        $code = $report['tracking_code'];
        $response = $this->getJson("/api/reports/track/{$code}");

        $response->assertStatus(200)
            ->assertJsonPath('report.id', $report['id'])
            ->assertJsonPath('report.trackingCode', $code);
    }
}
