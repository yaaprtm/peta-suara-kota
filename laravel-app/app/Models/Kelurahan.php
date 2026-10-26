<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Kelurahan extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'kelurahans';

    public $timestamps = false;

    protected $fillable = [
        'name',
        'kecamatan',
        'kota',
        'centroid_lat',
        'centroid_lng',
    ];

    protected function casts(): array
    {
        return [
            'centroid_lat' => 'float',
            'centroid_lng' => 'float',
            'created_at' => 'datetime',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'kelurahan_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'kelurahan_id');
    }
}
