const BASE_URL = '/api';

// ─── HTTP helpers ──────────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      const newToken = localStorage.getItem('accessToken');
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryRes = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
      if (!retryRes.ok) {
        const err = await retryRes.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(err.message || 'Request failed');
      }
      return retryRes.json();
    } else {
      // Force logout
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return true;
  } catch {
    return false;
  }
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

  logout: (refreshToken: string) =>
    request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  me: () => request<{ user: unknown }>('/auth/me'),
};

// ─── Reports API ───────────────────────────────────────────────────────────────

export const reportsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ reports: unknown[]; pagination: unknown }>(`/reports${qs}`);
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
    return request<{ reports: unknown[]; count: number }>(`/reports/viewport${qs}`);
  },

  get: (id: string) => request<{ report: unknown }>(`/reports/${id}`),

  create: (formData: FormData) =>
    request<{ report: unknown; message: string }>('/reports', {
      method: 'POST',
      body: formData,
    }),

  updateStatus: (id: string, status: string, note?: string) =>
    request<{ report: unknown }>(`/reports/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),

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
};

// ─── SSE Helper ────────────────────────────────────────────────────────────────

export function createSSEConnection(
  onNewReport: (report: unknown) => void,
  onStatusUpdate: (data: { reportId: string; newStatus: string }) => void
): EventSource {
  const token = localStorage.getItem('accessToken');
  const url = `/api/reports/stream${token ? `?token=${token}` : ''}`;
  const es = new EventSource(url);

  es.addEventListener('new_report', e => {
    try { onNewReport(JSON.parse(e.data)); } catch {}
  });

  es.addEventListener('status_update', e => {
    try { onStatusUpdate(JSON.parse(e.data)); } catch {}
  });

  return es;
}
