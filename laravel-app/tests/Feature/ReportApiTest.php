<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportApiTest extends TestCase
{
    use RefreshDatabase;

    private User $warga;
    private User $petugas;
    private User $admin;
    private Kelurahan $kelurahan;
    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kelurahan = Kelurahan::create([
            'name' => 'Genteng',
            'kecamatan' => 'Genteng',
            'kota' => 'Surabaya',
            'centroid_lat' => -7.2575,
            'centroid_lng' => 112.7400,
        ]);

        $this->category = Category::create([
            'name' => 'Infrastruktur',
            'type' => 'INFRASTRUKTUR',
            'icon' => '🏗️',
            'description' => 'Jalan rusak',
            'base_score' => 40,
        ]);

        $this->warga = User::create([
            'name' => 'Warga Surabaya',
            'email' => 'warga@example.com',
            'password' => 'password123',
            'role' => 'WARGA',
            'kelurahan_id' => $this->kelurahan->id,
        ]);

        $this->petugas = User::create([
            'name' => 'Petugas Lapangan',
            'email' => 'petugas@example.com',
            'password' => 'password123',
            'role' => 'PETUGAS',
        ]);

        $this->admin = User::create([
            'name' => 'Administrator',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'ADMIN',
        ]);
    }

    public function test_guest_cannot_create_report(): void
    {
        $response = $this->postJson('/api/reports', [
            'title' => 'Laporan uji coba guest',
            'description' => 'Deskripsi laporan ini dibuat oleh guest tanpa autentikasi.',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2575,
            'longitude' => 112.7400,
        ]);

        $response->assertStatus(401);
    }

    public function test_cannot_create_report_outside_surabaya(): void
    {
        // Jakarta coordinates
        $response = $this->actingAs($this->warga)->postJson('/api/reports', [
            'title' => 'Jalan Rusak di Luar Surabaya',
            'description' => 'Laporan dengan titik koordinat Monas Jakarta.',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -6.1754,
            'longitude' => 106.8272,
        ]);

        $response->assertStatus(400);
        $response->assertJson([
            'message' => 'Koordinat lokasi laporan berada di luar cakupan wilayah Surabaya. Silakan pilih titik lokasi di dalam area Surabaya.',
        ]);
    }

    public function test_can_create_report_inside_surabaya(): void
    {
        // Surabaya coordinates (Tunjungan / Genteng)
        $response = $this->actingAs($this->warga)->postJson('/api/reports', [
            'title' => 'Aspal amblas parah membahayakan pengendara motor',
            'description' => 'Lubang amblas sangat parah dan gawat darurat ada korban terjatuh.',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2575,
            'longitude' => 112.7400,
            'address' => 'Jl. Tunjungan No. 12',
            'kelurahanId' => $this->kelurahan->id,
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'report' => [
                'id',
                'title',
                'category',
                'status',
                'latitude',
                'longitude',
                'skorUrgensi',
                'urgensiKeywords',
                'urgencyLevel',
            ],
        ]);

        $data = $response->json('report');
        $this->assertEquals('BARU', $data['status']);
        $this->assertEquals('kritis', $data['urgencyLevel']);
        $this->assertGreaterThanOrEqual(80, $data['skorUrgensi']);
        $this->assertContains('parah', $data['urgensiKeywords']);
    }

    public function test_warga_cannot_update_status_but_petugas_can(): void
    {
        $report = Report::create([
            'title' => 'Lampu jalan mati',
            'description' => 'Sudah tiga hari lampu jalan mati di depan gang.',
            'category' => 'INFRASTRUKTUR',
            'status' => 'BARU',
            'latitude' => -7.2575,
            'longitude' => 112.7400,
            'user_id' => $this->warga->id,
            'kelurahan_id' => $this->kelurahan->id,
            'skor_urgensi' => 50,
        ]);

        // 1. Warga mencoba update status -> Ditolak (403)
        $responseWarga = $this->actingAs($this->warga)->patchJson("/api/reports/{$report->id}/status", [
            'status' => 'DIPROSES',
            'note' => 'Coba ubah status sendiri',
        ]);
        $responseWarga->assertStatus(403);

        // 2. Petugas mencoba update status -> Berhasil (200)
        $responsePetugas = $this->actingAs($this->petugas)->patchJson("/api/reports/{$report->id}/status", [
            'status' => 'DIPROSES',
            'note' => 'Petugas teknis meluncur ke lokasi',
        ]);
        $responsePetugas->assertStatus(200);
        $responsePetugas->assertJsonPath('report.status', 'DIPROSES');

        $this->assertDatabaseHas('status_logs', [
            'report_id' => $report->id,
            'to_status' => 'DIPROSES',
            'changed_by_id' => $this->petugas->id,
        ]);
    }

    public function test_only_owner_or_admin_can_delete_report(): void
    {
        $report = Report::create([
            'title' => 'Sampah menumpuk di selokan',
            'description' => 'Sampah bau menyengat mengganggu warga.',
            'category' => 'KEBERSIHAN',
            'status' => 'BARU',
            'latitude' => -7.2575,
            'longitude' => 112.7400,
            'user_id' => $this->warga->id,
            'skor_urgensi' => 45,
        ]);

        $otherWarga = User::create([
            'name' => 'Warga Lain',
            'email' => 'lain@example.com',
            'password' => 'secret123',
            'role' => 'WARGA',
        ]);

        // Warga lain tidak bisa hapus (403)
        $this->actingAs($otherWarga)->deleteJson("/api/reports/{$report->id}")
            ->assertStatus(403);

        // Pemilik laporan bisa hapus (200)
        $this->actingAs($this->warga)->deleteJson("/api/reports/{$report->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('reports', ['id' => $report->id]);
    }

    public function test_viewport_and_stats_endpoints(): void
    {
        Report::create([
            'title' => 'Laporan uji coba statistik',
            'description' => 'Genangan air setinggi 30cm saat hujan lebat.',
            'category' => 'BANJIR',
            'status' => 'BARU',
            'latitude' => -7.2575,
            'longitude' => 112.7400,
            'user_id' => $this->warga->id,
            'kelurahan_id' => $this->kelurahan->id,
            'skor_urgensi' => 75,
        ]);

        // GET /api/reports/viewport
        $viewportRes = $this->getJson('/api/reports/viewport');
        $viewportRes->assertStatus(200);
        $viewportRes->assertJsonStructure(['reports', 'count']);

        // GET /api/kelurahans
        $kelurahansRes = $this->getJson('/api/kelurahans');
        $kelurahansRes->assertStatus(200);
        $kelurahansRes->assertJsonStructure(['kelurahans']);

        // GET /api/stats/overview
        $overviewRes = $this->getJson('/api/stats/overview');
        $overviewRes->assertStatus(200);
        $overviewRes->assertJsonStructure(['total', 'baru', 'diproses', 'selesai', 'highUrgency', 'byDay']);

        // GET /api/stats/leaderboard
        $leaderboardRes = $this->getJson('/api/stats/leaderboard');
        $leaderboardRes->assertStatus(200);
        $leaderboardRes->assertJsonStructure(['leaderboard']);
    }
}
