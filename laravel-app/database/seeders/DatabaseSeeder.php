<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * DatabaseSeeder — entry point untuk seeding.
 *
 * Data master (users demo) disimpan di Firestore, bukan di SQL.
 * Jalankan: php artisan firestore:seed
 *
 * Seeder ini hanya sebagai penanda konvensi Laravel dan
 * tidak melakukan operasi SQL apa pun.
 */
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('');
        $this->command->info('PATROL menggunakan Firestore sebagai database utama.');
        $this->command->info('Untuk seed data demo, jalankan:');
        $this->command->info('  php artisan firestore:seed');
        $this->command->info('');
    }
}
