<?php

namespace Tests\Unit;

use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Repositories\Firestore\FirestoreCounterRepository;
use App\Services\Firebase\FirestoreClientInterface;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class FirestoreCounterRepositoryTest extends TestCase
{
    private FirestoreClientInterface&MockObject $mockClient;
    private KelurahanRepositoryInterface&MockObject $mockKelurahan;
    private FirestoreCounterRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = $this->createMock(FirestoreClientInterface::class);
        $this->mockKelurahan = $this->createMock(KelurahanRepositoryInterface::class);
        $this->repository = new FirestoreCounterRepository($this->mockClient, $this->mockKelurahan);
    }

    public function test_get_global_stats_when_exists(): void
    {
        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('counters', 'global_stats')
            ->willReturn([
                'total' => 10,
                'baru' => 3,
                'diproses' => 4,
                'selesai' => 3,
                'highUrgency' => 2,
            ]);

        $stats = $this->repository->getGlobalStats();
        $this->assertEquals(10, $stats['total']);
        $this->assertEquals(3, $stats['baru']);
        $this->assertEquals(4, $stats['diproses']);
        $this->assertEquals(3, $stats['selesai']);
    }

    public function test_get_global_stats_default(): void
    {
        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('counters', 'global_stats')
            ->willReturn(null);

        $stats = $this->repository->getGlobalStats();
        $this->assertEquals(0, $stats['total']);
        $this->assertCount(14, $stats['byDay']);
    }

    public function test_get_leaderboard_from_document(): void
    {
        $items = [
            [
                'kelurahan' => ['id' => '1', 'name' => 'Genteng', 'kecamatan' => 'Genteng', 'kota' => 'Surabaya'],
                'totalReports' => 5,
                'resolvedReports' => 4,
                'resolutionRate' => 80,
                'score' => 80,
            ],
        ];

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('counters', 'leaderboard')
            ->willReturn(['items' => $items]);

        $leaderboard = $this->repository->getLeaderboard();
        $this->assertEquals($items, $leaderboard);
    }

    public function test_get_kecamatan_density(): void
    {
        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('counters', 'kecamatan_density')
            ->willReturn([
                'density' => [
                    ['kecamatan' => 'Genteng', 'total' => 12, 'avgUrgensi' => 50.0],
                ],
                'maxTotal' => 12,
            ]);

        $density = $this->repository->getKecamatanDensity();
        $this->assertEquals(12, $density['maxTotal']);
        $this->assertCount(1, $density['density']);
    }
}
