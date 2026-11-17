<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * User model — dipertahankan sebagai Authenticatable untuk integrasi
 * sesi Laravel (FirestoreUserProvider meng-hydrate instance ini dari
 * data Firestore). Tidak terhubung ke tabel SQL mana pun.
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    /**
     * Nama tabel — tidak digunakan (Firestore), tapi diperlukan
     * oleh Authenticatable contract agar tidak melempar error.
     */
    protected $table = 'users';

    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'avatar',
        'kelurahan_id',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'is_active'         => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Helper role (tidak ada relasi SQL — data kelurahan, reports, dll.
    // diakses via repository Firestore, bukan Eloquent relation)
    // -------------------------------------------------------------------------

    public function isWarga(): bool
    {
        return $this->role === 'WARGA';
    }

    public function isPetugas(): bool
    {
        return $this->role === 'PETUGAS';
    }

    public function isAdmin(): bool
    {
        return in_array($this->role, ['ADMIN', 'SUPERADMIN']);
    }

    public function isSuperadmin(): bool
    {
        return $this->role === 'SUPERADMIN';
    }
}
