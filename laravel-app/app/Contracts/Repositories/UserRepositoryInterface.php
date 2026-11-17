<?php

namespace App\Contracts\Repositories;

interface UserRepositoryInterface
{
    public function findById(string $id): ?array;

    public function findByEmail(string $email): ?array;

    public function list(array $filters = [], int $limit = 50, int $offset = 0): array;

    public function create(array $data): array;

    public function update(string $id, array $data): ?array;

    public function updateRole(string $id, string $role): ?array;

    public function toggleActive(string $id): ?array;

    public function count(): int;
}

