import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconCrown,
  IconUsers,
  IconChartBar,
  IconDatabase,
  IconHistory,
  IconShield,
  IconUser,
  IconCheck,
  IconX,
  IconTrendingUp,
  IconAlertTriangle,
  IconArrowUpRight,
  IconSettings,
  IconMapPin,
  IconSearch,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useReportsStore } from '../../stores/reportsStore';
import { User, UserRole } from '../../types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '../../components/ui/Badges';

// Mock list of registered accounts for testing & admin management
const INITIAL_USERS: User[] = [
  { id: 'usr-1', name: 'Budi Santoso', email: 'warga@surabaya.go.id', role: 'WARGA', phone: '081234567890', isActive: true, createdAt: '2025-01-15T08:30:00Z' },
  { id: 'usr-2', name: 'Bambang Trianto', email: 'petugas@surabaya.go.id', role: 'PETUGAS', phone: '081234567891', isActive: true, createdAt: '2025-01-10T09:00:00Z' },
  { id: 'usr-3', name: 'Rendra Prasetya', email: 'superadmin@surabaya.go.id', role: 'SUPERADMIN', phone: '081234567892', isActive: true, createdAt: '2025-01-01T07:00:00Z' },
  { id: 'usr-4', name: 'Siti Aminah', email: 'siti.aminah@surabaya.go.id', role: 'WARGA', phone: '081298765432', isActive: true, createdAt: '2025-02-12T10:15:00Z' },
  { id: 'usr-5', name: 'Agus Setiawan', email: 'agus.dkrth@surabaya.go.id', role: 'PETUGAS', phone: '081345678901', isActive: true, createdAt: '2025-02-01T11:20:00Z' },
  { id: 'usr-6', name: 'Dewi Lestari', email: 'dewi.warga@surabaya.go.id', role: 'WARGA', phone: '081567890123', isActive: false, createdAt: '2025-03-05T14:40:00Z' },
];

const SuperadminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports } = useReportsStore();

  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // Summary statistics
  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'SELESAI').length;
  const resolutionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const criticalCount = reports.filter(r => r.skorUrgensi >= 80).length;
  const totalUsers = users.length;

  // Filtered users
  const filteredUsers = users.filter(u => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  const handleToggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
    toast.success('Status keaktifan pengguna diperbarui');
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    toast.success(`Role pengguna diubah menjadi: ${newRole}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Bar Header */}
      <header className="bg-navy text-white px-4 py-3 border-b border-navy-700 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center text-navy-900 font-bold shadow-sm">
              <IconCrown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                  PANEL SUPERADMIN KOTA SURABAYA
                </h1>
                <span className="bg-purple-900/60 text-purple-200 border border-purple-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  PUSAT KONTROL
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Pengguna: <b className="text-white">{user?.name || 'Superadmin'}</b> · Hak Akses Penuh Kota
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/superadmin/master"
              className="bg-orange hover:bg-orange-600 text-navy-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <IconDatabase className="w-4 h-4" />
              <span>Kelola Master Data</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Section 1: Statistik Seluruh Kota */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <IconChartBar className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
                Statistik Seluruh Kota Surabaya
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">Data Terintegrasi</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">TOTAL PENGADUAN</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-navy">{totalReports}</span>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  100% Aktif
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Semua laporan dari warga kota</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">TINGKAT PENYELESAIAN</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-emerald-600">{resolutionRate}%</span>
                <span className="text-xs text-slate-500">{completedReports}/{totalReports} Selesai</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">URGENSI KRITIS</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
                <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                  Prioritas 1
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Skor urgensi &gt; 80 poin</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">TOTAL AKUN PENGGUNA</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-navy">{totalUsers}</span>
                <span className="text-xs text-navy bg-navy-50 px-2 py-0.5 rounded-full font-semibold">
                  Warga & Petugas
                </span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Terdaftar resmi di database</span>
            </div>
          </div>
        </section>

        {/* Section 2: Banner Navigasi ke Master Data */}
        <section className="bg-gradient-to-r from-navy to-navy-800 rounded-xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconDatabase className="w-5 h-5 text-orange" />
              <h3 className="font-bold text-base text-white">Kelola Master Data Sistem</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Konfigurasi Master Kategori Laporan, Bobot Base Score, Level Urgensi (Kritis, Tinggi, Sedang, Rendah), dan penetapan Role Akun.
            </p>
          </div>
          <Link
            to="/superadmin/master"
            className="btn-orange py-2 px-4 text-xs font-semibold whitespace-nowrap self-start sm:self-auto"
          >
            Buka Kelola Master Data &rarr;
          </Link>
        </section>

        {/* Section 3: Kelola Akun Warga dan Petugas */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconUsers className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
                Kelola Akun Warga dan Petugas ({filteredUsers.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama / email akun..."
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 focus:outline-none focus:border-navy"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="ALL">Semua Peran</option>
                <option value="WARGA">Warga</option>
                <option value="PETUGAS">Petugas</option>
                <option value="SUPERADMIN">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Nama & Email</th>
                  <th className="p-3">Peran (Role)</th>
                  <th className="p-3">Telepon</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <span className="font-bold text-navy block text-xs">{u.name}</span>
                          <span className="text-[11px] text-slate-400 font-mono">{u.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleChangeRole(u.id, e.target.value as UserRole)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                          u.role === 'SUPERADMIN'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : u.role === 'PETUGAS'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-sky-50 text-sky-700 border-sky-200'
                        }`}
                      >
                        <option value="WARGA">WARGA</option>
                        <option value="PETUGAS">PETUGAS</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                    </td>

                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      {u.phone || '-'}
                    </td>

                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        u.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          u.isActive
                            ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 4: Log Aktivitas Sistem */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconHistory className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
                Log Aktivitas Operasional Kota
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">Jejak Audit Realtime</span>
          </div>

          <div className="space-y-3">
            {reports.slice(0, 5).map((r, i) => (
              <div key={r.id || i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center shrink-0 mt-0.5">
                    <IconHistory className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-slate-800 font-medium">
                      Status laporan <span className="font-bold text-navy">"{r.title}"</span> di wilayah {r.kelurahan?.name || r.kecamatan || 'Surabaya'} tercatat <b className="text-navy">{r.status}</b>.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      Skor Urgensi: {r.skorUrgensi} · Pelapor: {r.user?.name || 'Warga'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                  {format(parseISO(r.createdAt), 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SuperadminDashboardPage;
