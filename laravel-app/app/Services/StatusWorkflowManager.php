<?php

namespace App\Services;

class StatusWorkflowManager
{
    /**
     * Valid status transitions.
     * Key = current status, Value = array of allowed next statuses
     */
    private const VALID_TRANSITIONS = [
        'BARU' => ['DIPROSES', 'SELESAI', 'DITOLAK'],
        'DIPROSES' => ['SELESAI', 'DITOLAK', 'BARU'], // Can revert to BARU if needed
        'SELESAI' => [], // Terminal state
        'DITOLAK' => ['BARU'], // Can reopen rejected report
    ];

    /**
     * Check if a status transition is valid.
     *
     * @param  string  $fromStatus
     * @param  string  $toStatus
     * @return bool
     */
    public static function canTransition(string $fromStatus, string $toStatus): bool
    {
        // Same status is always allowed (no-op)
        if ($fromStatus === $toStatus) {
            return true;
        }

        $allowedTransitions = self::VALID_TRANSITIONS[$fromStatus] ?? [];

        return in_array($toStatus, $allowedTransitions, true);
    }

    /**
     * Get all valid next statuses from current status.
     *
     * @param  string  $currentStatus
     * @return array
     */
    public static function getValidNextStatuses(string $currentStatus): array
    {
        return self::VALID_TRANSITIONS[$currentStatus] ?? [];
    }

    /**
     * Get human-readable error message for invalid transition.
     *
     * @param  string  $fromStatus
     * @param  string  $toStatus
     * @return string
     */
    public static function getTransitionErrorMessage(string $fromStatus, string $toStatus): string
    {
        $validNext = self::getValidNextStatuses($fromStatus);

        if (empty($validNext)) {
            return "Status '{$fromStatus}' tidak dapat diubah karena sudah mencapai status akhir.";
        }

        $validNextFormatted = implode(', ', array_map(
            fn($status) => self::getStatusLabel($status),
            $validNext
        ));

        return "Tidak dapat mengubah status dari '{$fromStatus}' ke '{$toStatus}'. "
            . "Status yang valid berikutnya: {$validNextFormatted}.";
    }

    /**
     * Get human-readable label for status.
     *
     * @param  string  $status
     * @return string
     */
    public static function getStatusLabel(string $status): string
    {
        return match ($status) {
            'BARU' => 'Baru',
            'DIPROSES' => 'Sedang Diproses',
            'SELESAI' => 'Selesai',
            'DITOLAK' => 'Ditolak',
            default => $status,
        };
    }

    /**
     * Get status color for UI.
     *
     * @param  string  $status
     * @return string
     */
    public static function getStatusColor(string $status): string
    {
        return match ($status) {
            'BARU' => '#3B82F6', // Blue
            'DIPROSES' => '#F59E0B', // Amber
            'SELESAI' => '#10B981', // Green
            'DITOLAK' => '#EF4444', // Red
            default => '#6B7280', // Gray
        };
    }

    /**
     * Check if completion note is required for this transition.
     *
     * @param  string  $toStatus
     * @return bool
     */
    public static function requiresCompletionNote(string $toStatus): bool
    {
        return in_array($toStatus, ['SELESAI', 'DITOLAK'], true);
    }

    /**
     * Validate transition with detailed result.
     *
     * @param  string  $fromStatus
     * @param  string  $toStatus
     * @return array{valid: bool, message: string|null}
     */
    public static function validateTransition(string $fromStatus, string $toStatus): array
    {
        if (!self::canTransition($fromStatus, $toStatus)) {
            return [
                'valid' => false,
                'message' => self::getTransitionErrorMessage($fromStatus, $toStatus),
            ];
        }

        return [
            'valid' => true,
            'message' => null,
        ];
    }

    /**
     * Get all available statuses.
     *
     * @return array
     */
    public static function getAllStatuses(): array
    {
        return ['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK'];
    }

    /**
     * Check if status is a terminal state (no further transitions).
     *
     * @param  string  $status
     * @return bool
     */
    public static function isTerminalStatus(string $status): bool
    {
        return empty(self::VALID_TRANSITIONS[$status] ?? []);
    }
}

