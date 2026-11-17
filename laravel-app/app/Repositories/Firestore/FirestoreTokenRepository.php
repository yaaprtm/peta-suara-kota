<?php

namespace App\Repositories\Firestore;

use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Services\Firebase\FirestoreClientInterface;
use Illuminate\Support\Str;

class FirestoreTokenRepository implements TokenRepositoryInterface
{
    private const COLLECTION = 'personal_access_tokens';

    protected FirestoreClientInterface $client;
    protected ?UserRepositoryInterface $userRepository;

    public function __construct(
        FirestoreClientInterface $client,
        ?UserRepositoryInterface $userRepository = null
    ) {
        $this->client = $client;
        $this->userRepository = $userRepository;
    }

    public function createToken(string $userId, string $name = 'auth-token'): string
    {
        $plaintext = bin2hex(random_bytes(32)); // 64-char hex
        $hash = hash('sha256', $plaintext);
        $now = now()->toISOString();

        // Hapus token lama milik user ini untuk mencegah penumpukan
        $this->deleteTokensByUserId($userId);

        $doc = [
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'name' => $name,
            'token_hash' => $hash,
            'last_used_at' => null,
            'created_at' => $now,
            'updated_at' => $now,
        ];

        // Jadikan hash sebagai ID dokumen untuk O(1) single document read
        $this->client->createDocument(self::COLLECTION, $hash, $doc);

        return $plaintext;
    }

    public function findUserByToken(string $plaintextToken): ?array
    {
        $hash = hash('sha256', $plaintextToken);
        $tokenDoc = $this->client->getDocument(self::COLLECTION, $hash);

        if (!$tokenDoc || empty($tokenDoc['user_id'])) {
            return null;
        }

        // Update last_used_at (non-blocking jika gagal)
        try {
            $this->client->patchDocument(self::COLLECTION, $hash, [
                'last_used_at' => now()->toISOString(),
            ], ['last_used_at']);
        } catch (\Throwable $e) {
            // Abaikan error patch last_used_at agar request tetap berhasil
        }

        if ($this->userRepository) {
            return $this->userRepository->findById($tokenDoc['user_id']);
        }

        return ['id' => $tokenDoc['user_id']];
    }

    public function deleteToken(string $plaintextToken): bool
    {
        $hash = hash('sha256', $plaintextToken);
        return $this->client->deleteDocument(self::COLLECTION, $hash);
    }

    public function deleteTokensByUserId(string $userId): bool
    {
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'user_id'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $userId],
                ],
            ],
            'limit' => 20,
        ];

        try {
            $tokens = $this->client->runQuery(self::COLLECTION, $query);
            foreach ($tokens as $t) {
                $docId = $t['token_hash'] ?? $t['id'] ?? null;
                if ($docId) {
                    $this->client->deleteDocument(self::COLLECTION, $docId);
                }
            }
            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
