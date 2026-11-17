<?php

namespace App\Contracts\Repositories;

interface TokenRepositoryInterface
{
    /**
     * Membuat token baru untuk user dan mengembalikan token plaintext
     */
    public function createToken(string $userId, string $name = 'auth-token'): string;

    /**
     * Mencari user berdasarkan token plaintext (Bearer token)
     */
    public function findUserByToken(string $plaintextToken): ?array;

    /**
     * Menghapus token tertentu
     */
    public function deleteToken(string $plaintextToken): bool;

    /**
     * Menghapus semua token milik user
     */
    public function deleteTokensByUserId(string $userId): bool;
}

