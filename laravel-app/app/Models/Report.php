<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'reports';

    protected $fillable = [
        'tracking_code',
        'title',
        'description',
        'category',
        'status',
        'latitude',
        'longitude',
        'address',
        'kelurahan_id',
        'kecamatan',
        'skor_urgensi',
        'upvotes_count',
        'urgensi_keywords',
        'photos',
        'completion_photos',
        'completion_note',
        'audio_url',
        'audio_transcript',
        'user_id',
        'category_id',
        'resolved_at',
    ];

    protected $appends = [
        'urgency_level',
    ];

    protected static function booted(): void
    {
        static::creating(function (Report $report) {
            if (empty($report->tracking_code)) {
                $report->tracking_code = 'PSK-SBY-' . strtoupper(substr(str_replace('-', '', (string) \Illuminate\Support\Str::uuid()), 0, 6));
            }
        });
    }

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'skor_urgensi' => 'integer',
            'upvotes_count' => 'integer',
            'urgensi_keywords' => 'array',
            'photos' => 'array',
            'completion_photos' => 'array',
            'resolved_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function kelurahan(): BelongsTo
    {
        return $this->belongsTo(Kelurahan::class, 'kelurahan_id');
    }

    public function categoryRef(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(StatusLog::class, 'report_id')->orderBy('changed_at', 'desc');
    }

    /**
     * Compute urgency level based on skor_urgensi
     */
    protected function urgencyLevel(): Attribute
    {
        return Attribute::make(
            get: function () {
                $score = $this->skor_urgensi ?? 0;
                if ($score >= 80) return 'kritis';
                if ($score >= 60) return 'tinggi';
                if ($score >= 40) return 'sedang';
                return 'rendah';
            }
        );
    }
}
