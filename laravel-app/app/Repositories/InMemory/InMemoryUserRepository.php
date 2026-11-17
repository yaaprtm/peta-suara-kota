<?php

namespace App\Repositories\InMemory;

use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Support\Str;

class InMemoryUserRepository implements UserRepositoryInterface
{
    /**
     * @var array<string, array>
     */
    protected array $users = [];

    public function __construct(array $initialUsers = [])
    {
        foreach ($initialUsers as $u) {
            $id = $u['id'] ?? (string) Str::uuid();
            $u['id'] = $id;
            $this->users[$id] = $u;
        }
    }

    public function findById(string $id): ?array
    {
        return $this->users[$id] ?? null;
    }

    public function findByEmail(string $email): ?array
    {
        $normalized = mb_strtolower(trim($email));
        foreach ($this->users as $user) {
            if (mb_strtolower($user['email'] ?? '') === $normalized) {
                return $user;
            }
        }
        return null;
    }

    public function list(array $filters = [], int $limit = 50, int $offset = 0): array
    {
        $results = array_values($this->users);

        if (!empty($filters['role'])) {
            $role = strtoupper($filters['role']);
            $results = array_filter($results, fn($u) => ($u['role'] ?? '') === $role);
        }

        if (isset($filters['is_active'])) {
            $active = (bool) $filters['is_active'];
            $results = array_filter($results, fn($u) => (bool) ($u['is_active'] ?? true) === $active);
        }

        if (!empty($filters['search'])) {
            $q = mb_strtolower(trim($filters['search']));
            $results = array_filter($results, function ($u) use ($q) {
                return str_contains(mb_strtolower($u['name'] ?? ''), $q)
                    || str_contains(mb_strtolower($u['email'] ?? ''), $q);
            });
        }

        // Urutkan created_at desc
        usort($results, function ($a, $b) {
            return strcmp($b['created_at'] ?? '', $a['created_at'] ?? '');
        });

        return array_slice(array_values($results), $offset, $limit);
    }

    public function create(array $data): array
    {
        $id = $data['id'] ?? (string) Str::uuid();
        $user = array_merge([
            'id' => $id,
            'name' => '',
            'email' => '',
            'role' => 'WARGA',
            'phone' => null,
            'is_active' => true,
            'created_at' => now()->toISOString(),
            'updated_at' => now()->toISOString(),
        ], $data);

        $this->users[$id] = $user;
        return $user;
    }

    public function update(string $id, array $data): ?array
    {
        if (!isset($this->users[$id])) {
            return null;
        }

        $data['updated_at'] = now()->toISOString();
        $this->users[$id] = array_merge($this->users[$id], $data);
        return $this->users[$id];
    }

    public function updateRole(string $id, string $role): ?array
    {
        return $this->update($id, ['role' => strtoupper($role)]);
    }

    public function toggleActive(string $id): ?array
    {
        if (!isset($this->users[$id])) {
            return null;
        }

        $current = (bool) ($this->users[$id]['is_active'] ?? true);
        return $this->update($id, ['is_active' => !$current]);
    }

    public function count(): int
    {
        return count($this->users);
    }
}

