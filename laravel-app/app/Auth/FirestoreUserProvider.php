<?php

namespace App\Auth;

use App\Contracts\Repositories\KelurahanRepositoryInterface;
use App\Contracts\Repositories\UserRepositoryInterface;
use App\Models\Kelurahan;
use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\UserProvider;
use Illuminate\Support\Facades\Hash;

class FirestoreUserProvider implements UserProvider
{
    protected UserRepositoryInterface $userRepository;
    protected ?KelurahanRepositoryInterface $kelurahanRepository;

    public function __construct(
        UserRepositoryInterface $userRepository,
        ?KelurahanRepositoryInterface $kelurahanRepository = null
    ) {
        $this->userRepository = $userRepository;
        $this->kelurahanRepository = $kelurahanRepository;
    }

    /**
     * Membentuk instance Authenticatable User dari array data
     */
    public function toUserInstance(?array $data): ?User
    {
        if (!$data) {
            return null;
        }

        $user = new User();
        $user->forceFill($data);
        $user->exists = true;

        // Pasang relasi kelurahan jika ada kelurahan_id dan StaticKelurahanRepository tersedia
        if (!empty($data['kelurahan_id']) && $this->kelurahanRepository) {
            $kelData = $this->kelurahanRepository->findById((string) $data['kelurahan_id']);
            if ($kelData) {
                $kel = new Kelurahan();
                $kel->forceFill($kelData);
                $kel->exists = true;
                $user->setRelation('kelurahan', $kel);
            }
        }

        return $user;
    }

    public function retrieveById($identifier): ?Authenticatable
    {
        $data = $this->userRepository->findById((string) $identifier);
        return $this->toUserInstance($data);
    }

    public function retrieveByToken($identifier, $token): ?Authenticatable
    {
        $user = $this->retrieveById($identifier);
        if (!$user) {
            return null;
        }

        $rememberToken = $user->getRememberToken();
        return $rememberToken && hash_equals($rememberToken, $token) ? $user : null;
    }

    public function updateRememberToken(Authenticatable $user, $token): void
    {
        $this->userRepository->update($user->getAuthIdentifier(), [
            'remember_token' => $token,
        ]);
    }

    public function retrieveByCredentials(array $credentials): ?Authenticatable
    {
        if (empty($credentials) || (count($credentials) === 1 && array_key_exists('password', $credentials))) {
            return null;
        }

        $email = $credentials['email'] ?? null;
        if (!$email) {
            return null;
        }

        $data = $this->userRepository->findByEmail($email);
        return $this->toUserInstance($data);
    }

    public function validateCredentials(Authenticatable $user, array $credentials): bool
    {
        $plain = $credentials['password'] ?? '';
        return Hash::check($plain, $user->getAuthPassword());
    }

    public function rehashPasswordIfRequired(Authenticatable $user, array $credentials, bool $force = false): void
    {
        // No-op for now
    }
}
