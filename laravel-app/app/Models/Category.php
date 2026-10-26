<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'categories';

    protected $fillable = [
        'name',
        'type',
        'icon',
        'description',
        'base_score',
    ];

    protected function casts(): array
    {
        return [
            'base_score' => 'integer',
        ];
    }

    public function reports(): HasMany
    {
        return $this->hasMany(Report::class, 'category_id');
    }
}
