<?php

namespace App\Services;

class UrgencyScorer
{
    private const EMERGENCY_KEYWORDS = [
        'darurat', 'kritis', 'bahaya', 'berbahaya', 'mengancam', 'jiwa',
        'meninggal', 'korban', 'terluka', 'kecelakaan', 'roboh', 'ambruk',
        'kolaps', 'parah', 'sangat parah', 'gawat', 'gawat darurat',
    ];

    private const HIGH_URGENCY_KEYWORDS = [
        'banjir', 'banjir bandang', 'genangan parah', 'jebol', 'amblas',
        'tumbang', 'terblokir', 'blokir', 'tersumbat total', 'gelap total',
        'pencurian', 'perampokan', 'tawuran', 'kebakaran', 'meledak',
        'terjatuh', 'terperosok', 'terseret', 'tenggelam',
        'segera', 'mendesak', 'urgent', 'cepat', 'sekarang juga',
        'sudah lama', 'berbulan', 'bertahun',
    ];

    private const MEDIUM_URGENCY_KEYWORDS = [
        'rusak parah', 'hancur', 'retak', 'berlubang', 'amblong',
        'genangan', 'bau', 'jorok', 'kotor', 'kumuh', 'semrawut',
        'macet', 'terhalang', 'mengganggu', 'menyulitkan',
        'minta', 'mohon', 'tolong', 'harap', 'perlu',
        'warga resah', 'warga mengeluh', 'banyak yang',
        'sudah seminggu', 'sudah sebulan', 'lama sekali',
    ];

    private const LOW_URGENCY_KEYWORDS = [
        'rusak', 'kotor', 'kurang', 'tidak ada', 'tidak berfungsi',
        'minor', 'kecil', 'sedikit', 'ringan',
    ];

    private const CATEGORY_BASE_SCORES = [
        'BANJIR' => 60,
        'KEAMANAN' => 50,
        'INFRASTRUKTUR' => 40,
        'KEBERSIHAN' => 30,
        'LAINNYA' => 20,
    ];

    private const NEGATION_WORDS = ['tidak', 'bukan', 'belum', 'tanpa', 'jangan'];

    /**
     * Analyze urgency from text and category.
     *
     * @return array{skorUrgensi: int, urgensiKeywords: array<string>, level: string}
     */
    public static function analyzeUrgency(string $text, string $category): array
    {
        $categoryUpper = strtoupper($category);
        $score = self::CATEGORY_BASE_SCORES[$categoryUpper] ?? 20;

        $emergency = self::scoreKeywords($text, self::EMERGENCY_KEYWORDS, 20);
        $high = self::scoreKeywords($text, self::HIGH_URGENCY_KEYWORDS, 12);
        $medium = self::scoreKeywords($text, self::MEDIUM_URGENCY_KEYWORDS, 6);
        $low = self::scoreKeywords($text, self::LOW_URGENCY_KEYWORDS, 2);

        $score += $emergency['score'] + $high['score'] + $medium['score'] + $low['score'];

        $allMatched = array_merge(
            $emergency['matched'],
            $high['matched'],
            $medium['matched'],
            $low['matched']
        );
        $uniqueKeywords = array_values(array_unique($allMatched));

        $finalScore = min(max((int) round($score), 0), 100);

        $level = match (true) {
            $finalScore >= 80 => 'kritis',
            $finalScore >= 60 => 'tinggi',
            $finalScore >= 35 => 'sedang',
            default => 'rendah',
        };

        return [
            'skorUrgensi' => $finalScore,
            'urgensiKeywords' => $uniqueKeywords,
            'level' => $level,
        ];
    }

    private static function containsKeyword(string $text, array $keywords): array
    {
        $lower = mb_strtolower($text, 'UTF-8');
        return array_values(array_filter($keywords, fn($kw) => str_contains($lower, $kw)));
    }

    private static function hasNegationBefore(string $text, string $keyword): bool
    {
        $lower = mb_strtolower($text, 'UTF-8');
        $idx = mb_strpos($lower, $keyword);
        if ($idx === false) {
            return false;
        }

        $start = max(0, $idx - 30);
        $before = mb_substr($lower, $start, $idx - $start);

        foreach (self::NEGATION_WORDS as $neg) {
            if (str_contains($before, $neg)) {
                return true;
            }
        }

        return false;
    }

    private static function scoreKeywords(string $text, array $keywords, int $points): array
    {
        $matched = array_values(array_filter(
            self::containsKeyword($text, $keywords),
            fn($kw) => !self::hasNegationBefore($text, $kw)
        ));

        // Cap at 3x points
        $score = min(count($matched) * $points, $points * 3);

        return [
            'score' => $score,
            'matched' => $matched,
        ];
    }

    public static function urgencyToColor(int $score): string
    {
        if ($score >= 80) return '#8B1A1A';
        if ($score >= 60) return '#C0392B';
        if ($score >= 35) return '#E67E22';
        return '#8B7355';
    }

    public static function urgencyToSize(int $score): int
    {
        if ($score >= 80) return 22;
        if ($score >= 60) return 18;
        if ($score >= 35) return 14;
        return 10;
    }
}
