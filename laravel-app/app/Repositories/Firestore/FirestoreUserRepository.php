<?php

namespace App\Repositories\Firestore;

use App\Contracts\Repositories\UserRepositoryInterface;
use App\Services\Firebase\FirestoreClientInterface;
use Illuminate\Support\Str;

class FirestoreUserRepository implements UserRepositoryInterface
{
    private const COLLECTION = 'users';

    protected FirestoreClientInterface $client;

    public function __construct(FirestoreClientInterface $client)
    {
        $this->client = $client;
    }

    public function findById(string $id): ?array
    {
        return $this->client->getDocument(self::COLLECTION, $id);
    }

    public function findByEmail(string $email): ?array
    {
        $normalized = mb_strtolower(trim($email));

        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'where' => [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'email'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => $normalized],
                ],
            ],
            'limit' => 1,
        ];

        $results = $this->client->runQuery(self::COLLECTION, $query);

        return $results[0] ?? null;
    }

    public function list(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $query = [
            'from' => [['collectionId' => self::COLLECTION]],
            'limit' => $limit,
        ];

        if ($offset > 0) {
            $query['offset'] = $offset;
        }

        if (!empty($filters['role'])) {
            $query['where'] = [
                'fieldFilter' => [
                    'field' => ['fieldPath' => 'role'],
                    'op' => 'EQUAL',
                    'value' => ['stringValue' => strtoupper($filters['role'])],
                ],
            ];
        }

        $results = $this->client->runQuery(self::COLLECTION, $query);

        if (!empty($filters['search'])) {
            $q = mb_strtolower(trim($filters['search']));
            $results = array_filter($results, function ($u) use ($q) {
                return str_contains(mb_strtolower($u['name'] ?? ''), $q)
                    || str_contains(mb_strtolower($u['email'] ?? ''), $q);
            });
        }

        return array_values($results);
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? (string) Str::uuid();
        $now = now()->toISOString();

        $user = array_merge([
            'id' => $id,
            'name' => '',
            'email' => '',
            'role' => 'WARGA',
            'phone' => null,
            'kelurahan_id' => null,
            'is_active' => true,
            'created_at' => $now,
            'updated_at' => $now,
        ], $data);

        $user['id'] = $id;
        $user['email'] = mb_strtolower(trim($user['email']));

        return $this->client->createDocument(self::COLLECTION, $id, $user);
    }

    public function update(string $id, array $data): ?array
    {
        $data['updated_at'] = now()->toISOString();
        if (isset($data['email'])) {
            $data['email'] = mb_strtolower(trim($data['email']));
        }

        return $this->client->patchDocument(self::COLLECTION, $id, $data);
    }

    public function updateRole(string $id, string $role): ?array
    {
        return $this->update($id, ['role' => strtoupper($role)]);
    }

    public function toggleActive(string $id): ?array
    {
        $current = $this->findById($id);
        if (!$current) {
            return null;
        }

        $newStatus = !(bool) ($current['is_active'] ?? true);
        return $this->update($id, ['is_active' => $newStatus]);
    }

    public function count(): int
    {
        $results = $this->list([], 1000);
        return count($results);
    }
}
