<?php

namespace App\Repositories\InMemory;

use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Support\Str;

class InMemoryTokenRepository implements TokenRepositoryInterface
{
    /**
     * @var array<string, array> Key is token hash
     */
    protected array $tokens = [];

    protected ?UserRepositoryInterface $userRepository;

    public function __construct(?UserRepositoryInterface $userRepository = null)
    {
        $this->userRepository = $userRepository;
    }

    public function createToken(string $userId, string $name = 'auth-token'): string
    {
        $plaintext = Str::random(40);
        $hash = hash('sha256', $plaintext);

        $this->tokens[$hash] = [
            'id' => (string) Str::uuid(),
            'user_id' => $userId,
            'name' => $name,
            'hash' => $hash,
            'created_at' => now()->toISOString(),
            'last_used_at' => null,
        ];

        return $plaintext;
    }

    public function findUserByToken(string $plaintextToken): ?array
    {
        $hash = hash('sha256', $plaintextToken);
        if (!isset($this->tokens[$hash])) {
            return null;
        }

        $userId = $this->tokens[$hash]['user_id'];
        $this->tokens[$hash]['last_used_at'] = now()->toISOString();

        if ($this->userRepository) {
            return $this->userRepository->findById($userId);
        }

        return ['id' => $userId];
    }

    public function deleteToken(string $plaintextToken): bool
    {
        $hash = hash('sha256', $plaintextToken);
        if (isset($this->tokens[$hash])) {
            unset($this->tokens[$hash]);
            return true;
        }
        return false;
    }

    public function deleteTokensByUserId(string $userId): bool
    {
        $deleted = false;
        foreach ($this->tokens as $hash => $token) {
            if ($token['user_id'] === $userId) {
                unset($this->tokens[$hash]);
                $deleted = true;
            }
        }
        return $deleted;
    }
}

