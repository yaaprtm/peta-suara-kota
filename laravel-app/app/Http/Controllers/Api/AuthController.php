<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'kelurahanId' => ['nullable', 'string', 'exists:kelurahans,id'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'kelurahan_id' => $validated['kelurahanId'] ?? null,
            'role' => 'WARGA',
            'is_active' => true,
        ]);

        Auth::login($user);
        $request->session()->regenerate();
        $token = bin2hex(random_bytes(32));

        return response()->json([
            'message' => 'Registrasi berhasil',
            'accessToken' => $token,
            'refreshToken' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'phone' => $user->phone,
                'kelurahanId' => $user->kelurahan_id,
            ],
        ], 201);
    }

    /**
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('kelurahan')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password) || !$user->is_active) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        Auth::login($user);
        $request->session()->regenerate();
        $token = bin2hex(random_bytes(32));

        return response()->json([
            'message' => 'Login berhasil',
            'accessToken' => $token,
            'refreshToken' => $token,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'kelurahan' => $user->kelurahan ? [
                    'id' => $user->kelurahan->id,
                    'name' => $user->kelurahan->name,
                    'kecamatan' => $user->kelurahan->kecamatan,
                ] : null,
            ],
        ]);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

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

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
                'phone' => $user->phone,
                'avatar' => $user->avatar,
                'kelurahan' => $user->kelurahan ? [
                    'id' => $user->kelurahan->id,
                    'name' => $user->kelurahan->name,
                    'kecamatan' => $user->kelurahan->kecamatan,
                ] : null,
            ],
        ]);
    }
}
