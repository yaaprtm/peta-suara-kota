<?php

namespace Tests\Unit;

use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Repositories\Firestore\FirestoreReportRepository;
use App\Services\Firebase\FirestoreClientInterface;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class FirestoreReportRepositoryTest extends TestCase
{
    private FirestoreClientInterface&MockObject $mockClient;
    private CounterRepositoryInterface&MockObject $mockCounter;
    private FirestoreReportRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = $this->createMock(FirestoreClientInterface::class);
        $this->mockCounter = $this->createMock(CounterRepositoryInterface::class);
        $this->repository = new FirestoreReportRepository($this->mockClient, $this->mockCounter);
    }

    public function test_find_by_id(): void
    {
        $reportData = [
            'id' => 'report-1',
            'title' => 'Laporan Genangan',
            'status' => 'BARU',
        ];

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('reports', 'report-1')
            ->willReturn($reportData);

        $result = $this->repository->findById('report-1');
        $this->assertEquals($reportData, $result);
    }

    public function test_create_embeds_initial_log_and_notifies_counter(): void
    {
        $input = [
            'title' => 'Pohon Tumbang di Gubeng',
            'category' => 'INFRASTRUKTUR',
            'latitude' => -7.2600,
            'longitude' => 112.7500,
            'user_id' => 'user-1',
        ];

        $this->mockClient->expects($this->once())
            ->method('createDocument')
            ->with(
                'reports',
                $this->isType('string'),
                $this->callback(function ($data) {
                    return $data['title'] === 'Pohon Tumbang di Gubeng'
                        && $data['status'] === 'BARU'
                        && isset($data['tracking_code'])
                        && count($data['status_logs']) === 1
                        && $data['status_logs'][0]['to_status'] === 'BARU';
                })
            )
            ->willReturnArgument(2);

        $this->mockCounter->expects($this->once())
            ->method('incrementReportCreated');

        $created = $this->repository->create($input);
        $this->assertEquals('Pohon Tumbang di Gubeng', $created['title']);
        $this->assertNotEmpty($created['tracking_code']);
    }

    public function test_update_status_and_completion(): void
    {
        $existing = [
            'id' => 'rep-1',
            'status' => 'BARU',
            'status_logs' => [
                ['to_status' => 'BARU', 'changed_at' => '2026-11-17T01:00:00Z'],
            ],
        ];

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('reports', 'rep-1')
            ->willReturn($existing);

        $this->mockClient->expects($this->once())
            ->method('patchDocument')
            ->with(
                'reports',
                'rep-1',
                $this->callback(function ($update) {
                    return $update['status'] === 'SELESAI'
                        && count($update['status_logs']) === 2
                        && isset($update['resolved_at'])
                        && $update['completion_note'] === 'Sudah dibersihkan';
                })
            )
            ->willReturnArgument(2);

        $this->mockCounter->expects($this->once())
            ->method('updateReportStatus')
            ->with('BARU', 'SELESAI');

        $result = $this->repository->updateStatus(
            'rep-1',
            'SELESAI',
            'Catatan perbaikan',
            ['id' => 'petugas-1', 'name' => 'Bambang', 'role' => 'PETUGAS'],
            ['note' => 'Sudah dibersihkan']
        );

        $this->assertEquals('SELESAI', $result['status']);
    }

    public function test_upvote(): void
    {
        $existing = [
            'id' => 'rep-2',
            'upvotes_count' => 3,
        ];

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('reports', 'rep-2')
            ->willReturn($existing);

        $this->mockClient->expects($this->once())
            ->method('patchDocument')
            ->with(
                'reports',
                'rep-2',
                $this->callback(fn($data) => $data['upvotes_count'] === 4)
            )
            ->willReturnArgument(2);

        $result = $this->repository->upvote('rep-2');
        $this->assertEquals(4, $result['upvotes_count']);
    }
}
