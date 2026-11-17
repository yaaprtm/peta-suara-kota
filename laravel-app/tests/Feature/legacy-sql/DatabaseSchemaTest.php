<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Kelurahan;
use App\Models\Report;
use App\Models\StatusLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_kelurahan_and_user_with_uuid(): void
    {
        $kelurahan = Kelurahan::create([
            'name' => 'Genteng',
            'kecamatan' => 'Genteng',
            'kota' => 'Surabaya',
            'centroid_lat' => -7.2575,
            'centroid_lng' => 112.7400,
        ]);

        $this->assertNotEmpty($kelurahan->id);
        $this->assertEquals(-7.2575, $kelurahan->centroid_lat);

        $user = User::create([
            'name' => 'Ahmad Warga',
            'email' => 'ahmad@example.com',
            'password' => 'secret123',
            'role' => 'WARGA',
            'kelurahan_id' => $kelurahan->id,
        ]);

        $this->assertNotEmpty($user->id);
        $this->assertTrue($user->isWarga());
        $this->assertEquals('Genteng', $user->kelurahan->name);
    }

    public function test_can_create_report_with_relations_and_casts(): void
    {
        $kelurahan = Kelurahan::create([
            'name' => 'Darmo',
            'kecamatan' => 'Wonokromo',
            'kota' => 'Surabaya',
            'centroid_lat' => -7.2910,
            'centroid_lng' => 112.7350,
        ]);

        $user = User::create([
            'name' => 'Budi Pelapor',
            'email' => 'budi@example.com',
            'password' => 'secret123',
            'role' => 'WARGA',
            'kelurahan_id' => $kelurahan->id,
        ]);

        $category = Category::create([
            'name' => 'Infrastruktur',
            'type' => 'INFRASTRUKTUR',
            'icon' => '🏗️',
            'description' => 'Jalan rusak',
            'base_score' => 40,
        ]);

        $report = Report::create([
            'title' => 'Aspal amblas parah di Raya Darmo',
            'description' => 'Ada lubang sedalam 20cm membahayakan pengendara motor.',
            'category' => 'INFRASTRUKTUR',
            'status' => 'BARU',
            'latitude' => -7.2915,
            'longitude' => 112.7355,
            'address' => 'Jl. Raya Darmo',
            'kelurahan_id' => $kelurahan->id,
            'kecamatan' => 'Wonokromo',
            'skor_urgensi' => 85,
            'urgensi_keywords' => ['amblas', 'motor jatuh', 'kritis'],
            'photos' => ['/storage/photos/sample.jpg'],
            'user_id' => $user->id,
            'category_id' => $category->id,
        ]);

        $this->assertNotEmpty($report->id);
        $this->assertEquals('kritis', $report->urgency_level);
        $this->assertIsArray($report->urgensi_keywords);
        $this->assertCount(3, $report->urgensi_keywords);
        $this->assertEquals($user->name, $report->user->name);
        $this->assertEquals($category->name, $report->categoryRef->name);

        $statusLog = StatusLog::create([
            'report_id' => $report->id,
            'from_status' => 'BARU',
            'to_status' => 'DIPROSES',
            'note' => 'Petugas sedang menuju lokasi.',
            'changed_by_id' => $user->id,
        ]);

        $this->assertNotEmpty($statusLog->id);
        $this->assertCount(1, $report->statusLogs);
        $this->assertEquals('DIPROSES', $report->statusLogs->first()->to_status);
    }
}
