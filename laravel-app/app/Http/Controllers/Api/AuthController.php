<?php

namespace App\Http\Controllers\Api;

use App\Auth\FirestoreUserProvider;
use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use App\Models\Kelurahan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected UserRepositoryInterface $userRepository;
    protected TokenRepositoryInterface $tokenRepository;
    protected KelurahanRepositoryInterface $kelurahanRepository;

    public function __construct(
        UserRepositoryInterface $userRepository,
        TokenRepositoryInterface $tokenRepository,
        KelurahanRepositoryInterface $kelurahanRepository
    ) {
        $this->userRepository = $userRepository;
        $this->tokenRepository = $tokenRepository;
        $this->kelurahanRepository = $kelurahanRepository;
    }

    private function toUserInstance(array $userData): User
    {
        $provider = Auth::guard('web')->getProvider();
        if ($provider instanceof FirestoreUserProvider) {
            return $provider->toUserInstance($userData);
        }

        $user = new User();
        $user->forceFill($userData);
        $user->exists = true;

        if (!empty($userData['kelurahan_id'])) {
            $kelData = $this->kelurahanRepository->findById((string) $userData['kelurahan_id']);
            if ($kelData) {
                $kel = new Kelurahan();
                $kel->forceFill($kelData);
                $kel->exists = true;
                $user->setRelation('kelurahan', $kel);
            }
        }

        return $user;
    }

    private function userArray(User|array $user): array
    {
        if (is_array($user)) {
            $user = $this->toUserInstance($user);
        }

        return [
            'id'          => (string) $user->id,
            'email'       => $user->email,
            'name'        => $user->name,
            'role'        => $user->role,
            'phone'       => $user->phone,
            'avatar'      => $user->avatar,
            'kelurahan'   => $user->kelurahan ? [
                'id'         => (string) $user->kelurahan->id,
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
            'email'       => ['required', 'string', 'email', 'max:255'],
            'password'    => ['required', 'string', 'min:6'],
            'name'        => ['required', 'string', 'min:2', 'max:255'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'kelurahanId' => ['nullable', 'string'],
        ]);

        // Cek unik email di repository
        $existing = $this->userRepository->findByEmail($validated['email']);
        if ($existing) {
            throw ValidationException::withMessages([
                'email' => ['Email sudah terdaftar.'],
            ]);
        }

        // Cek kelurahan jika ada
        if (!empty($validated['kelurahanId'])) {
            $kel = $this->kelurahanRepository->findById($validated['kelurahanId']);
            if (!$kel) {
                throw ValidationException::withMessages([
                    'kelurahanId' => ['Kelurahan tidak valid.'],
                ]);
            }
        }

        $userData = $this->userRepository->create([
            'name'         => $validated['name'],
            'email'        => $validated['email'],
            'password'     => Hash::make($validated['password']),
            'phone'        => $validated['phone'] ?? null,
            'kelurahan_id' => $validated['kelurahanId'] ?? null,
            'role'         => 'WARGA',
            'is_active'    => true,
        ]);

        $user = $this->toUserInstance($userData);
        $token = $this->tokenRepository->createToken($userData['id'], 'register');

        Auth::guard('web')->login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

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

        $userData = $this->userRepository->findByEmail($request->email);

        if (!$userData || !Hash::check($request->password, $userData['password'] ?? '')) {
            return response()->json(['message' => 'Email atau password salah'], 401);
        }

        if (!($userData['is_active'] ?? true)) {
            return response()->json(['message' => 'Akun Anda telah dinonaktifkan.'], 403);
        }

        $user = $this->toUserInstance($userData);

        Auth::guard('web')->login($user, true);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        $token = $this->tokenRepository->createToken($userData['id'], 'login');

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
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $this->tokenRepository->deleteToken($bearerToken);
        }

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

        return response()->json(['user' => $this->userArray($user)]);
    }
}
