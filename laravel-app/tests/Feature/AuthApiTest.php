<?php

namespace Tests\Feature;

use App\Contracts\Repositories\UserRepositoryInterface;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    public function test_user_can_register_via_api(): void
    {
        $payload = [
            'name' => 'Warga Baru',
            'email' => 'wargabaru@surabaya.go.id',
            'password' => 'password123',
            'phone' => '081234567890',
        ];

        $response = $this->postJson('/api/auth/register', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'accessToken',
                'refreshToken',
                'user' => [
                    'id',
                    'email',
                    'name',
                    'role',
                ],
            ]);

        $this->assertEquals('wargabaru@surabaya.go.id', $response->json('user.email'));
        $this->assertEquals('WARGA', $response->json('user.role'));
    }

    public function test_user_cannot_register_with_duplicate_email(): void
    {
        $userRepo = app(UserRepositoryInterface::class);
        $userRepo->create([
            'name' => 'Existing User',
            'email' => 'existing@surabaya.go.id',
            'password' => Hash::make('password123'),
        ]);

        $payload = [
            'name' => 'Duplicate Email',
            'email' => 'existing@surabaya.go.id',
            'password' => 'password123',
        ];

        $response = $this->postJson('/api/auth/register', $payload);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_user_can_login_with_correct_credentials(): void
    {
        $userRepo = app(UserRepositoryInterface::class);
        $userRepo->create([
            'name' => 'Login User',
            'email' => 'login@surabaya.go.id',
            'password' => Hash::make('secretpass123'),
            'role' => 'PETUGAS',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@surabaya.go.id',
            'password' => 'secretpass123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'accessToken',
                'refreshToken',
                'user' => [
                    'id',
                    'email',
                    'name',
                    'role',
                ],
            ]);

        $this->assertEquals('PETUGAS', $response->json('user.role'));
    }

    public function test_user_cannot_login_with_invalid_password(): void
    {
        $userRepo = app(UserRepositoryInterface::class);
        $userRepo->create([
            'name' => 'Login User 2',
            'email' => 'login2@surabaya.go.id',
            'password' => Hash::make('correctpassword'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login2@surabaya.go.id',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_access_me_and_logout(): void
    {
        // 1. Register
        $regResponse = $this->postJson('/api/auth/register', [
            'name' => 'Auth Me User',
            'email' => 'authme@surabaya.go.id',
            'password' => 'password123',
        ]);

        $token = $regResponse->json('accessToken');

        // 2. Akses /api/auth/me dengan token Bearer
        $meResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $meResponse->assertStatus(200)
            ->assertJsonPath('user.email', 'authme@surabaya.go.id');

        // 3. Logout dengan token Bearer
        $logoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200);

        // 4. Setelah logout, token sudah invalid
        $afterLogoutResponse = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/auth/me');

        $afterLogoutResponse->assertStatus(401);
    }
}

