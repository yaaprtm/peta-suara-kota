<?php

namespace Tests\Unit;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\Firestore\FirestoreTokenRepository;
use App\Services\Firebase\FirestoreClientInterface;
use PHPUnit\Framework\MockObject\MockObject;
use Tests\TestCase;

class FirestoreTokenRepositoryTest extends TestCase
{
    private FirestoreClientInterface&MockObject $mockClient;
    private UserRepositoryInterface&MockObject $mockUserRepo;
    private FirestoreTokenRepository $repository;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = $this->createMock(FirestoreClientInterface::class);
        $this->mockUserRepo = $this->createMock(UserRepositoryInterface::class);
        $this->repository = new FirestoreTokenRepository($this->mockClient, $this->mockUserRepo);
    }

    public function test_create_token_hashes_and_stores(): void
    {
        $this->mockClient->expects($this->once())
            ->method('runQuery')
            ->willReturn([]); // deleteTokensByUserId

        $this->mockClient->expects($this->once())
            ->method('createDocument')
            ->with(
                'personal_access_tokens',
                $this->callback(function ($docId) {
                    return strlen($docId) === 64; // sha256 hex string
                }),
                $this->callback(function ($data) {
                    return $data['user_id'] === 'user-1';
                })
            )
            ->willReturnArgument(2);

        $plaintext = $this->repository->createToken('user-1', 'auth');
        $this->assertEquals(64, strlen($plaintext));
    }

    public function test_find_user_by_token(): void
    {
        $plaintext = 'testplaintexttoken123';
        $hash = hash('sha256', $plaintext);

        $this->mockClient->expects($this->once())
            ->method('getDocument')
            ->with('personal_access_tokens', $hash)
            ->willReturn([
                'user_id' => 'user-abc',
                'token_hash' => $hash,
            ]);

        $this->mockUserRepo->expects($this->once())
            ->method('findById')
            ->with('user-abc')
            ->willReturn([
                'id' => 'user-abc',
                'name' => 'Warga ABC',
                'is_active' => true,
            ]);

        $user = $this->repository->findUserByToken($plaintext);
        $this->assertNotNull($user);
        $this->assertEquals('user-abc', $user['id']);
    }

    public function test_delete_token(): void
    {
        $plaintext = 'deleteme';
        $hash = hash('sha256', $plaintext);

        $this->mockClient->expects($this->once())
            ->method('deleteDocument')
            ->with('personal_access_tokens', $hash)
            ->willReturn(true);

        $this->assertTrue($this->repository->deleteToken($plaintext));
    }
}
