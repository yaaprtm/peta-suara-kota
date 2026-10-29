<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Token-based authentication middleware untuk SPA.
 * Validasi Bearer token dari tabel personal_access_tokens.
 */
class AuthenticateWithToken
{
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Sudah ada user dari session? Lanjut
        if ($request->user()) {
            return $next($request);
        }

        // 2. Coba validasi Bearer token
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $hashedToken = hash('sha256', $bearerToken);

            $tokenRecord = DB::table('personal_access_tokens')
                ->where('token', $hashedToken)
                ->first();

            if ($tokenRecord) {
                $user = User::find($tokenRecord->tokenable_id);

                if ($user && $user->is_active) {
                    // Update last_used_at
                    DB::table('personal_access_tokens')
                        ->where('token', $hashedToken)
                        ->update(['last_used_at' => now()]);

                    // Set user di Auth guard DAN request resolver
                    // Keduanya diperlukan agar $request->user() dan Auth::user() bekerja
                    Auth::guard('web')->setUser($user);
                    $request->setUserResolver(fn() => $user);

                    return $next($request);
                }
            }
        }

        return response()->json(['message' => 'Unauthenticated. Silakan login kembali.'], 401);
    }
}
