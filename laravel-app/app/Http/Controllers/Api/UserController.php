<?php

namespace App\Http\Controllers\Api;

use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    protected UserRepositoryInterface $userRepository;
    protected KelurahanRepositoryInterface $kelurahanRepository;

    public function __construct(
        UserRepositoryInterface $userRepository,
        KelurahanRepositoryInterface $kelurahanRepository
    ) {
        $this->userRepository = $userRepository;
        $this->kelurahanRepository = $kelurahanRepository;
    }

    /**
     * GET /api/users
     * List all users (ADMIN/SUPERADMIN only)
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [];
        if ($search = $request->query('search')) {
            $filters['search'] = $search;
        }
        if ($role = $request->query('role')) {
            $filters['role'] = $role;
        }

        $rawUsers = $this->userRepository->list($filters, 100, 0);

        $users = array_map(function ($u) {
            $kelurahan = null;
            if (!empty($u['kelurahan_id'])) {
                $k = $this->kelurahanRepository->findById((string) $u['kelurahan_id']);
                if ($k) {
                    $kelurahan = [
                        'id'        => (string) $k['id'],
                        'name'      => $k['name'],
                        'kecamatan' => $k['kecamatan'],
                    ];
                }
            }

            return [
                'id'        => (string) $u['id'],
                'name'      => $u['name'] ?? '',
                'email'     => $u['email'] ?? '',
                'role'      => $u['role'] ?? 'WARGA',
                'phone'     => $u['phone'] ?? null,
                'isActive'  => (bool) ($u['is_active'] ?? true),
                'createdAt' => $u['created_at'] ?? null,
                'kelurahan' => $kelurahan,
            ];
        }, $rawUsers);

        return response()->json([
            'users' => $users,
            'total' => count($users),
        ]);
    }

    /**
     * PATCH /api/users/{id}/role
     * Update a user's role (ADMIN/SUPERADMIN only)
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::in(['WARGA', 'PETUGAS', 'ADMIN', 'SUPERADMIN'])],
        ]);

        $currentUser = $request->user();
        if ($currentUser && (string) $currentUser->id === (string) $id && $validated['role'] !== 'ADMIN' && $validated['role'] !== 'SUPERADMIN') {
            return response()->json(['message' => 'Tidak dapat mengubah role diri sendiri.'], 422);
        }

        $updated = $this->userRepository->updateRole($id, $validated['role']);
        if (!$updated) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        return response()->json([
            'message' => 'Role berhasil diperbarui.',
            'user'    => [
                'id'    => (string) $updated['id'],
                'name'  => $updated['name'],
                'email' => $updated['email'],
                'role'  => $updated['role'],
            ],
        ]);
    }

    /**
     * PATCH /api/users/{id}/toggle-active
     * Activate or deactivate a user account (ADMIN/SUPERADMIN only)
     */
    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser && (string) $currentUser->id === (string) $id) {
            return response()->json(['message' => 'Tidak dapat menonaktifkan akun sendiri.'], 422);
        }

        $updated = $this->userRepository->toggleActive($id);
        if (!$updated) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $isActive = (bool) ($updated['is_active'] ?? true);

        return response()->json([
            'message'  => $isActive ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.',
            'isActive' => $isActive,
        ]);
    }
}
