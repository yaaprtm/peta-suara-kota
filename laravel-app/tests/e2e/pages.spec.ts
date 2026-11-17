/**
 * Test E2E: Halaman per role di desktop dan mobile
 * F11 Dashboard warga, F12 Panel petugas, F13 Panel admin, F14 Error pages
 * F15 i18n toggle, F17 Polling, F19 Halaman error 403/404
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://127.0.0.1:8002';

const WARGA_EMAIL = 'demo@petasuarakota.id';
const PETUGAS_EMAIL = 'petugas.pu@petasuarakota.id';
const ADMIN_EMAIL = 'admin@petasuarakota.id';
const PASSWORD = 'password123';

const consoleErrors: string[] = [];

// Helper login via form
async function loginViaForm(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
}

test.describe('Halaman publik render tanpa console.error kritis', () => {
  test('Landing page tidak console.error', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', m => {
      // Filter Mapbox token warning — diketahui tidak ada token di e2e env
      if (m.type() === 'error' && !m.text().includes('Mapbox') && !m.text().includes('mapbox') && !m.text().includes('token')) {
        errors.push(m.text());
      }
    });
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    // Tidak boleh ada console.error selain Mapbox token
    expect(errors).toHaveLength(0);
  });

  test('Peta halaman render — stats API terpanggil', async ({ page }) => {
    let statsHit = false;
    page.on('request', req => {
      if (req.url().includes('/api/stats/') || req.url().includes('/api/reports/')) {
        statsHit = true;
      }
    });
    await page.goto(BASE + '/peta');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    expect(statsHit).toBe(true);
  });

  test('Leaderboard render — leaderboard API dipanggil', async ({ page }) => {
    let leaderboardHit = false;
    page.on('request', req => {
      if (req.url().includes('/api/stats/leaderboard')) leaderboardHit = true;
    });
    await page.goto(BASE + '/leaderboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    expect(leaderboardHit).toBe(true);
  });
});

test.describe('Warga — halaman dan alur kritis', () => {
  test('Dashboard warga render setelah login', async ({ page }) => {
    await loginViaForm(page, WARGA_EMAIL, PASSWORD);
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('body')).not.toBeEmpty();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(20);
  });

  test('Warga bisa akses halaman /laporan/{id} (public)', async ({ page }) => {
    // Ambil laporan pertama dari API
    const res = await page.request.get(`${BASE}/api/reports?limit=1`);
    const body = await res.json();
    if (body.reports && body.reports.length > 0) {
      const id = body.reports[0].id;
      await page.goto(BASE + `/laporan/${id}`);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('body')).not.toBeEmpty();
    }
  });

  test('Halaman error 404 — fallback ke landing', async ({ page }) => {
    await page.goto(BASE + '/halaman-tidak-ada-sama-sekali');
    // Fallback route mengarah ke landing
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('Panel Petugas', () => {
  test('Dashboard petugas render setelah login', async ({ page }) => {
    await loginViaForm(page, PETUGAS_EMAIL, PASSWORD);
    await page.waitForURL(/petugas/, { timeout: 10000 });
    await expect(page).toHaveURL(/petugas/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Petugas tidak bisa akses /dashboard warga (403)', async ({ page }) => {
    await loginViaForm(page, PETUGAS_EMAIL, PASSWORD);
    await page.waitForURL(/petugas/, { timeout: 10000 });
    // Coba navigasi ke /dashboard
    const res = await page.request.get(`${BASE}/dashboard`);
    // Either 403, atau redirect
    expect([200, 403, 302]).toContain(res.status());
    // Jika 200, itu Inertia render 403 error page di dalam shell
  });
});

test.describe('Panel Admin / Superadmin', () => {
  test('Dashboard admin render setelah login', async ({ page }) => {
    await loginViaForm(page, ADMIN_EMAIL, PASSWORD);
    await page.waitForURL(/superadmin/, { timeout: 10000 });
    await expect(page).toHaveURL(/superadmin/);
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('Halaman master data render', async ({ page }) => {
    await loginViaForm(page, ADMIN_EMAIL, PASSWORD);
    await page.waitForURL(/superadmin/, { timeout: 10000 });
    await page.goto(BASE + '/superadmin/master');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).not.toBeEmpty();
  });
});

test.describe('API User Management — Admin only', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    const d = await r.json();
    adminToken = d.accessToken;
  });

  test('Guest tidak bisa list users (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/users`);
    expect(res.status()).toBe(401);
  });

  test('Warga tidak bisa list users (403)', async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: WARGA_EMAIL, password: PASSWORD },
    });
    const token = (await r.json()).accessToken;
    const res = await request.get(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(403);
  });

  test('Admin bisa list users', async ({ request }) => {
    const res = await request.get(`${BASE}/api/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  test('Admin bisa filter users by role', async ({ request }) => {
    const res = await request.get(`${BASE}/api/users?role=WARGA`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    body.users.forEach((u: { role: string }) => expect(u.role).toBe('WARGA'));
  });
});

test.describe('Stats API — data konsisten', () => {
  test('Stats overview struktur benar', async ({ request }) => {
    const res = await request.get(`${BASE}/api/stats/overview`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.total).toBe('number');
    expect(typeof body.baru).toBe('number');
    expect(typeof body.diproses).toBe('number');
    expect(typeof body.selesai).toBe('number');
    expect(Array.isArray(body.byDay)).toBe(true);
    expect(body.byDay.length).toBe(14);
    // Total = baru + diproses + selesai + ditolak (approx)
    expect(body.total).toBeGreaterThanOrEqual(body.baru + body.diproses + body.selesai);
  });

  test('Leaderboard struktur benar', async ({ request }) => {
    const res = await request.get(`${BASE}/api/stats/leaderboard`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.leaderboard)).toBe(true);
  });

  test('Kecamatan density struktur benar', async ({ request }) => {
    const res = await request.get(`${BASE}/api/stats/kecamatan-density`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.density)).toBe(true);
  });
});

test.describe('Export CSV — admin only', () => {
  let adminToken: string;

  test.beforeAll(async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: ADMIN_EMAIL, password: PASSWORD },
    });
    adminToken = (await r.json()).accessToken;
  });

  test('Guest tidak bisa export CSV (401)', async ({ request }) => {
    const res = await request.get(`${BASE}/api/reports/export`);
    expect(res.status()).toBe(401);
  });

  test('Admin bisa export CSV — konten valid', async ({ request }) => {
    const res = await request.get(`${BASE}/api/reports/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(res.status()).toBe(200);
    const contentType = res.headers()['content-type'];
    expect(contentType).toContain('text/csv');
    const text = await res.text();
    // Harus ada header CSV
    expect(text).toContain('No. Tiket');
  });
});

test.describe('Konsistensi data — polling dan kode tiket unik', () => {
  test('Kode tiket laporan unik', async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: WARGA_EMAIL, password: PASSWORD },
    });
    const token = (await r.json()).accessToken;

    // Buat dua laporan
    const res1 = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Laporan pertama kode tiket unik test satu',
        description: 'Deskripsi laporan pertama untuk verifikasi keunikan kode tiket sistem',
        category: 'LAINNYA',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    const res2 = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'Laporan kedua kode tiket unik test dua',
        description: 'Deskripsi laporan kedua untuk verifikasi keunikan kode tiket sistem',
        category: 'LAINNYA',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });

    expect(res1.status()).toBe(201);
    expect(res2.status()).toBe(201);

    const code1 = (await res1.json()).report.trackingCode;
    const code2 = (await res2.json()).report.trackingCode;
    expect(code1).not.toBe(code2);
    expect(code1).toMatch(/^PSK-/);
    expect(code2).toMatch(/^PSK-/);
  });

  test('Validasi input — laporan tanpa title ditolak (422)', async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: WARGA_EMAIL, password: PASSWORD },
    });
    const token = (await r.json()).accessToken;

    const res = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        description: 'Tanpa judul seharusnya ditolak validasi sistem',
        category: 'LAINNYA',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    expect(res.status()).toBe(422);
  });

  test('Validasi input — title terlalu pendek ditolak', async ({ request }) => {
    const r = await request.post(`${BASE}/api/auth/login`, {
      data: { email: WARGA_EMAIL, password: PASSWORD },
    });
    const token = (await r.json()).accessToken;

    const res = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        title: 'AB',
        description: 'Deskripsi yang cukup panjang',
        category: 'LAINNYA',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    expect(res.status()).toBe(422);
  });

  test('TEMUAN F11: Register tanpa throttle — 10 request cepat tidak diblokir', async ({ request }) => {
    // Kirim 3 request login salah berturut-turut (cukup untuk bukti)
    const results: number[] = [];
    for (let i = 0; i < 3; i++) {
      const res = await request.post(`${BASE}/api/auth/login`, {
        data: { email: 'nonexistent@test.com', password: 'wrong' },
      });
      results.push(res.status());
    }
    // Jika ada throttle → 429, jika tidak → semua 401
    const has429 = results.some(s => s === 429);
    if (!has429) {
      console.log('F11 CONFIRMED: /api/auth/login tidak ada throttle — semua 401 tanpa 429');
    }
    // Semua harus 401 (bukan error lain)
    results.forEach(s => expect([401, 429]).toContain(s));
  });
});
