/**
 * Urgency Scoring Engine - Rule-based NLP for Bahasa Indonesia
 * 
 * Modular design: swap analyzeUrgency() with ML model later without
 * changing any other code. Scoring: 0-100 (higher = more urgent)
 */

import { ReportCategory } from '@prisma/client';

// ─── Keyword Dictionaries ─────────────────────────────────────────────────────

const EMERGENCY_KEYWORDS = [
  'darurat', 'kritis', 'bahaya', 'berbahaya', 'mengancam', 'jiwa',
  'meninggal', 'korban', 'terluka', 'kecelakaan', 'roboh', 'ambruk',
  'kolaps', 'parah', 'sangat parah', 'gawat', 'gawat darurat',
];

const HIGH_URGENCY_KEYWORDS = [
  'banjir', 'banjir bandang', 'genangan parah', 'jebol', 'amblas',
  'tumbang', 'terblokir', 'blokir', 'tersumbat total', 'gelap total',
  'pencurian', 'perampokan', 'tawuran', 'kebakaran', 'meledak',
  'terjatuh', 'terperosok', 'terseret', 'tenggelam',
  'segera', 'mendesak', 'urgent', 'cepat', 'sekarang juga',
  'sudah lama', 'berbulan', 'bertahun',
];

const MEDIUM_URGENCY_KEYWORDS = [
  'rusak parah', 'hancur', 'retak', 'berlubang', 'amblong',
  'genangan', 'bau', 'jorok', 'kotor', 'kumuh', 'semrawut',
  'macet', 'terhalang', 'mengganggu', 'menyulitkan',
  'minta', 'mohon', 'tolong', 'harap', 'perlu',
  'warga resah', 'warga mengeluh', 'banyak yang',
  'sudah seminggu', 'sudah sebulan', 'lama sekali',
];

const LOW_URGENCY_KEYWORDS = [
  'rusak', 'kotor', 'kurang', 'tidak ada', 'tidak berfungsi',
  'minor', 'kecil', 'sedikit', 'ringan',
];

// ─── Category Base Scores ─────────────────────────────────────────────────────

const CATEGORY_BASE_SCORES: Record<ReportCategory, number> = {
  BANJIR: 60,
  KEAMANAN: 50,
  INFRASTRUKTUR: 40,
  KEBERSIHAN: 30,
  LAINNYA: 20,
};

// ─── Negation Words (simple negation detection) ───────────────────────────────

const NEGATION_WORDS = ['tidak', 'bukan', 'belum', 'tanpa', 'jangan'];

// ─── Scoring Logic ────────────────────────────────────────────────────────────

function containsKeyword(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter(kw => lower.includes(kw));
}

function hasNegationBefore(text: string, keyword: string): boolean {
  const lower = text.toLowerCase();
  const idx = lower.indexOf(keyword);
  if (idx === -1) return false;
  const before = lower.slice(Math.max(0, idx - 30), idx);
  return NEGATION_WORDS.some(neg => before.includes(neg));
}

function scoreKeywords(text: string, keywords: string[], points: number): { score: number; matched: string[] } {
  const matched = containsKeyword(text, keywords).filter(kw => !hasNegationBefore(text, kw));
  const score = Math.min(matched.length * points, points * 3); // cap at 3x
  return { score, matched };
}

export interface UrgencyResult {
  skorUrgensi: number;   // 0-100
  urgensiKeywords: string[];
  level: 'rendah' | 'sedang' | 'tinggi' | 'kritis';
}

/**
 * Main entry point. Swap this function body with ML model later.
 */
export function analyzeUrgency(
  text: string,
  category: ReportCategory
): UrgencyResult {
  const allMatched: string[] = [];
  let score = CATEGORY_BASE_SCORES[category];

  const emergency = scoreKeywords(text, EMERGENCY_KEYWORDS, 20);
  const high = scoreKeywords(text, HIGH_URGENCY_KEYWORDS, 12);
  const medium = scoreKeywords(text, MEDIUM_URGENCY_KEYWORDS, 6);
  const low = scoreKeywords(text, LOW_URGENCY_KEYWORDS, 2);

  score += emergency.score + high.score + medium.score + low.score;

  allMatched.push(...emergency.matched, ...high.matched, ...medium.matched, ...low.matched);
  const uniqueKeywords = [...new Set(allMatched)];

  // Cap at 100
  const finalScore = Math.min(Math.max(Math.round(score), 0), 100);

  const level: UrgencyResult['level'] =
    finalScore >= 80 ? 'kritis' :
    finalScore >= 60 ? 'tinggi' :
    finalScore >= 35 ? 'sedang' : 'rendah';

  return {
    skorUrgensi: finalScore,
    urgensiKeywords: uniqueKeywords,
    level,
  };
}

/**
 * Convert urgency score (0-100) to hex color
 * Palette: cream → amber → terracotta → dark red-brown
 */
export function urgencyToColor(score: number): string {
  if (score >= 80) return '#8B1A1A'; // dark red-brown / kritis
  if (score >= 60) return '#C0392B'; // terracotta / tinggi
  if (score >= 35) return '#E67E22'; // amber-orange / sedang
  return '#8B7355';                  // muted khaki / rendah
}

export function urgencyToSize(score: number): number {
  if (score >= 80) return 22;
  if (score >= 60) return 18;
  if (score >= 35) return 14;
  return 10;
}
