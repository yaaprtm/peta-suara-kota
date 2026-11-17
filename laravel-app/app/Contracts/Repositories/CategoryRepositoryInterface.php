<?php

namespace App\Contracts\Repositories;

interface CategoryRepositoryInterface
{
    /**
     * Mengambil semua kategori laporan yang tersedia
     */
    public function all(): array;

    /**
     * Mengambil kategori berdasarkan type/slug
     */
    public function findByType(string $type): ?array;
}

