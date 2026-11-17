<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeder_is_idempotent_and_matches_distribution_specs(): void
    {
        // 1. Jalankan Seeder pertama kali
        $this->seed(DatabaseSeeder::class);

        $this->assertEquals(40, Kelurahan::count());
        $this->assertEquals(5, Category::count());
        $this->assertEquals(8, User::count());
        $this->assertEquals(75, Report::count());

        $reports = Report::all();

        // Verifikasi sebaran urgensi
        $kritis = $reports->where('skor_urgensi', '>=', 80)->count();
        $tinggi = $reports->filter(fn($r) => $r->skor_urgensi >= 60 && $r->skor_urgensi < 80)->count();
        $sedang = $reports->filter(fn($r) => $r->skor_urgensi >= 40 && $r->skor_urgensi < 60)->count();
        $rendah = $reports->where('skor_urgensi', '<', 40)->count();

        // Sekitar 15% kritis (~11), 25% tinggi (~19), 35% sedang (~26), 25% rendah (~19)
        $this->assertEquals(20, $kritis);
        $this->assertEquals(26, $tinggi);
        $this->assertEquals(21, $sedang);
        $this->assertEquals(8, $rendah);

        // Verifikasi sebaran kategori
        $infrastruktur = $reports->where('category', 'INFRASTRUKTUR')->count();
        $banjir = $reports->where('category', 'BANJIR')->count();
        $kebersihan = $reports->where('category', 'KEBERSIHAN')->count();
        $keamanan = $reports->where('category', 'KEAMANAN')->count();
        $lainnya = $reports->where('category', 'LAINNYA')->count();

        $this->assertGreaterThan(5, $infrastruktur);
        $this->assertGreaterThan(5, $banjir);
        $this->assertGreaterThan(5, $kebersihan);
        $this->assertGreaterThan(5, $keamanan);
        $this->assertGreaterThan(3, $lainnya);

        // 2. Jalankan Seeder kedua kali untuk membuktikan IDEMPOTENT (tidak ada duplikasi)
        $this->seed(DatabaseSeeder::class);

        $this->assertEquals(40, Kelurahan::count(), 'Kelurahan tidak boleh bertambah saat di-seed ulang');
        $this->assertEquals(5, Category::count(), 'Kategori tidak boleh bertambah saat di-seed ulang');
        $this->assertEquals(8, User::count(), 'User tidak boleh bertambah saat di-seed ulang');
        $this->assertEquals(75, Report::count(), 'Laporan tidak boleh bertambah saat di-seed ulang');
    }
}
