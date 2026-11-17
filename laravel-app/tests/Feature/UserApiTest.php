<?php

namespace Tests\Feature;

use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class UserApiTest extends TestCase
{
    private string $adminToken;
    private array $adminUser;
    private array $wargaUser;

    protected function setUp(): void
    {
        parent::setUp();

        $userRepo = app(UserRepositoryInterface::class);
        $tokenRepo = app(TokenRepositoryInterface::class);

        $this->adminUser = $userRepo->create([
            'name' => 'Super Admin Test',
            'email' => 'admin@surabaya.test',
            'password' => Hash::make('password123'),
            'role' => 'ADMIN',
            'is_active' => true,
        ]);

        $this->wargaUser = $userRepo->create([
            'name' => 'Warga Kelurahan',
            'email' => 'warga@surabaya.test',
            'password' => Hash::make('password123'),
            'role' => 'WARGA',
            'is_active' => true,
        ]);

        $this->adminToken = $tokenRepo->createToken($this->adminUser['id'], 'admin-token');
    }

    public function test_admin_can_list_users(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'users' => [
                    '*' => ['id', 'name', 'email', 'role', 'isActive'],
                ],
                'total',
            ]);

        $this->assertGreaterThanOrEqual(2, $response->json('total'));
    }

    public function test_admin_can_update_user_role(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson('/api/users/' . $this->wargaUser['id'] . '/role', [
                'role' => 'PETUGAS',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('user.role', 'PETUGAS');
    }

    public function test_admin_cannot_demote_self(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson('/api/users/' . $this->adminUser['id'] . '/role', [
                'role' => 'WARGA',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat mengubah role diri sendiri.');
    }

    public function test_admin_can_toggle_user_active_status(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson('/api/users/' . $this->wargaUser['id'] . '/toggle-active');

        $response->assertStatus(200)
            ->assertJsonPath('isActive', false);
    }

    public function test_admin_cannot_deactivate_self(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer ' . $this->adminToken)
            ->patchJson('/api/users/' . $this->adminUser['id'] . '/toggle-active');

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Tidak dapat menonaktifkan akun sendiri.');
    }
}

