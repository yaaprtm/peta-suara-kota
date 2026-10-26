// ─── Domain Types ─────────────────────────────────────────────────────────────

export type UserRole = 'WARGA' | 'PETUGAS' | 'ADMIN' | 'SUPERADMIN';
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
export type CategoryType = ReportCategory;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  kelurahan?: Kelurahan;
  isActive?: boolean;
  createdAt?: string;
}

export interface MasterCategory {
  id: string;
  name: string;
  type: ReportCategory;
  icon: string;
  description: string;
  baseScore: number;
}

export interface MasterLevel {
  level: UrgencyLevel;
  name: string;
  minScore: number;
  maxScore: number;
  color: string;
  targetResponseHours: number;
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
  trackingCode?: string;
  title: string;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address?: string;
  kelurahanId?: string;
  kelurahan?: Pick<Kelurahan, 'id' | 'name' | 'kecamatan'>;
  kecamatan?: string;
  skorUrgensi: number;
  upvotesCount?: number;
  urgensiKeywords: string[];
  photos: string[];
  completionPhotos?: string[];
  completionNote?: string;
  audioUrl?: string;
  audioTranscript?: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatar'>;
  statusLogs?: StatusLog[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
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
  categories?: ReportCategory[];
  status?: ReportStatus;
  minScore?: number;
  maxScore?: number;
  kecamatan?: string;
  onlyCritical?: boolean;
};

export const CATEGORY_COLORS: Record<ReportCategory, string> = {
  INFRASTRUKTUR: '#3E5C76',
  KEBERSIHAN: '#5E7C4A',
  KEAMANAN: '#5B3F6E',
  BANJIR: '#2A7F86',
  LAINNYA: '#8A7F70',
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

export const STATUS_LABELS_SURABAYA: Record<ReportStatus, string> = {
  BARU: 'Baru masuk',
  DIPROSES: 'Lagi diproses',
  SELESAI: 'Wes beres',
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
  if (score >= 80) return '#DC2626';
  if (score >= 60) return '#EA580C';
  if (score >= 35) return '#F5A524';
  return '#10B981';
}

export function getUrgencySize(score: number): number {
  if (score >= 80) return 22;
  if (score >= 60) return 18;
  if (score >= 35) return 14;
  return 10;
}

// ─── Inertia Page Props ───────────────────────────────────────────────────────

export interface PageProps {
  auth: {
    user: User | null;
  };
  flash?: {
    success?: string;
    error?: string;
  };
  mapboxToken?: string;
}
