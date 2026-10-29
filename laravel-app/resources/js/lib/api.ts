import type { Report, ReportStatus, CategoryType } from '../types';

const API_HOST = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = API_HOST ? `${API_HOST}/api` : '/api';

// Helper to get CSRF token from cookie or meta tag
function getCsrfToken(): string | null {
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) {
    return meta.getAttribute('content');
  }
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const csrfToken = getCsrfToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(csrfToken ? { 'X-XSRF-TOKEN': csrfToken } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    // FIX: Backend tidak memiliki endpoint /api/auth/refresh, sehingga
    // tryRefreshToken() selalu gagal dan menyebabkan infinite retry + logout paksa.
    // Solusi: langsung hapus token dan lempar error 'Session expired'.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ─── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; password: string; name: string; phone?: string; kelurahanId?: string }) =>
    request<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (email: string, password: string) =>
    request<{ user: unknown; accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: (_token?: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      // FIX: Bearer token sudah dikirim otomatis oleh fungsi request() dari localStorage.
      // Endpoint logout tidak memerlukan body apapun.
    }),

  me: () => request<{ user: unknown }>('/auth/me'),
};

// ─── Reports API ───────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ reports: Report[]; pagination: unknown }>(`/reports${qs}`);
  },

  viewport: (params: {
    bbox?: string;
    zoom?: number;
    limit?: number;
    category?: string;
    status?: string;
    kecamatan?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.bbox) searchParams.set('bbox', params.bbox);
    if (params.zoom !== undefined) searchParams.set('zoom', params.zoom.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.category) searchParams.set('category', params.category);
    if (params.status) searchParams.set('status', params.status);
    if (params.kecamatan) searchParams.set('kecamatan', params.kecamatan);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    const qs = searchParams.toString() ? '?' + searchParams.toString() : '';
    return request<{ reports: Report[]; count: number }>(`/reports/viewport${qs}`);
  },

  nearby: (params: { lat: number; lng: number; radius?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('lat', params.lat.toString());
    searchParams.set('lng', params.lng.toString());
    if (params.radius) searchParams.set('radius', params.radius.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    return request<{
      reports: (Report & { distanceKm: number })[];
      count: number;
      centerLat: number;
      centerLng: number;
      radiusKm: number;
    }>(`/reports/nearby?${searchParams.toString()}`);
  },

  get: (id: string) => request<{ report: Report }>(`/reports/${id}`),

  create: (formData: FormData) =>
    request<{ report: Report; message: string }>('/reports', {
      method: 'POST',
      body: formData,
    }),

  updateStatus: (id: string, status: string, note?: string, completionData?: { completionNote?: string; completionPhotos?: string[] }) =>
    request<{ report: Report }>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        note,
        completion_note: completionData?.completionNote,
        completion_photos: completionData?.completionPhotos,
      }),
    }),

  upvote: (id: string) =>
    request<{ message: string; upvotesCount: number; report: Report }>(`/reports/${id}/upvote`, {
      method: 'POST',
    }),

  track: (code: string) =>
    request<{ report: Report }>(`/reports/track/${encodeURIComponent(code)}`),

  getExportUrl: (category?: string, status?: string) => {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status) params.set('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return `${BASE_URL}/reports/export${qs}`;
  },

  delete: (id: string) =>
    request<void>(`/reports/${id}`, { method: 'DELETE' }),
};

// ─── Kelurahans API ────────────────────────────────────────────────────────────

export const kelurahansApi = {
  list: () => request<{ kelurahans: unknown[] }>('/kelurahans'),
};

// ─── Stats API ─────────────────────────────────────────────────────────────────

export const statsApi = {
  overview: () => request<unknown>('/stats/overview'),
  leaderboard: () => request<{ leaderboard: unknown[] }>('/stats/leaderboard'),
  kecamatanDensity: () =>
    request<{
      density: { kecamatan: string; total: number; avgUrgensi: number }[];
      maxTotal: number;
    }>('/stats/kecamatan-density'),
};

// ─── Users API (Admin only) ────────────────────────────────────────────────────

export const usersApi = {
  list: (params?: { search?: string; role?: string }) => {
    const qs = params && Object.keys(params).length
      ? '?' + new URLSearchParams(params as Record<string, string>).toString()
      : '';
    return request<{ users: unknown[]; total: number }>(`/users${qs}`);
  },

  updateRole: (id: string, role: string) =>
    request<{ user: unknown; message: string }>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  toggleActive: (id: string) =>
    request<{ isActive: boolean; userId: string; message: string }>(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    }),
};

// ─── SSE Helper ────────────────────────────────────────────────────────────────

export function createSSEConnection(
  onNewReport: (report: unknown) => void,
  onStatusUpdate: (data: { reportId: string; newStatus: string }) => void
): EventSource {
  const token = localStorage.getItem('accessToken');
  const url = `${API_HOST}/api/reports/stream${token ? `?token=${token}` : ''}`;
  const es = new EventSource(url);

  es.addEventListener('new_report', e => {
    try { onNewReport(JSON.parse(e.data)); } catch {}
  });

  es.addEventListener('status_update', e => {
    try { onStatusUpdate(JSON.parse(e.data)); } catch {}
  });

  return es;
}
