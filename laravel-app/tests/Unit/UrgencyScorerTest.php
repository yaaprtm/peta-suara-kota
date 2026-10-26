<?php

namespace Tests\Unit;

use App\Services\UrgencyScorer;
use PHPUnit\Framework\TestCase;

class UrgencyScorerTest extends TestCase
{
    public function test_category_base_scores(): void
    {
        $banjir = UrgencyScorer::analyzeUrgency('Laporan biasa', 'BANJIR');
        $this->assertEquals(60, $banjir['skorUrgensi']);
        $this->assertEquals('tinggi', $banjir['level']);

        $keamanan = UrgencyScorer::analyzeUrgency('Laporan biasa', 'KEAMANAN');
        $this->assertEquals(50, $keamanan['skorUrgensi']);
        $this->assertEquals('sedang', $keamanan['level']);

        $infrastruktur = UrgencyScorer::analyzeUrgency('Laporan biasa', 'INFRASTRUKTUR');
        $this->assertEquals(40, $infrastruktur['skorUrgensi']);
        $this->assertEquals('sedang', $infrastruktur['level']);

        $kebersihan = UrgencyScorer::analyzeUrgency('Laporan biasa', 'KEBERSIHAN');
        $this->assertEquals(30, $kebersihan['skorUrgensi']);
        $this->assertEquals('rendah', $kebersihan['level']);

        $lainnya = UrgencyScorer::analyzeUrgency('Laporan biasa', 'LAINNYA');
        $this->assertEquals(20, $lainnya['skorUrgensi']);
        $this->assertEquals('rendah', $lainnya['level']);
    }

    public function test_emergency_keywords_and_capping(): void
    {
        // 1 emergency keyword adds 20
        $result = UrgencyScorer::analyzeUrgency('Kondisi sangat gawat darurat ada korban kecelakaan', 'INFRASTRUKTUR');
        // Base 40 + emergency matched (gawat, gawat darurat, korban, kecelakaan) capped at 3 * 20 = 60 => 100
        $this->assertEquals(100, $result['skorUrgensi']);
        $this->assertEquals('kritis', $result['level']);
        $this->assertContains('korban', $result['urgensiKeywords']);
    }

    public function test_negation_words_ignored(): void
    {
        // "tidak bahaya" should NOT match "bahaya"
        $resultWithNegation = UrgencyScorer::analyzeUrgency('Situasi di jalan ini tidak bahaya sama sekali', 'INFRASTRUKTUR');
        $this->assertNotContains('bahaya', $resultWithNegation['urgensiKeywords']);
        $this->assertEquals(40, $resultWithNegation['skorUrgensi']);

        // Without negation it should match
        $resultWithoutNegation = UrgencyScorer::analyzeUrgency('Situasi di jalan ini sangat bahaya sekali', 'INFRASTRUKTUR');
        $this->assertContains('bahaya', $resultWithoutNegation['urgensiKeywords']);
        $this->assertGreaterThan(40, $resultWithoutNegation['skorUrgensi']);
    }
}
