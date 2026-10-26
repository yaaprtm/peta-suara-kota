<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\StatusLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EndToEndIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private Kelurahan $kelurahan;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kelurahan = Kelurahan::create([
            'name' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kota' => 'Surabaya',
            'centroid_lat' => -7.2750,
            'centroid_lng' => 112.7550,
        ]);

        $this->category = Category::create([
            'name' => 'Banjir & Genangan',
            'type' => 'BANJIR',
            'icon' => '🌊',
            'description' => 'Genangan air dan banjir',
            'base_score' => 50,
        ]);
    }

    /**
     * Skenario 1: Full Lifecycle Laporan Warga hingga Penanganan Petugas
     */
    public function test_full_report_lifecycle_from_citizen_to_officer(): void
    {
        // 1. Warga Register
        $citizenPayload = [
            'name' => 'Aditya Pratama',
            'email' => 'aditya.citizen.' . uniqid() . '@surabaya.go.id',
            'password' => 'SurabayaAman2026!',
            'phone' => '081299887766',
            'kelurahanId' => $this->kelurahan->id,
        ];

        $registerRes = $this->postJson('/api/auth/register', $citizenPayload);
        $registerRes->assertStatus(201);
        $registerRes->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role'],
            'accessToken',
            'refreshToken',
        ]);

        $citizenToken = $registerRes->json('accessToken');
        $citizenId = $registerRes->json('user.id');

        // 2. Warga Login via API
        $loginRes = $this->postJson('/api/auth/login', [
            'email' => $citizenPayload['email'],
            'password' => $citizenPayload['password'],
        ]);
        $loginRes->assertStatus(200);

        // 3. Warga Mengirim Laporan Kritis Banjir di Surabaya (Gubeng)
        $reportPayload = [
            'title' => 'Banjir parah sedada orang dewasa merendam jalan protokol dan rumah warga',
            'description' => 'Listrik padam air semakin tinggi berbahaya bagi lansia dan anak kecil',
            'categoryId' => $this->category->id,
            'kelurahanId' => $this->kelurahan->id,
            'latitude' => -7.2750,
            'longitude' => 112.7550,
        ];

        $createReportRes = $this->withHeader('Authorization', "Bearer {$citizenToken}")
            ->postJson('/api/reports', $reportPayload);

        $createReportRes->assertStatus(201);
        $reportData = $createReportRes->json('report');

        // Verifikasi Skor Urgensi otomatis tinggi (NLP) & Geofencing Kecamatan
        $this->assertGreaterThanOrEqual(70, $reportData['skorUrgensi']);
        $this->assertEquals('Gubeng', $reportData['kecamatan']);
        $this->assertEquals('BARU', $reportData['status']);
        $this->assertEquals($citizenId, $reportData['userId']);

        $reportId = $reportData['id'];

        // Verifikasi StatusLog awal dibuat
        $this->assertDatabaseHas('status_logs', [
            'report_id' => $reportId,
            'to_status' => 'BARU',
        ]);

        // 4. Petugas Login
        $officer = User::create([
            'name' => 'Petugas Tanggap Darurat',
            'email' => 'petugas.e2e@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'PETUGAS',
            'kelurahan_id' => $this->kelurahan->id,
        ]);

        $officerLoginRes = $this->postJson('/api/auth/login', [
            'email' => $officer->email,
            'password' => 'password123',
        ]);
        $officerLoginRes->assertStatus(200);
        $officerToken = $officerLoginRes->json('accessToken');

        // 5. Petugas Melihat Laporan di Viewport
        $viewportRes = $this->getJson('/api/reports/viewport?bbox=112.7,-7.3,112.8,-7.2&zoom=14');
        $viewportRes->assertStatus(200);
        $reportsInViewport = collect($viewportRes->json('reports'));
        $this->assertTrue($reportsInViewport->contains('id', $reportId));

        // 6. Petugas Mengubah Status menjadi DIPROSES
        $updateDiprosesRes = $this->withHeader('Authorization', "Bearer {$officerToken}")
            ->patchJson("/api/reports/{$reportId}/status", [
                'status' => 'DIPROSES',
                'note' => 'Tim SAR dan BPBD diterjunkan membawa perahu karet dan pompa air portabel.',
            ]);

        $updateDiprosesRes->assertStatus(200);
        $this->assertEquals('DIPROSES', $updateDiprosesRes->json('report.status'));

        // 7. Petugas Mengubah Status menjadi SELESAI
        $updateSelesaiRes = $this->withHeader('Authorization', "Bearer {$officerToken}")
            ->patchJson("/api/reports/{$reportId}/status", [
                'status' => 'SELESAI',
                'note' => 'Pompa aktif menguras air dan genangan telah surut total.',
            ]);

        $updateSelesaiRes->assertStatus(200);
        $this->assertEquals('SELESAI', $updateSelesaiRes->json('report.status'));

        // 8. Cek Riwayat StatusLog di Endpoint Detail Laporan
        $detailRes = $this->getJson("/api/reports/{$reportId}");
        $detailRes->assertStatus(200);
        $logs = $detailRes->json('report.statusLogs');

        $this->assertNotEmpty($logs);
        $statuses = array_column($logs, 'toStatus');
        $this->assertContains('DIPROSES', $statuses);
        $this->assertContains('SELESAI', $statuses);
    }

    /**
     * Skenario 2: Validasi Statistik Overview & Leaderboard
     */
    public function test_stats_overview_and_leaderboard_accuracy(): void
    {
        $user = User::create([
            'name' => 'Warga Pelapor',
            'email' => 'warga.stats@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'WARGA',
        ]);

        Report::create([
            'title' => 'Saluran Mampet di Gubeng',
            'description' => 'Saluran air tersumbat sampah plastik',
            'category' => 'KEBERSIHAN',
            'latitude' => -7.2750,
            'longitude' => 112.7550,
            'status' => 'BARU',
            'skor_urgensi' => 45,
            'tingkat_urgensi' => 'sedang',
            'kecamatan' => 'Gubeng',
            'kelurahan_id' => $this->kelurahan->id,
            'user_id' => $user->id,
        ]);

        $overviewRes = $this->getJson('/api/stats/overview');
        $overviewRes->assertStatus(200);
        $overviewRes->assertJsonStructure([
            'total',
            'baru',
            'diproses',
            'selesai',
            'highUrgency',
            'byDay',
        ]);
        $this->assertEquals(1, $overviewRes->json('total'));
        $this->assertEquals(1, $overviewRes->json('baru'));

        $leaderboardRes = $this->getJson('/api/stats/leaderboard');
        $leaderboardRes->assertStatus(200);
        $leaderboardRes->assertJsonStructure([
            'leaderboard',
        ]);
        $this->assertIsArray($leaderboardRes->json('leaderboard'));
    }

    /**
     * Skenario 3: Hak Akses Role (Warga Tidak Boleh Update Status Laporan)
     */
    public function test_citizen_cannot_update_report_status(): void
    {
        $citizen = User::create([
            'name' => 'Warga Biasa',
            'email' => 'warga.biasa@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'WARGA',
        ]);

        $report = Report::create([
            'title' => 'Lampu Jalan Mati',
            'description' => 'Lampu PJU padam di malam hari',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2750,
            'longitude' => 112.7550,
            'status' => 'BARU',
            'skor_urgensi' => 40,
            'tingkat_urgensi' => 'sedang',
            'user_id' => $citizen->id,
        ]);

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => $citizen->email,
            'password' => 'password123',
        ]);
        $token = $loginRes->json('accessToken');

        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->patchJson("/api/reports/{$report->id}/status", [
                'status' => 'SELESAI',
                'note' => 'Hacker attempt',
            ]);

        // Harus ditolak (403 Forbidden)
        $res->assertStatus(403);
    }

    /**
     * Skenario 4: Validasi Titik di Luar Kota Surabaya
     */
    public function test_reject_or_warn_coordinates_outside_surabaya(): void
    {
        $user = User::create([
            'name' => 'User Geofence Test',
            'email' => 'user.geofence@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'WARGA',
        ]);

        $loginRes = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        $token = $loginRes->json('accessToken');

        // Titik Monas Jakarta (106.8272, -6.1754)
        $res = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/reports', [
                'title' => 'Laporan di luar kota Surabaya',
                'description' => 'Koordinat berada di Jakarta Monas',
                'categoryId' => $this->category->id,
                'kelurahanId' => $this->kelurahan->id,
                'latitude' => -6.1754,
                'longitude' => 106.8272,
            ]);

        // Sistem geofencing harus memvalidasi batas koordinat Surabaya
        $res->assertStatus(400);
        $res->assertJson([
            'message' => 'Koordinat lokasi laporan berada di luar cakupan wilayah Surabaya. Silakan pilih titik lokasi di dalam area Surabaya.',
        ]);
    }
}
