<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$roles
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect()->guest(route('login'));
        }

        $userRole = strtoupper((string) ($user->role ?? 'WARGA'));
        $allowedRoles = array_map('strtoupper', $roles);

        if (in_array($userRole, $allowedRoles, true)) {
            return $next($request);
        }

        // Allow SUPERADMIN if ADMIN is requested
        if (in_array('ADMIN', $allowedRoles, true) && $userRole === 'SUPERADMIN') {
            return $next($request);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return response()->json([
                'message' => 'Akses ditolak. Anda tidak memiliki izin untuk mengakses halaman ini.',
            ], 403);
        }

        return Inertia::render('Errors/403', [
            'status' => 403,
            'message' => 'Akses Ditolak. Anda tidak memiliki hak akses untuk membuka halaman ini.',
        ])->toResponse($request)->setStatusCode(403);
    }
}
