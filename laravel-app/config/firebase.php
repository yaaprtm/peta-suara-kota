<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Project ID
    |--------------------------------------------------------------------------
    */
    'project_id' => env('FIREBASE_PROJECT_ID', 'peta-suara-kota'),

    /*
    |--------------------------------------------------------------------------
    | Firestore Database ID
    |--------------------------------------------------------------------------
    */
    'database_id' => env('FIREBASE_DATABASE_ID', '(default)'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Credentials
    |--------------------------------------------------------------------------
    | Prioritas pemuatan kredensial:
    | 1. FIREBASE_CREDENTIALS_BASE64 (string JSON terenkode Base64 untuk environment Vercel/Production)
    | 2. FIREBASE_CREDENTIALS_PATH (path file service account JSON untuk environment lokal)
    */
    'credentials_path' => env('FIREBASE_CREDENTIALS_PATH'),
    'credentials_base64' => env('FIREBASE_CREDENTIALS_BASE64'),

    /*
    |--------------------------------------------------------------------------
    | Firestore Emulator Host
    |--------------------------------------------------------------------------
    | Jika diisi (misal: 127.0.0.1:8080), klien Firestore akan terhubung
    | ke Firestore Emulator lokal tanpa memerlukan token OAuth2.
    */
    'emulator_host' => env('FIRESTORE_EMULATOR_HOST'),

    /*
    |--------------------------------------------------------------------------
    | Firebase Storage Bucket
    |--------------------------------------------------------------------------
    | Default: {project_id}.appspot.com
    | Firebase Storage digunakan untuk menyimpan foto laporan.
    */
    'storage_bucket' => env('FIREBASE_STORAGE_BUCKET', env('FIREBASE_PROJECT_ID', 'patrol-f0ab5') . '.appspot.com'),

    /*
    |--------------------------------------------------------------------------
    | Firestore Driver / Repository Mode
    |--------------------------------------------------------------------------
    | 'firestore' untuk koneksi ke Firestore / Emulator.
    | 'memory' untuk pengujian in-memory murni (zero external dependency).
    */
    'driver' => env('FIRESTORE_DRIVER', 'firestore'),
];

