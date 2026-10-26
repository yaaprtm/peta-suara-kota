<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'category' => $this->category,
            'status' => $this->status,
            'latitude' => (float) $this->latitude,
            'longitude' => (float) $this->longitude,
            'address' => $this->address,
            'kelurahanId' => $this->kelurahan_id,
            'kecamatan' => $this->kecamatan,
            'skorUrgensi' => (int) $this->skor_urgensi,
            'urgensiKeywords' => $this->urgensi_keywords ?? [],
            'urgencyLevel' => $this->urgency_level,
            'photos' => $this->photos ?? [],
            'audioUrl' => $this->audio_url,
            'audioTranscript' => $this->audio_transcript,
            'userId' => $this->user_id,
            'categoryId' => $this->category_id,
            'createdAt' => $this->created_at?->toISOString(),
            'updatedAt' => $this->updated_at?->toISOString(),
            'user' => $this->whenLoaded('user', function () {
                return [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'avatar' => $this->user->avatar,
                ];
            }),
            'kelurahan' => $this->whenLoaded('kelurahan', function () {
                if (!$this->kelurahan) return null;
                return [
                    'id' => $this->kelurahan->id,
                    'name' => $this->kelurahan->name,
                    'kecamatan' => $this->kelurahan->kecamatan,
                ];
            }),
            'categoryRef' => $this->whenLoaded('categoryRef'),
            'statusLogs' => $this->whenLoaded('statusLogs', function () {
                return $this->statusLogs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'reportId' => $log->report_id,
                        'fromStatus' => $log->from_status,
                        'toStatus' => $log->to_status,
                        'note' => $log->note,
                        'changedById' => $log->changed_by_id,
                        'changedAt' => $log->changed_at?->toISOString() ?? $log->created_at?->toISOString(),
                        'changedBy' => $log->relationLoaded('changedBy') && $log->changedBy ? [
                            'id' => $log->changedBy->id,
                            'name' => $log->changedBy->name,
                            'role' => $log->changedBy->role,
                        ] : null,
                    ];
                });
            }),
        ];
    }
}
