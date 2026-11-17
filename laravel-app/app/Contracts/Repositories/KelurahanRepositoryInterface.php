<?php

namespace App\Contracts\Repositories;

interface KelurahanRepositoryInterface
{
    /**
     * Mengambil semua daftar 156 kelurahan Surabaya
     */
    public function all(): array;

    /**
     * Mengambil satu kelurahan berdasarkan ID
     */
    public function findById(string $id): ?array;

    /**
     * Mengambil kelurahan berdasarkan nama dan kecamatan
     */
    public function findByName(string $name, ?string $kecamatan = null): ?array;

    /**
     * Mengambil kelurahan lengkap beserta hitungan laporan
     */
    public function allWithReportCounts(array $reportCountsByKelurahanId = []): array;
}

