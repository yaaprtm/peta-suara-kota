<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessMatrixTest extends TestCase
{
    use RefreshDatabase;

    private function createWarga(): User
    {
        return User::factory()->create([
            'role' => 'WARGA',
            'is_active' => true,
        ]);
    }

    private function createPetugas(): User
    {
        return User::factory()->create([
            'role' => 'PETUGAS',
            'is_active' => true,
        ]);
    }

    private function createAdmin(): User
    {
        return User::factory()->create([
            'role' => 'ADMIN',
            'is_active' => true,
        ]);
    }

    private function createSuperadmin(): User
    {
        return User::factory()->create([
            'role' => 'SUPERADMIN',
            'is_active' => true,
        ]);
    }

    public function test_guest_is_redirected_to_login_from_protected_routes(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/petugas')->assertRedirect('/login');
        $this->get('/superadmin')->assertRedirect('/login');
        $this->get('/superadmin/master')->assertRedirect('/login');
        $this->get('/lapor')->assertRedirect('/login');
    }

    public function test_warga_access_matrix(): void
    {
        $warga = $this->createWarga();

        // Accessible
        $this->actingAs($warga)->get('/dashboard')->assertStatus(200);
        $this->actingAs($warga)->get('/lapor')->assertRedirect('/peta?lapor=true');

        // Forbidden
        $this->actingAs($warga)->get('/petugas')->assertStatus(403);
        $this->actingAs($warga)->get('/superadmin')->assertStatus(403);
        $this->actingAs($warga)->get('/superadmin/master')->assertStatus(403);
    }

    public function test_petugas_access_matrix(): void
    {
        $petugas = $this->createPetugas();

        // Accessible
        $this->actingAs($petugas)->get('/petugas')->assertStatus(200);

        // Forbidden
        $this->actingAs($petugas)->get('/dashboard')->assertStatus(403);
        $this->actingAs($petugas)->get('/superadmin')->assertStatus(403);
        $this->actingAs($petugas)->get('/superadmin/master')->assertStatus(403);
    }

    public function test_superadmin_access_matrix(): void
    {
        $superadmin = $this->createSuperadmin();

        // Accessible
        $this->actingAs($superadmin)->get('/superadmin')->assertStatus(200);
        $this->actingAs($superadmin)->get('/superadmin/master')->assertStatus(200);

        // Forbidden for other role portals
        $this->actingAs($superadmin)->get('/dashboard')->assertStatus(403);
        $this->actingAs($superadmin)->get('/petugas')->assertStatus(403);
    }

    public function test_admin_access_matrix(): void
    {
        $admin = $this->createAdmin();

        // Accessible
        $this->actingAs($admin)->get('/superadmin')->assertStatus(200);
        $this->actingAs($admin)->get('/superadmin/master')->assertStatus(200);

        // Forbidden
        $this->actingAs($admin)->get('/dashboard')->assertStatus(403);
        $this->actingAs($admin)->get('/petugas')->assertStatus(403);
    }

    public function test_login_redirects_by_role_automatically(): void
    {
        $warga = User::factory()->create([
            'email' => 'warga_test@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'WARGA',
            'is_active' => true,
        ]);

        $petugas = User::factory()->create([
            'email' => 'petugas_test@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'PETUGAS',
            'is_active' => true,
        ]);

        $superadmin = User::factory()->create([
            'email' => 'superadmin_test@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'SUPERADMIN',
            'is_active' => true,
        ]);

        $this->post('/login', [
            'email' => $warga->email,
            'password' => 'password123',
        ])->assertRedirect('/dashboard');

        auth()->logout();

        $this->post('/login', [
            'email' => $petugas->email,
            'password' => 'password123',
        ])->assertRedirect('/petugas');

        auth()->logout();

        $this->post('/login', [
            'email' => $superadmin->email,
            'password' => 'password123',
        ])->assertRedirect('/superadmin');
    }

    public function test_guest_creating_report_is_redirected_to_form_after_login(): void
    {
        $warga = User::factory()->create([
            'email' => 'warga_lapor@surabaya.go.id',
            'password' => bcrypt('password123'),
            'role' => 'WARGA',
            'is_active' => true,
        ]);

        // Guest attempts to visit /lapor
        $response = $this->get('/lapor');
        $response->assertRedirect('/login');

        // Guest logs in
        $loginResponse = $this->post('/login', [
            'email' => $warga->email,
            'password' => 'password123',
        ]);

        // Redirected to intended URL (/lapor) which redirects to /peta?lapor=true
        $loginResponse->assertRedirect('/lapor');
        $this->get('/lapor')->assertRedirect('/peta?lapor=true');
    }
}
