// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = 'WARGA' | 'PETUGAS' | 'ADMIN';
export type UrgencyLevel = 'rendah' | 'sedang' | 'tinggi' | 'kritis';

// ─── Enums as const objects (iterable with Object.values()) ──────────────────

export const ReportStatus = {
  BARU: 'BARU',
  DIPROSES: 'DIPROSES',
  SELESAI: 'SELESAI',
  DITOLAK: 'DITOLAK',
} as const;
export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

export const ReportCategory = {
  INFRASTRUKTUR: 'INFRASTRUKTUR',
  KEBERSIHAN: 'KEBERSIHAN',
  KEAMANAN: 'KEAMANAN',
  BANJIR: 'BANJIR',
  LAINNYA: 'LAINNYA',
} as const;
export type ReportCategory = typeof ReportCategory[keyof typeof ReportCategory];

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  kelurahan?: Kelurahan;
}

export interface Kelurahan {
  id: string;
  name: string;
  kecamatan: string;
  kota: string;
  centroidLat?: number;
  centroidLng?: number;
}

export interface StatusLog {
  id: string;
  reportId: string;
  fromStatus?: ReportStatus;
  toStatus: ReportStatus;
  note?: string;
  changedAt: string;
  changedBy: Pick<User, 'id' | 'name' | 'role'>;
}

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address?: string;
  kelurahanId?: string;
  kelurahan?: Pick<Kelurahan, 'id' | 'name' | 'kecamatan'>;
  skorUrgensi: number;
  urgensiKeywords: string[];
  photos: string[];
  audioUrl?: string;
  audioTranscript?: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  statusLogs?: StatusLog[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedReports {
  reports: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface LeaderboardEntry {
  kelurahan: Pick<Kelurahan, 'id' | 'name' | 'kecamatan' | 'kota'>;
  totalReports: number;
  resolvedReports: number;
  resolutionRate: number;
  avgResponseHours: number | null;
  score: number;
}

export interface OverviewStats {
  total: number;
  baru: number;
  diproses: number;
  selesai: number;
  highUrgency: number;
  byDay: { date: string; count: number }[];
}

// ─── UI State Types ───────────────────────────────────────────────────────────

export type MapFilter = {
  startDate?: string;
  endDate?: string;
  category?: ReportCategory;
  status?: ReportStatus;
  minScore?: number;
  maxScore?: number;
  kecamatan?: string;
};

export const CATEGORY_LABELS: Record<ReportCategory, string> = {
  INFRASTRUKTUR: 'Infrastruktur',
  KEBERSIHAN: 'Kebersihan',
  KEAMANAN: 'Keamanan',
  BANJIR: 'Banjir',
  LAINNYA: 'Lainnya',
};

export const CATEGORY_ICONS: Record<ReportCategory, string> = {
  INFRASTRUKTUR: 'INFRASTRUKTUR',
  KEBERSIHAN: 'KEBERSIHAN',
  KEAMANAN: 'KEAMANAN',
  BANJIR: 'BANJIR',
  LAINNYA: 'LAINNYA',
};

export const STATUS_LABELS: Record<ReportStatus, string> = {
  BARU: 'Baru',
  DIPROSES: 'Diproses',
  SELESAI: 'Selesai',
  DITOLAK: 'Ditolak',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
};

export function getUrgencyLevel(score: number): UrgencyLevel {
  if (score >= 80) return 'kritis';
  if (score >= 60) return 'tinggi';
  if (score >= 35) return 'sedang';
  return 'rendah';
}

export function getUrgencyColor(score: number): string {
  if (score >= 80) return '#B23327';
  if (score >= 60) return '#C9972F';
  if (score >= 35) return '#C9972F';
  return '#4A7A6E';
}

export function getUrgencySize(score: number): number {
  if (score >= 80) return 22;
  if (score >= 60) return 18;
  if (score >= 35) return 14;
  return 10;
}
