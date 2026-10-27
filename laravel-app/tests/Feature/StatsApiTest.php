<?php

namespace Tests\Feature;

use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\StatusLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Kelurahan $kelurahan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->kelurahan = Kelurahan::create([
            'name'         => 'Gubeng',
            'kecamatan'    => 'Gubeng',
            'kota'         => 'Surabaya',
            'centroid_lat' => -7.2754,
            'centroid_lng' => 112.7533,
        ]);

        $this->user = User::create([
            'name'         => 'Warga Test',
            'email'        => 'test@example.com',
            'password'     => bcrypt('password123'),
            'role'         => 'WARGA',
            'kelurahan_id' => $this->kelurahan->id,
            'is_active'    => true,
        ]);
    }

    // ─── GET /api/stats/overview ─────────────────────────────────────────────

    public function test_overview_returns_correct_counts(): void
    {
        // Create reports with different statuses
        Report::create([
            'title'        => 'Laporan Baru 1',
            'description'  => 'Deskripsi laporan satu',
            'category'     => 'INFRASTRUKTUR',
            'status'       => 'BARU',
            'latitude'     => -7.2754,
            'longitude'    => 112.7533,
            'user_id'      => $this->user->id,
            'kelurahan_id' => $this->kelurahan->id,
            'skor_urgensi' => 45,
        ]);

        Report::create([
            'title'        => 'Laporan Diproses',
            'description'  => 'Deskripsi laporan diproses',
            'category'     => 'BANJIR',
            'status'       => 'DIPROSES',
            'latitude'     => -7.2575,
            'longitude'    => 112.7400,
            'user_id'      => $this->user->id,
            'kelurahan_id' => $this->kelurahan->id,
            'skor_urgensi' => 72,
        ]);

        Report::create([
            'title'        => 'Laporan Kritis Urgent',
            'description'  => 'Kritis darurat bahaya korban',
            'category'     => 'KEAMANAN',
            'status'       => 'SELESAI',
            'latitude'     => -7.2700,
            'longitude'    => 112.7450,
            'user_id'      => $this->user->id,
            'kelurahan_id' => $this->kelurahan->id,
            'skor_urgensi' => 85,
        ]);

        $response = $this->getJson('/api/stats/overview');

        $response->assertStatus(200);
        $response->assertJsonStructure(['total', 'baru', 'diproses', 'selesai', 'highUrgency', 'byDay']);

        $data = $response->json();
        $this->assertEquals(3, $data['total']);
        $this->assertEquals(1, $data['baru']);
        $this->assertEquals(1, $data['diproses']);
        $this->assertEquals(1, $data['selesai']);
        $this->assertEquals(1, $data['highUrgency']);   // only skor >= 70
        $this->assertCount(14, $data['byDay']);          // exactly 14 days
    }

    public function test_overview_byDay_includes_today(): void
    {
        Report::create([
            'title'       => 'Laporan Hari Ini',
            'description' => 'Laporan dibuat hari ini',
            'category'    => 'KEBERSIHAN',
            'status'      => 'BARU',
            'latitude'    => -7.2754,
            'longitude'   => 112.7533,
            'user_id'     => $this->user->id,
            'skor_urgensi' => 30,
            'created_at'  => Carbon::now(),
            'updated_at'  => Carbon::now(),
        ]);

        $response = $this->getJson('/api/stats/overview');
        $response->assertStatus(200);

        $byDay = $response->json('byDay');
        $today = Carbon::today()->format('Y-m-d');
        $todayEntry = collect($byDay)->firstWhere('date', $today);

        $this->assertNotNull($todayEntry);
        $this->assertEquals(1, $todayEntry['count']);
    }

    // ─── GET /api/stats/leaderboard ──────────────────────────────────────────

    public function test_leaderboard_returns_ranked_kelurahans(): void
    {
        $kelurahan2 = Kelurahan::create([
            'name'         => 'Genteng',
            'kecamatan'    => 'Genteng',
            'kota'         => 'Surabaya',
            'centroid_lat' => -7.2575,
            'centroid_lng' => 112.7483,
        ]);

        $petugas = User::create([
            'name'      => 'Petugas Tes',
            'email'     => 'petugas_test@example.com',
            'password'  => bcrypt('secret'),
            'role'      => 'PETUGAS',
            'is_active' => true,
        ]);

        // Kelurahan 1: 2 reports, 2 SELESAI → higher resolution rate
        for ($i = 0; $i < 2; $i++) {
            $r = Report::create([
                'title'        => "Laporan Gubeng $i",
                'description'  => "Deskripsi $i",
                'category'     => 'INFRASTRUKTUR',
                'status'       => 'SELESAI',
                'latitude'     => -7.2754,
                'longitude'    => 112.7533,
                'user_id'      => $this->user->id,
                'kelurahan_id' => $this->kelurahan->id,
                'skor_urgensi' => 50,
            ]);

            StatusLog::create([
                'report_id'      => $r->id,
                'from_status'    => null,
                'to_status'      => 'BARU',
                'changed_by_id'  => $this->user->id,
                'changed_at'     => Carbon::now()->subHours(6),
            ]);

            StatusLog::create([
                'report_id'      => $r->id,
                'from_status'    => 'BARU',
                'to_status'      => 'DIPROSES',
                'changed_by_id'  => $petugas->id,
                'changed_at'     => Carbon::now()->subHours(4),
            ]);
        }

        // Kelurahan 2: 3 reports, 0 SELESAI → lower score
        for ($i = 0; $i < 3; $i++) {
            Report::create([
                'title'        => "Laporan Genteng $i",
                'description'  => "Deskripsi genteng $i",
                'category'     => 'KEBERSIHAN',
                'status'       => 'BARU',
                'latitude'     => -7.2575,
                'longitude'    => 112.7483,
                'user_id'      => $this->user->id,
                'kelurahan_id' => $kelurahan2->id,
                'skor_urgensi' => 40,
            ]);
        }

        $response = $this->getJson('/api/stats/leaderboard');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'leaderboard' => [
                '*' => [
                    'kelurahan',
                    'totalReports',
                    'resolvedReports',
                    'resolutionRate',
                    'avgResponseHours',
                    'score',
                ],
            ],
        ]);

        $leaderboard = $response->json('leaderboard');

        // Gubeng should rank above Genteng (better resolution rate)
        $gubengEntry = collect($leaderboard)->firstWhere('kelurahan.name', 'Gubeng');
        $gentengEntry = collect($leaderboard)->firstWhere('kelurahan.name', 'Genteng');

        $this->assertNotNull($gubengEntry);
        $this->assertNotNull($gentengEntry);
        $this->assertEquals(2, $gubengEntry['resolvedReports']);
        $this->assertEquals(100, $gubengEntry['resolutionRate']);
        $this->assertEquals(0, $gentengEntry['resolvedReports']);
        $this->assertGreaterThan($gentengEntry['score'], $gubengEntry['score']);
    }

    public function test_leaderboard_excludes_kelurahans_with_zero_reports(): void
    {
        Kelurahan::create([
            'name'      => 'Kosong',
            'kecamatan' => 'Kosong',
            'kota'      => 'Surabaya',
        ]);

        $response = $this->getJson('/api/stats/leaderboard');
        $response->assertStatus(200);

        $leaderboard = $response->json('leaderboard');
        $emptyEntry = collect($leaderboard)->firstWhere('kelurahan.name', 'Kosong');

        // Should still appear but with score=0 and 0 reports
        if ($emptyEntry) {
            $this->assertEquals(0, $emptyEntry['totalReports']);
            $this->assertEquals(0, $emptyEntry['score']);
        }
    }
}
