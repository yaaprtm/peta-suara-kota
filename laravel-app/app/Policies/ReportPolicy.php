<?php

namespace App\Policies;

use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    /**
     * Determine whether the user can create reports.
     */
    public function create(User $user): bool
    {
        return $user !== null && $user->is_active;
    }

    /**
     * Determine whether the user can update the report status.
     */
    public function updateStatus(User $user, Report $report): bool
    {
        return in_array($user->role, ['PETUGAS', 'ADMIN', 'SUPERADMIN']);
    }

    /**
     * Determine whether the user can delete the report.
     */
    public function delete(User $user, Report $report): bool
    {
        return $report->user_id === $user->id || in_array($user->role, ['ADMIN', 'SUPERADMIN']);
    }
}
