<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ── Helper: buat token, simpan ke DB, return plaintext ──────────────────
    private function createToken(User $user, string $name = 'auth-token'): string
    {
        $plaintext  = bin2hex(random_bytes(32)); // 64-char hex
        $hashed     = hash('sha256', $plaintext);

        // Hapus token lama milik user ini agar tidak menumpuk
        DB::table('personal_access_tokens')
            ->where('tokenable_type', User::class)
            ->where('tokenable_id', $user->id)
            ->delete();

        DB::table('personal_access_tokens')->insert([
            'tokenable_type' => User::class,
            'tokenable_id'   => $user->id,
            'name'           => $name,
            'token'          => $hashed,
            'abilities'      => '["*"]',
            'last_used_at'   => null,
            'created_at'     => now(),
            'updated_at'     => now(),
        ]);

        return $plaintext;
    }

    // ── Helper: format user response ─────────────────────────────────────────
    private function userArray(User $user): array
    {
        return [
            'id'          => $user->id,
            'email'       => $user->email,
            'name'        => $user->name,
            'role'        => $user->role,
            'phone'       => $user->phone,
            'avatar'      => $user->avatar,
            'kelurahan'   => $user->kelurahan ? [
                'id'         => $user->kelurahan->id,
                'name'       => $user->kelurahan->name,
                'kecamatan'  => $user->kelurahan->kecamatan,
                'kota'       => $user->kelurahan->kota ?? 'Surabaya',
            ] : null,
        ];
    }

    /**
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'       => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password'    => ['required', 'string', 'min:6'],
            'name'        => ['required', 'string', 'min:2', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'kelurahanId' => ['nullable', 'string', 'exists:kelurahans,id'],
        ]);

        $user = User::create([
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'phone'        => $validated['phone'] ?? null,
            'kelurahan_id' => $validated['kelurahanId'] ?? null,
            'role'         => 'WARGA',
            'is_active'    => true,
        ]);

        $user->load('kelurahan');
        $token = $this->createToken($user, 'register');

        return response()->json([
            'message'      => 'Registrasi berhasil',
            'accessToken'  => $token,
            'refreshToken' => $token,
            'user'         => $this->userArray($user),
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('kelurahan')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan.'], 403);
        }

        // FIX: Login ke session web juga agar navigasi ke halaman Inertia (/dashboard dsb) berhasil
        Auth::login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = $this->createToken($user, 'login');
        return response()->json([
            'message'      => 'Login berhasil',
            'accessToken'  => $token,
            'refreshToken' => $token,
            'user'         => $this->userArray($user),
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        // Hapus token dari DB
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            DB::table('personal_access_tokens')
                ->where('token', hash('sha256', $bearerToken))
                ->delete();
        }

        // Logout web session jika ada
        if (Auth::check()) {
            Auth::guard('web')->logout();
            if ($request->hasSession()) {
                $request->session()->invalidate();
                $request->session()->regenerateToken();
            }
        }

        return response()->json(['message' => 'Logout berhasil']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $user->load('kelurahan');

        return response()->json(['user' => $this->userArray($user)]);
    }
}
