<?php

namespace Tests\Feature;

use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * F02: LIKE wildcard di track() + tanpa throttle
 */
class SecurityF02Test extends TestCase
{
    use RefreshDatabase;

    private User $warga;
    private Kelurahan $kelurahan;

    protected function setUp(): void
    {
        parent::setUp();
        $this->kelurahan = Kelurahan::create([
            'name' => 'Genteng', 'kecamatan' => 'Genteng',
            'kota' => 'Surabaya', 'centroid_lat' => -7.2575, 'centroid_lng' => 112.74,
        ]);
        $this->warga = User::create([
            'name' => 'Warga Test', 'email' => 'warga@test.com',
            'password' => 'pass', 'role' => 'WARGA', 'is_active' => true,
        ]);
    }

    public function test_track_exact_match_works(): void
    {
        $report = Report::create([
            'title' => 'Laporan exact match',
            'description' => 'Deskripsi laporan test untuk exact match tracking code',
            'category' => 'LAINNYA', 'status' => 'BARU',
            'latitude' => -7.2575, 'longitude' => 112.74,
            'user_id' => $this->warga->id, 'skor_urgensi' => 20,
        ]);

        $this->getJson("/api/reports/track/{$report->tracking_code}")
            ->assertStatus(200)
            ->assertJsonPath('report.id', $report->id);
    }

    public function test_track_does_not_return_report_for_single_char_wildcard(): void
    {
        // Buat laporan sehingga ada tracking_code yang mengandung "P" (semua PSK-)
        Report::create([
            'title' => 'Laporan wildcard test untuk verifikasi keamanan',
            'description' => 'Deskripsi laporan yang cukup panjang untuk minimum validasi sistem',
            'category' => 'LAINNYA', 'status' => 'BARU',
            'latitude' => -7.2575, 'longitude' => 112.74,
            'user_id' => $this->warga->id, 'skor_urgensi' => 20,
        ]);

        // LIKE '%P%' seharusnya TIDAK mengembalikan laporan (semua kode PSK- mengandung P)
        // Setelah perbaikan, harus 404
        $this->getJson('/api/reports/track/P')
            ->assertStatus(404);
    }

    public function test_track_does_not_expose_reports_via_partial_code(): void
    {
        Report::create([
            'title' => 'Laporan partial match test keamanan sistem',
            'description' => 'Deskripsi laporan yang cukup panjang untuk minimum validasi laravel',
            'category' => 'LAINNYA', 'status' => 'BARU',
            'latitude' => -7.2575, 'longitude' => 112.74,
            'user_id' => $this->warga->id, 'skor_urgensi' => 20,
        ]);

        // Semua tracking_code dimulai dengan "PSK-" — partial "PSK" seharusnya 404
        $this->getJson('/api/reports/track/PSK')
            ->assertStatus(404);
    }

    public function test_track_nonexistent_code_returns_404(): void
    {
        $this->getJson('/api/reports/track/PSK-TIDAK-ADA-SAMA-SEKALI')
            ->assertStatus(404);
    }
}
