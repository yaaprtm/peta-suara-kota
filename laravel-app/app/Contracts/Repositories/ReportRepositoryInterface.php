<?php

namespace App\Contracts\Repositories;

interface ReportRepositoryInterface
{
    /**
     * Cari laporan berdasarkan ID atau tracking code
     */
    public function findById(string $id): ?array;

    /**
     * Cari laporan berdasarkan tracking code publik
     */
    public function findByTrackingCode(string $code): ?array;

    /**
     * Ambil daftar laporan dengan filter dan pagination
     */
    public function list(array $filters = [], int $limit = 20, int $offset = 0): array;

    /**
     * Ambil laporan aktif dalam viewport peta (dengan bounding box / kecamatan filter)
     */
    public function viewport(array $params): array;

    /**
     * Ambil laporan aktif terdekat berdasarkan koordinat Haversine
     */
    public function nearby(float $lat, float $lng, float $radiusKm = 2.0, int $limit = 20): array;

    /**
     * Buat laporan baru secara atomik (termasuk status log awal dan pembaruan counter)
     */
    public function create(array $data): array;

    /**
     * Perbarui status laporan dan catat status log
     */
    public function updateStatus(
        string $id,
        string $status,
        ?string $note = null,
        ?array $changedBy = null,
        ?array $completionData = null
    ): ?array;

    /**
     * Tambah dukungan warga (upvote increment)
     */
    public function upvote(string $id): ?array;

    /**
     * Hapus laporan
     */
    public function delete(string $id): bool;
}

