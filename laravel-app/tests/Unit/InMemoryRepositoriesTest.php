<?php

namespace Tests\Unit;

use App\Repositories\InMemory\InMemoryCounterRepository;
use App\Repositories\InMemory\InMemoryReportRepository;
use App\Repositories\InMemory\InMemoryTokenRepository;
use App\Repositories\InMemory\InMemoryUserRepository;
use App\Repositories\Static\StaticCategoryRepository;
use App\Repositories\Static\StaticKelurahanRepository;
use Tests\TestCase;

class InMemoryRepositoriesTest extends TestCase
{
    public function test_static_category_repository(): void
    {
        $repo = new StaticCategoryRepository();
        $categories = $repo->all();

        $this->assertCount(5, $categories);
        $infra = $repo->findByType('infrastruktur');
        $this->assertNotNull($infra);
        $this->assertEquals('Infrastruktur', $infra['name']);
        $this->assertNull($repo->findByType('tidak_ada'));
    }

    public function test_static_kelurahan_repository(): void
    {
        $repo = new StaticKelurahanRepository();
        $all = $repo->all();

        $this->assertCount(149, $all);

        $genteng = $repo->findByName('Genteng', 'Genteng');
        $this->assertNotNull($genteng);
        $this->assertEquals('Genteng', $genteng['name']);
        $this->assertEquals('Genteng', $genteng['kecamatan']);

        $byCount = $repo->allWithReportCounts([$genteng['id'] => 5]);
        $found = null;
        foreach ($byCount as $item) {
            if ($item['id'] === $genteng['id']) {
                $found = $item;
                break;
            }
        }
        $this->assertNotNull($found);
        $this->assertEquals(5, $found['reports_count']);
    }

    public function test_in_memory_user_repository(): void
    {
        $repo = new InMemoryUserRepository();
        $user = $repo->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@example.com',
            'role' => 'WARGA',
        ]);

        $this->assertNotEmpty($user['id']);
        $this->assertEquals('budi@example.com', $user['email']);

        $found = $repo->findByEmail('BUDI@example.com');
        $this->assertNotNull($found);
        $this->assertEquals($user['id'], $found['id']);

        $updated = $repo->updateRole($user['id'], 'PETUGAS');
        $this->assertEquals('PETUGAS', $updated['role']);

        $toggled = $repo->toggleActive($user['id']);
        $this->assertFalse($toggled['is_active']);

        $list = $repo->list(['search' => 'budi']);
        $this->assertCount(1, $list);
        $this->assertEquals(1, $repo->count());
    }

    public function test_in_memory_token_repository(): void
    {
        $userRepo = new InMemoryUserRepository();
        $user = $userRepo->create([
            'name' => 'Warga Token',
            'email' => 'token@example.com',
        ]);

        $tokenRepo = new InMemoryTokenRepository($userRepo);
        $plaintext = $tokenRepo->createToken($user['id'], 'test-token');

        $this->assertNotEmpty($plaintext);

        $authUser = $tokenRepo->findUserByToken($plaintext);
        $this->assertNotNull($authUser);
        $this->assertEquals($user['id'], $authUser['id']);

        $deleted = $tokenRepo->deleteToken($plaintext);
        $this->assertTrue($deleted);
        $this->assertNull($tokenRepo->findUserByToken($plaintext));
    }

    public function test_in_memory_report_and_counter_repository(): void
    {
        $kelurahanRepo = new StaticKelurahanRepository();
        $counterRepo = new InMemoryCounterRepository($kelurahanRepo);
        $reportRepo = new InMemoryReportRepository([], $counterRepo);

        // Buat laporan baru
        $created = $reportRepo->create([
            'title' => 'Jalan Berlubang di Darmo',
            'description' => 'Ada lubang besar di dekat lampu merah',
            'category' => 'INFRASTRUKTUR',
            'kecamatan' => 'Wonokromo',
            'kelurahan_id' => '1',
            'address' => 'Jl. Raya Darmo',
            'lat' => -7.2890,
            'lng' => 112.7380,
            'skor_urgensi' => 80,
        ]);

        $this->assertNotEmpty($created['id']);
        $this->assertNotEmpty($created['tracking_code']);
        $this->assertEquals('BARU', $created['status']);
        $this->assertCount(1, $created['status_logs']);

        // Cek find
        $found = $reportRepo->findByTrackingCode($created['tracking_code']);
        $this->assertNotNull($found);
        $this->assertEquals($created['id'], $found['id']);

        // Cek counter bertambah
        $stats = $counterRepo->getGlobalStats();
        $this->assertEquals(1, $stats['total']);
        $this->assertEquals(1, $stats['baru']);
        $this->assertEquals(1, $stats['highUrgency']);

        // Cek upvote
        $upvoted = $reportRepo->upvote($created['id']);
        $this->assertEquals(1, $upvoted['upvotes']);

        // Cek nearby haversine
        $nearby = $reportRepo->nearby(-7.2892, 112.7382, 1.0);
        $this->assertCount(1, $nearby);
        $this->assertLessThan(0.1, $nearby[0]['distance_km']);

        // Cek update status ke DIPROSES lalu SELESAI
        $inProcess = $reportRepo->updateStatus($created['id'], 'DIPROSES', 'Petugas meluncur ke lokasi');
        $this->assertEquals('DIPROSES', $inProcess['status']);
        $this->assertCount(2, $inProcess['status_logs']);

        $completed = $reportRepo->updateStatus(
            $created['id'],
            'SELESAI',
            'Jalan sudah diaspal',
            ['id' => 'petugas-1'],
            ['proof_url' => 'https://example.com/proof.jpg', 'notes' => 'Selesai']
        );
        $this->assertEquals('SELESAI', $completed['status']);
        $this->assertCount(3, $completed['status_logs']);
        $this->assertEquals('https://example.com/proof.jpg', $completed['completion_proof_url']);

        // Cek counter setelah update status
        $statsAfter = $counterRepo->getGlobalStats();
        $this->assertEquals(1, $statsAfter['total']);
        $this->assertEquals(0, $statsAfter['baru']);
        $this->assertEquals(1, $statsAfter['selesai']);

        // Cek delete
        $this->assertTrue($reportRepo->delete($created['id']));
        $this->assertNull($reportRepo->findById($created['id']));
    }
}

