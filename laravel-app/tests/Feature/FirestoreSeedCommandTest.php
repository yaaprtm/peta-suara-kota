<?php

namespace Tests\Feature;

use App\Console\Commands\FirestoreSeedCommand;
use App\Contracts\Repositories\CounterRepositoryInterface;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Repositories\InMemory\InMemoryCounterRepository;
use App\Repositories\InMemory\InMemoryUserRepository;
use App\Repositories\Static\StaticKelurahanRepository;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

/**
 * Test FirestoreSeedCommand menggunakan repository in-memory.
 *
 * Tidak menyentuh Firestore live.
 * FIREBASE_DRIVER=inmemory diset di phpunit.xml.
 */
class FirestoreSeedCommandTest extends TestCase
{
    use WithFaker;

    private InMemoryUserRepository $userRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->userRepo = new InMemoryUserRepository();

        // Bind in-memory repositories ke container
        $this->app->instance(UserRepositoryInterface::class, $this->userRepo);
        $this->app->instance(KelurahanRepositoryInterface::class, new StaticKelurahanRepository());
        $this->app->instance(CounterRepositoryInterface::class, new InMemoryCounterRepository());
    }

    public function test_seed_creates_five_demo_accounts(): void
    {
        $this->artisan('firestore:seed')
            ->assertSuccessful();

        $allUsers = $this->userRepo->list([], 50);
        $this->assertCount(5, $allUsers);
    }

    public function test_seed_creates_correct_roles(): void
    {
        $this->artisan('firestore:seed')
            ->assertSuccessful();

        $admin = $this->userRepo->findByEmail('admin@petasuarakota.id');
        $this->assertNotNull($admin);
        $this->assertEquals('ADMIN', $admin['role']);

        $petugas = $this->userRepo->findByEmail('petugas.pu@petasuarakota.id');
        $this->assertNotNull($petugas);
        $this->assertEquals('PETUGAS', $petugas['role']);

        $warga = $this->userRepo->findByEmail('demo@petasuarakota.id');
        $this->assertNotNull($warga);
        $this->assertEquals('WARGA', $warga['role']);
    }

    public function test_seed_is_idempotent_without_force(): void
    {
        // Jalankan dua kali
        $this->artisan('firestore:seed')->assertSuccessful();
        $this->artisan('firestore:seed')->assertSuccessful();

        // Harus tetap 5 user, tidak duplikat
        $allUsers = $this->userRepo->list([], 50);
        $this->assertCount(5, $allUsers);
    }

    public function test_seed_with_force_updates_existing(): void
    {
        // Seed pertama
        $this->artisan('firestore:seed')->assertSuccessful();
        $before = $this->userRepo->findByEmail('admin@petasuarakota.id');
        $this->assertNotNull($before);

        // Seed dengan --force
        $this->artisan('firestore:seed', ['--force' => true])->assertSuccessful();

        // Masih 5 user, bukan 10
        $allUsers = $this->userRepo->list([], 50);
        $this->assertCount(5, $allUsers);

        $after = $this->userRepo->findByEmail('admin@petasuarakota.id');
        $this->assertNotNull($after);
        $this->assertEquals('Admin Command Center Surabaya', $after['name']);
    }

    public function test_seed_hashes_password(): void
    {
        $this->artisan('firestore:seed')->assertSuccessful();

        $admin = $this->userRepo->findByEmail('admin@petasuarakota.id');
        $this->assertNotNull($admin);
        $this->assertNotEmpty($admin['password']);

        // Password harus berupa bcrypt/argon hash, bukan plain text
        $this->assertNotEquals('password123', $admin['password']);
        $this->assertTrue(
            \Illuminate\Support\Facades\Hash::check('password123', $admin['password']),
            'Password harus bisa diverifikasi dengan Hash::check()'
        );
    }

    public function test_seed_assigns_valid_kelurahan(): void
    {
        $this->artisan('firestore:seed')->assertSuccessful();

        $kelurahanRepo = new StaticKelurahanRepository();
        $allKel = $kelurahanRepo->all();
        $validIds = array_column($allKel, 'id');

        $users = $this->userRepo->list([], 50);
        foreach ($users as $user) {
            $this->assertContains(
                $user['kelurahan_id'],
                $validIds,
                'kelurahan_id user harus valid: ' . $user['email']
            );
        }
    }
}

