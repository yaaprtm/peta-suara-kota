<?php

namespace App\Services\Firebase;

interface FirestoreClientInterface
{
    /**
     * Mengambil satu dokumen berdasarkan path koleksi dan ID dokumen.
     * Mengembalikan array data murni (tanpa pembungkus tipe Firestore) atau null jika tidak ditemukan.
     */
    public function getDocument(string $collection, string $documentId): ?array;

    /**
     * Membuat dokumen baru dengan ID tertentu.
     * Gagal jika dokumen sudah ada jika $ifAbsent = true.
     */
    public function createDocument(string $collection, string $documentId, array $data, bool $ifAbsent = false): array;

    /**
     * Memperbarui field pada dokumen yang sudah ada.
     */
    public function patchDocument(string $collection, string $documentId, array $data, ?array $updateMask = null): array;

    /**
     * Menghapus dokumen berdasarkan koleksi dan ID.
     */
    public function deleteDocument(string $collection, string $documentId): bool;

    /**
     * Menjalankan StructuredQuery pada Firestore.
     */
    public function runQuery(string $collection, array $structuredQuery): array;

    /**
     * Menjalankan batch writes / commit operasi secara atomik.
     */
    public function commit(array $writes): array;
}

