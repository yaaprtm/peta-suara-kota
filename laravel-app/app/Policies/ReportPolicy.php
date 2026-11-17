<?php

namespace App\Policies;

use App\Models\User;

class ReportPolicy
{
    /**
     * Determine whether the user can create reports.
     */
    public function create(?User $user): bool
    {
        return $user !== null && (bool) $user->is_active;
    }

    /**
     * Determine whether the user can update the report status.
     */
    public function updateStatus(User $user, mixed $report = null): bool
    {
        return in_array($user->role, ['PETUGAS', 'ADMIN', 'SUPERADMIN'], true);
    }

    /**
     * Determine whether the user can delete the report.
     */
    public function delete(User $user, mixed $report): bool
    {
        $reportUserId = is_array($report)
            ? ($report['reporter_id'] ?? $report['user_id'] ?? null)
            : ($report->reporter_id ?? $report->user_id ?? null);

        return $reportUserId === $user->id || in_array($user->role, ['ADMIN', 'SUPERADMIN'], true);
    }
}
