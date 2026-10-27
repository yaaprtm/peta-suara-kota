<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementApiTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $warga;
    private User $petugas;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::create([
            'name'      => 'Admin Kota',
            'email'     => 'admin@petasuarakota.id',
            'password'  => bcrypt('password123'),
            'role'      => 'ADMIN',
            'is_active' => true,
        ]);

        $this->warga = User::create([
            'name'      => 'Warga Biasa',
            'email'     => 'warga@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'WARGA',
            'is_active' => true,
        ]);

        $this->petugas = User::create([
            'name'      => 'Petugas Lapangan',
            'email'     => 'petugas@example.com',
            'password'  => bcrypt('password123'),
            'role'      => 'PETUGAS',
            'is_active' => true,
        ]);
    }

    // ─── GET /api/users ──────────────────────────────────────────────────────

    public function test_guest_cannot_list_users(): void
    {
        $this->getJson('/api/users')->assertStatus(401);
    }

    public function test_warga_cannot_list_users(): void
    {
        $this->actingAs($this->warga)->getJson('/api/users')->assertStatus(403);
    }

    public function test_petugas_cannot_list_users(): void
    {
        $this->actingAs($this->petugas)->getJson('/api/users')->assertStatus(403);
    }

    public function test_admin_can_list_users(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/users');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'users' => [
                '*' => ['id', 'name', 'email', 'role', 'isActive'],
            ],
            'total',
        ]);

        // All 3 test users should appear
        $this->assertGreaterThanOrEqual(3, $response->json('total'));
    }

    public function test_admin_can_filter_users_by_role(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/users?role=WARGA');

        $response->assertStatus(200);

        $users = $response->json('users');
        foreach ($users as $user) {
            $this->assertEquals('WARGA', $user['role']);
        }
    }

    public function test_admin_can_search_users(): void
    {
        $response = $this->actingAs($this->admin)->getJson('/api/users?search=Petugas');

        $response->assertStatus(200);

        $users = $response->json('users');
        $this->assertNotEmpty($users);
        $this->assertStringContainsStringIgnoringCase('Petugas', $users[0]['name']);
    }

    // ─── PATCH /api/users/{id}/role ──────────────────────────────────────────

    public function test_admin_can_change_user_role(): void
    {
        $response = $this->actingAs($this->admin)->patchJson("/api/users/{$this->warga->id}/role", [
            'role' => 'PETUGAS',
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('user.role', 'PETUGAS');

        $this->assertDatabaseHas('users', [
            'id'   => $this->warga->id,
            'role' => 'PETUGAS',
        ]);
    }

    public function test_role_change_validates_allowed_roles(): void
    {
        $response = $this->actingAs($this->admin)->patchJson("/api/users/{$this->warga->id}/role", [
            'role' => 'INVALID_ROLE',
        ]);

        $response->assertStatus(422);
    }

    public function test_warga_cannot_change_roles(): void
    {
        $this->actingAs($this->warga)->patchJson("/api/users/{$this->petugas->id}/role", [
            'role' => 'WARGA',
        ])->assertStatus(403);
    }

    // ─── PATCH /api/users/{id}/toggle-active ─────────────────────────────────

    public function test_admin_can_deactivate_user(): void
    {
        $response = $this->actingAs($this->admin)->patchJson("/api/users/{$this->warga->id}/toggle-active");

        $response->assertStatus(200);
        $response->assertJsonPath('isActive', false);

        $this->assertDatabaseHas('users', [
            'id'        => $this->warga->id,
            'is_active' => false,
        ]);
    }

    public function test_admin_can_reactivate_user(): void
    {
        // First deactivate
        $this->warga->update(['is_active' => false]);

        $response = $this->actingAs($this->admin)->patchJson("/api/users/{$this->warga->id}/toggle-active");

        $response->assertStatus(200);
        $response->assertJsonPath('isActive', true);

        $this->assertDatabaseHas('users', [
            'id'        => $this->warga->id,
            'is_active' => true,
        ]);
    }

    public function test_admin_cannot_deactivate_own_account(): void
    {
        $response = $this->actingAs($this->admin)->patchJson("/api/users/{$this->admin->id}/toggle-active");

        $response->assertStatus(422);
        $response->assertJsonPath('message', 'Tidak dapat menonaktifkan akun sendiri.');
    }

    public function test_warga_cannot_toggle_other_user_status(): void
    {
        $this->actingAs($this->warga)->patchJson("/api/users/{$this->petugas->id}/toggle-active")
            ->assertStatus(403);
    }
}
