<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * GET /api/users
     * List all users (ADMIN/SUPERADMIN only)
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::with('kelurahan')->orderBy('created_at', 'desc');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role = $request->query('role')) {
            $query->where('role', strtoupper($role));
        }

        $users = $query->get()->map(fn($u) => [
            'id'        => $u->id,
            'name'      => $u->name,
            'email'     => $u->email,
            'role'      => $u->role,
            'phone'     => $u->phone,
            'isActive'  => $u->is_active,
            'createdAt' => $u->created_at?->toIso8601String(),
            'kelurahan' => $u->kelurahan ? [
                'id'        => $u->kelurahan->id,
                'name'      => $u->kelurahan->name,
                'kecamatan' => $u->kelurahan->kecamatan,
            ] : null,
        ]);

        return response()->json([
            'users' => $users,
            'total' => $users->count(),
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

        $user = User::findOrFail($id);

        // Prevent self-demotion to avoid lock-out
        if ($user->id === $request->user()?->id && $validated['role'] !== 'ADMIN' && $validated['role'] !== 'SUPERADMIN') {
            return response()->json(['message' => 'Tidak dapat mengubah role diri sendiri.'], 422);
        }

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'Role berhasil diperbarui.',
            'user'    => [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'role'  => $user->role,
            ],
        ]);
    }

    /**
     * PATCH /api/users/{id}/toggle-active
     * Activate or deactivate a user account (ADMIN/SUPERADMIN only)
     */
    public function toggleActive(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        // Prevent self-deactivation
        if ($user->id === $request->user()?->id) {
            return response()->json(['message' => 'Tidak dapat menonaktifkan akun sendiri.'], 422);
        }

        $user->update(['is_active' => !$user->is_active]);

        return response()->json([
            'message'  => $user->is_active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan.',
            'isActive' => $user->is_active,
            'userId'   => $user->id,
        ]);
    }
}
