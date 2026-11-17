<?php

namespace App\Http\Middleware;

use App\Auth\FirestoreUserProvider;
use App\Contracts\Repositories\TokenRepositoryInterface;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Token-based authentication middleware untuk SPA.
 * Validasi Bearer token via TokenRepositoryInterface (Firestore / InMemory).
 */
class AuthenticateWithToken
{
    protected TokenRepositoryInterface $tokenRepository;

    public function __construct(TokenRepositoryInterface $tokenRepository)
    {
        $this->tokenRepository = $tokenRepository;
    }

    public function handle(Request $request, Closure $next): Response
    {
        // 1. Sudah ada user dari session? Lanjut
        if ($request->user()) {
            return $next($request);
        }

        // 2. Coba validasi Bearer token
        $bearerToken = $request->bearerToken();
        if ($bearerToken) {
            $userArray = $this->tokenRepository->findUserByToken($bearerToken);

            if ($userArray && ($userArray['is_active'] ?? true)) {
                $provider = Auth::guard('web')->getProvider();

                if ($provider instanceof FirestoreUserProvider) {
                    $user = $provider->toUserInstance($userArray);
                } else {
                    $user = new User();
                    $user->forceFill($userArray);
                    $user->exists = true;
                }

                Auth::guard('web')->setUser($user);
                $request->setUserResolver(fn() => $user);

                return $next($request);
            }
        }

        return response()->json(['message' => 'Unauthenticated. Silakan login kembali.'], 401);
    }
}
