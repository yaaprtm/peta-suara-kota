<?php

namespace Tests\Unit;

use App\Repositories\Firestore\FirestoreUserRepository;
use App\Services\Firebase\FirestoreClientInterface;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class FirestoreUserRepositoryTest extends TestCase
{
    private FirestoreClientInterface&MockObject $mockClient;
    private FirestoreUserRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = $this->createMock(FirestoreClientInterface::class);
        $this->repository = new FirestoreUserRepository($this->mockClient);
    }

    public function test_find_by_id(): void
    {
        $userData = [
            'id' => 'user-123',
            'name' => 'Warga Test',
            'email' => 'warga@example.com',
            'role' => 'WARGA',
        ];

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('users', 'user-123')
            ->willReturn($userData);

        $result = $this->repository->findById('user-123');
        $this->assertEquals($userData, $result);
    }

    public function test_find_by_email(): void
    {
        $userData = [
            'id' => 'user-456',
            'name' => 'Petugas Test',
            'email' => 'petugas@example.com',
            'role' => 'PETUGAS',
        ];

        $this->mockClient->expects($this->once())
            ->method('runQuery')
            ->with(
                'users',
                $this->callback(function ($query) {
                    return isset($query['where']['fieldFilter']['value']['stringValue'])
                        && $query['where']['fieldFilter']['value']['stringValue'] === 'petugas@example.com';
                })
            )
            ->willReturn([$userData]);

        $result = $this->repository->findByEmail('Petugas@Example.com');
        $this->assertEquals($userData, $result);
    }

    public function test_create_user(): void
    {
        $input = [
            'name' => 'Admin Baru',
            'email' => 'Admin@Example.com',
            'password' => 'secret-hash',
            'role' => 'ADMIN',
        ];

        $this->mockClient->expects($this->once())
            ->method('createDocument')
            ->with(
                'users',
                $this->isType('string'),
                $this->callback(function ($data) {
                    return $data['email'] === 'admin@example.com'
                        && $data['role'] === 'ADMIN'
                        && $data['is_active'] === true;
                })
            )
            ->willReturnArgument(2);

        $created = $this->repository->create($input);
        $this->assertEquals('admin@example.com', $created['email']);
    }

    public function test_update_role(): void
    {
        $this->mockClient->expects($this->once())
            ->method('patchDocument')
            ->with('users', 'user-123', $this->callback(function ($data) {
                return $data['role'] === 'PETUGAS';
            }))
            ->willReturn([
                'id' => 'user-123',
                'role' => 'PETUGAS',
            ]);

        $result = $this->repository->updateRole('user-123', 'petugas');
        $this->assertEquals('PETUGAS', $result['role']);
    }
}

