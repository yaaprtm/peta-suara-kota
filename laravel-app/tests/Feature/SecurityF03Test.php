<?php

namespace Tests\Feature;

use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * F03 + FN-07: Upvote tanpa auth + tanpa batas pengulangan
 */
class SecurityF03Test extends TestCase
{
    use RefreshDatabase;

    private User $warga;
    private Report $report;

    protected function setUp(): void
    {
        parent::setUp();
        $kel = Kelurahan::create([
            'name' => 'Genteng', 'kecamatan' => 'Genteng',
            'kota' => 'Surabaya', 'centroid_lat' => -7.2575, 'centroid_lng' => 112.74,
        ]);
        $this->warga = User::create([
            'name' => 'Warga Test', 'email' => 'warga@test.com',
            'password' => 'pass', 'role' => 'WARGA', 'is_active' => true,
        ]);
        $this->report = Report::create([
            'title' => 'Laporan untuk test upvote keamanan',
            'description' => 'Deskripsi laporan test yang cukup panjang untuk minimal validasi',
            'category' => 'LAINNYA', 'status' => 'BARU',
            'latitude' => -7.2575, 'longitude' => 112.74,
            'user_id' => $this->warga->id, 'skor_urgensi' => 20,
            'upvotes_count' => 0,
        ]);
    }

    public function test_guest_cannot_upvote(): void
    {
        // Tanpa auth harus 401
        $this->postJson("/api/reports/{$this->report->id}/upvote")
            ->assertStatus(401);
    }

    public function test_authenticated_user_can_upvote(): void
    {
        $this->actingAs($this->warga)
            ->postJson("/api/reports/{$this->report->id}/upvote")
            ->assertStatus(200)
            ->assertJsonPath('upvotesCount', 1);
    }

    public function test_upvote_count_increments(): void
    {
        $this->actingAs($this->warga)
            ->postJson("/api/reports/{$this->report->id}/upvote")
            ->assertStatus(200);

        $this->report->refresh();
        $this->assertEquals(1, $this->report->upvotes_count);
    }
}
