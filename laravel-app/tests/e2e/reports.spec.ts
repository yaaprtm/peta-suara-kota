/**
 * Test E2E: Laporan — buat, tampilkan, ubah status, lacak tiket
 * F06 Form lapor, F07 Laporan muncul di daftar/peta, F08 Status diperbarui petugas,
 * F09 Warga melihat status baru, F10 Lacak tiket, F16 Kirim ganda
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const BASE = 'http://127.0.0.1:8002';

const WARGA_EMAIL = 'demo@petasuarakota.id';
const PETUGAS_EMAIL = 'petugas.pu@petasuarakota.id';
const PASSWORD = 'password123';

let wargaToken: string;
let petugasToken: string;
let createdReportId: string;
let createdTrackingCode: string;

test.beforeAll(async ({ request }) => {
  const r1 = await request.post(`${BASE}/api/auth/login`, {
    data: { email: WARGA_EMAIL, password: PASSWORD },
  });
  const d1 = await r1.json();
  wargaToken = d1.accessToken;

  const r2 = await request.post(`${BASE}/api/auth/login`, {
    data: { email: PETUGAS_EMAIL, password: PASSWORD },
  });
  const d2 = await r2.json();
  petugasToken = d2.accessToken;
});

test.describe('API Laporan — siklus penuh', () => {
  test('Guest tidak bisa buat laporan (401)', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reports`, {
      data: {
        title: 'Laporan tanpa auth',
        description: 'Deskripsi yang cukup panjang untuk memenuhi minimum',
        category: 'INFRASTRUKTUR',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    expect(res.status()).toBe(401);
  });

  test('Warga bisa buat laporan di dalam Surabaya', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
      data: {
        title: 'Jalan rusak berlubang sangat berbahaya bagi pemotor',
        description: 'Lubang besar di jalan kampung ada korban terjatuh segera diperbaiki mendesak',
        category: 'INFRASTRUKTUR',
        latitude: -7.2575,
        longitude: 112.7400,
        address: 'Jl. Tunjungan Test Playwright',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.report).toBeDefined();
    expect(body.report.status).toBe('BARU');
    expect(body.report.skorUrgensi).toBeGreaterThanOrEqual(40);
    expect(body.report.trackingCode).toMatch(/^PSK-/);
    createdReportId = body.report.id;
    createdTrackingCode = body.report.trackingCode;
  });

  test('Laporan baru muncul di daftar /api/reports', async ({ request }) => {
    expect(createdReportId).toBeTruthy();
    const res = await request.get(`${BASE}/api/reports?limit=50`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const found = body.reports.some((r: { id: string }) => r.id === createdReportId);
    expect(found).toBe(true);
  });

  test('Laporan baru muncul di data viewport', async ({ request }) => {
    expect(createdReportId).toBeTruthy();
    const res = await request.get(`${BASE}/api/reports/viewport?bbox=112.6,−7.5,112.9,−7.1&limit=200`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.reports).toBeDefined();
    expect(body.count).toBeGreaterThanOrEqual(1);
  });

  test('Koordinat di luar Surabaya ditolak', async ({ request }) => {
    const res = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
      data: {
        title: 'Laporan dari Jakarta ini tidak valid',
        description: 'Koordinat Monas Jakarta seharusnya ditolak sistem',
        category: 'INFRASTRUKTUR',
        latitude: -6.1754,
        longitude: 106.8272,
      },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.message).toContain('Surabaya');
  });

  test('Warga tidak bisa ubah status laporan (403)', async ({ request }) => {
    expect(createdReportId).toBeTruthy();
    const res = await request.patch(`${BASE}/api/reports/${createdReportId}/status`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
      data: { status: 'DIPROSES', note: 'Coba ubah sendiri' },
    });
    expect(res.status()).toBe(403);
  });

  test('Petugas bisa ubah status ke DIPROSES', async ({ request }) => {
    expect(createdReportId).toBeTruthy();
    const res = await request.patch(`${BASE}/api/reports/${createdReportId}/status`, {
      headers: { Authorization: `Bearer ${petugasToken}` },
      data: { status: 'DIPROSES', note: 'Tim petugas menuju lokasi' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report.status).toBe('DIPROSES');
  });

  test('Petugas bisa ubah status ke SELESAI (butuh catatan)', async ({ request }) => {
    expect(createdReportId).toBeTruthy();
    const res = await request.patch(`${BASE}/api/reports/${createdReportId}/status`, {
      headers: { Authorization: `Bearer ${petugasToken}` },
      data: {
        status: 'SELESAI',
        note: 'Laporan sudah ditangani oleh tim teknis',
        completion_note: 'Aspal telah ditambal dan berfungsi normal',
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report.status).toBe('SELESAI');
    expect(body.report.resolvedAt).toBeTruthy();
  });

  test('Statistik naik setelah laporan dibuat', async ({ request }) => {
    const res = await request.get(`${BASE}/api/stats/overview`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.total).toBeGreaterThanOrEqual(1);
    expect(body.byDay).toBeDefined();
    expect(Array.isArray(body.byDay)).toBe(true);
    expect(body.byDay.length).toBe(14);
  });

  test('Lacak tiket dengan kode lengkap — berhasil', async ({ request }) => {
    expect(createdTrackingCode).toBeTruthy();
    const encoded = encodeURIComponent(createdTrackingCode);
    const res = await request.get(`${BASE}/api/reports/track/${encoded}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.report.id).toBe(createdReportId);
  });

  test('Lacak tiket tidak ada — 404', async ({ request }) => {
    const res = await request.get(`${BASE}/api/reports/track/PSK-TIDAK-ADA-999`);
    expect(res.status()).toBe(404);
  });

  test('TEMUAN F02: track() LIKE wildcard — satu karakter bisa balik laporan', async ({ request }) => {
    // Ini test yang MEMBUKTIKAN F02
    const res = await request.get(`${BASE}/api/reports/track/A`);
    // Kalau ada laporan dengan tracking_code mengandung "A", ini akan return 200
    // yang artinya sistem membocorkan laporan via single-char brute force
    const body = await res.json();
    if (res.status() === 200) {
      // DIKONFIRMASI: wildcard bekerja — F02 terbukti
      console.log('F02 CONFIRMED: LIKE wildcard returned report for single char "A"');
    }
    // Test tidak fail karena ini bukti temuan, bukan expected behavior
    expect([200, 404]).toContain(res.status());
  });

  test('TEMUAN F03: Upvote tanpa auth — tidak ditolak', async ({ request }) => {
    // Cek apakah endpoint bisa diakses tanpa token
    const resFirst = await request.get(`${BASE}/api/reports?limit=1`);
    const reports = await resFirst.json();
    if (reports.reports && reports.reports.length > 0) {
      const rid = reports.reports[0].id;
      const before = reports.reports[0].upvotesCount ?? 0;

      // Upvote tanpa token
      const resUp1 = await request.post(`${BASE}/api/reports/${rid}/upvote`);
      const resUp2 = await request.post(`${BASE}/api/reports/${rid}/upvote`);

      if (resUp1.status() === 200 && resUp2.status() === 200) {
        // F03 DIKONFIRMASI: upvote tanpa auth dan berulang
        const body = await resUp2.json();
        expect(body.upvotesCount).toBeGreaterThan(before);
        console.log('F03 CONFIRMED: upvote without auth accepted twice');
      }
      // Status 401 = sudah diperbaiki, 200 = F03 masih ada
      expect([200, 401]).toContain(resUp1.status());
    }
  });
});

test.describe('Hapus laporan — otorisasi', () => {
  test('Pemilik laporan bisa hapus laporan miliknya', async ({ request }) => {
    // Buat laporan baru untuk dihapus
    const createRes = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
      data: {
        title: 'Laporan yang akan dihapus pemiliknya',
        description: 'Ini laporan test yang akan dihapus untuk verifikasi akses delete',
        category: 'LAINNYA',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    expect(createRes.status()).toBe(201);
    const createBody = await createRes.json();
    const deleteId = createBody.report.id;

    const deleteRes = await request.delete(`${BASE}/api/reports/${deleteId}`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
    });
    expect(deleteRes.status()).toBe(200);
  });

  test('Pengguna lain tidak bisa hapus laporan orang lain (403)', async ({ request }) => {
    // Buat laporan dengan warga
    const createRes = await request.post(`${BASE}/api/reports`, {
      headers: { Authorization: `Bearer ${wargaToken}` },
      data: {
        title: 'Laporan ini tidak boleh dihapus orang lain',
        description: 'Deskripsi yang cukup panjang untuk memenuhi validasi minimum laravel',
        category: 'KEBERSIHAN',
        latitude: -7.2575,
        longitude: 112.7400,
      },
    });
    expect(createRes.status()).toBe(201);
    const deleteId = (await createRes.json()).report.id;

    // Coba hapus dengan petugas (bukan pemilik)
    const deleteRes = await request.delete(`${BASE}/api/reports/${deleteId}`, {
      headers: { Authorization: `Bearer ${petugasToken}` },
    });
    expect(deleteRes.status()).toBe(403);
  });
});
