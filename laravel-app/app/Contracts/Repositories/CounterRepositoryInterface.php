<?php

namespace App\Contracts\Repositories;

interface CounterRepositoryInterface
{
    /**
     * Mengambil data overview statistik global
     */
    public function getGlobalStats(): array;

    /**
     * Mengambil data leaderboard per kelurahan
     */
    public function getLeaderboard(): array;

    /**
     * Mengambil data kepadatan laporan per kecamatan
     */
    public function getKecamatanDensity(): array;

    /**
     * Memperbarui counter saat ada laporan baru
     */
    public function incrementReportCreated(array $report): void;

    /**
     * Memperbarui counter saat status laporan berubah
     */
    public function updateReportStatus(string $oldStatus, string $newStatus, array $report): void;

    /**
     * Menghitung ulang seluruh counter (utilitas / seed)
     */
    public function recalculate(array $reports): void;
}

