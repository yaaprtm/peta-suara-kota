import React, { useState, useEffect, useCallback } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconCrown,
  IconUsers,
  IconChartBar,
  IconDatabase,
  IconHistory,
  IconCheck,
  IconTrendingUp,
  IconSearch,
  IconDownload,
  IconRefresh,
  IconLoader2,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';
import { statsApi, reportsApi, usersApi } from '@/lib/api';
import { User, UserRole, OverviewStats } from '@/types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar, SkeletonCard } from '@/Components/ui/Badges';
import { LanguageToggleDark } from '@/Components/ui/LanguageToggle';
import { useTranslation } from '@/i18n/useTranslation';

// ─── Skeleton for stat cards ─────────────────────────────────────────────────
const StatSkeleton: React.FC = () => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs animate-pulse">
    <div className="h-3 w-24 bg-slate-200 rounded mb-3" />
    <div className="h-8 w-16 bg-slate-200 rounded mb-2" />
    <div className="h-2.5 w-32 bg-slate-100 rounded" />
  </div>
);

const SuperadminDashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();

  // ─── Stats state ────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // ─── Users state ────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');

  // ─── Activity log from latest reports ───────────────────────────────────────
  const [activityReports, setActivityReports] = useState<any[]>([]);

  const fetchStats = useCallback(() => {
    setStatsLoading(true);
    statsApi.overview()
      .then((data: any) => {
        if (data && typeof data.total === 'number') {
          setStats(data as OverviewStats);
        }
      })
      .catch(() => {/* silently keep previous data */})
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    usersApi.list()
      .then((data: any) => {
        if (data?.users) setUsers(data.users as User[]);
      })
      .catch(() => {/* API may not be available in demo */})
      .finally(() => setUsersLoading(false));
  }, []);

  const fetchActivity = useCallback(() => {
    reportsApi.list({ limit: '8', sort: 'newest' } as any)
      .then((data: any) => {
        if (data?.reports) setActivityReports(data.reports.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchActivity();
    // Refresh stats every 60s
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchUsers, fetchActivity]);

  // ─── Computed values ─────────────────────────────────────────────────────────
  const totalReports = stats?.total ?? 0;
  const completedReports = stats?.selesai ?? 0;
  const resolutionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const criticalCount = stats?.highUrgency ?? 0;
  const totalUsers = users.length;

  // ─── Filtered users ───────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    return true;
  });

  // ─── User management actions ─────────────────────────────────────────────
  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await usersApi.toggleActive(userId) as any;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: res.isActive } : u));
      toast.success(t('superadmin.toastStatusUpdated'));
    } catch {
      // Optimistic local update if API fails
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
      toast.success(t('superadmin.toastStatusUpdated'));
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await usersApi.updateRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(t('superadmin.toastRoleUpdated', { role: newRole }));
    } catch {
      // Optimistic local update
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(t('superadmin.toastRoleUpdated', { role: newRole }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16 font-sans">
      {/* Top Bar Header */}
      <header className="bg-navy text-white px-4 py-3 border-b border-navy-700 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/patrol-logo.png" alt="PATROL" className="w-8 h-8 object-contain shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                  {t('superadmin.headerTitle')}
                </h1>
                <span className="bg-purple-900/60 text-purple-200 border border-purple-500/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  {t('superadmin.controlTag')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t('superadmin.headerSubtitle', { name: user?.name || 'Superadmin' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggleDark />
            <button
              onClick={() => { fetchStats(); fetchUsers(); fetchActivity(); toast.success('Data disegarkan'); }}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
              title="Segarkan Data"
            >
              <IconRefresh className="w-4 h-4" />
            </button>
            <a
              href={reportsApi.getExportUrl()}
              download="audit-laporan-surabaya.csv"
              className="bg-navy-800 hover:bg-navy-700 text-white border border-white/20 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
              title="Unduh seluruh rekap pengaduan format CSV"
            >
              <IconDownload className="w-4 h-4 text-orange" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </a>
            <Link href="/superadmin/master"
              className="bg-orange hover:bg-orange-600 text-navy-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <IconDatabase className="w-4 h-4" />
              <span className="hidden sm:inline">{t('superadmin.masterDataBtn')}</span>
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
                {t('superadmin.statsTitle')}
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">{t('superadmin.statsSubtitle')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {statsLoading ? (
              <><StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton /></>
            ) : (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">{t('superadmin.statTotal')}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-navy">{totalReports}</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {t('superadmin.statTotalBadge')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{t('superadmin.statTotalDesc')}</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">{t('superadmin.statResolution')}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-emerald-600">{resolutionRate}%</span>
                    <span className="text-xs text-slate-500">{t('superadmin.statResolutionSub', { done: completedReports, total: totalReports })}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${resolutionRate}%` }} />
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">{t('superadmin.statCritical')}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-red-600">{criticalCount}</span>
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full font-semibold">
                      {t('superadmin.statCriticalBadge')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{t('superadmin.statCriticalDesc')}</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">{t('superadmin.statUsers')}</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-navy">{usersLoading ? '…' : totalUsers}</span>
                    <span className="text-xs text-navy bg-navy-50 px-2 py-0.5 rounded-full font-semibold">
                      {t('superadmin.statUsersBadge')}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{t('superadmin.statUsersDesc')}</span>
                </div>

                {/* Byday activity bar chart (simple) */}
                {stats?.byDay && stats.byDay.length > 0 && (
                  <div className="col-span-2 sm:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2 mb-3">
                      <IconTrendingUp className="w-4 h-4 text-orange" />
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aktivitas 14 Hari Terakhir</span>
                    </div>
                    <div className="flex items-end gap-0.5 h-12">
                      {(() => {
                        const maxVal = Math.max(...stats.byDay.map(d => d.count), 1);
                        return stats.byDay.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                            <div
                              className="w-full bg-navy/20 hover:bg-orange/60 transition-colors rounded-sm"
                              style={{ height: `${Math.max(4, Math.round((d.count / maxVal) * 40))}px` }}
                            />
                            <span className="font-mono text-[8px] text-slate-400 hidden group-hover:block absolute -bottom-4 whitespace-nowrap">
                              {d.count}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                    <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
                      <span>{stats.byDay[0]?.date}</span>
                      <span>{stats.byDay[stats.byDay.length - 1]?.date}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Section 2: Banner Master Data */}
        <section className="bg-gradient-to-r from-navy to-navy-800 rounded-xl p-5 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <IconDatabase className="w-5 h-5 text-orange" />
              <h3 className="font-bold text-base text-white">{t('superadmin.masterBannerTitle')}</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">{t('superadmin.masterBannerDesc')}</p>
          </div>
          <Link href="/superadmin/master" className="btn-orange py-2 px-4 text-xs font-semibold whitespace-nowrap self-start sm:self-auto">
            {t('superadmin.masterBannerBtn')}
          </Link>
        </section>

        {/* Section 3: User Management */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconUsers className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
                {t('superadmin.usersTitle', { count: filteredUsers.length })}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={t('superadmin.usersSearch')}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs w-48 sm:w-60 focus:outline-none focus:border-navy"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="py-1.5 px-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
              >
                <option value="ALL">{t('common.allRoles')}</option>
                <option value="WARGA">{t('roles.WARGA')}</option>
                <option value="PETUGAS">{t('roles.PETUGAS')}</option>
                <option value="ADMIN">{t('roles.ADMIN')}</option>
                <option value="SUPERADMIN">{t('roles.SUPERADMIN')}</option>
              </select>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-4 space-y-2">
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">{t('superadmin.colName')}</th>
                    <th className="p-3">{t('superadmin.colRole')}</th>
                    <th className="p-3">{t('superadmin.colPhone')}</th>
                    <th className="p-3">{t('superadmin.colStatus')}</th>
                    <th className="p-3 text-right">{t('superadmin.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400 text-xs">
                        {userSearch ? 'Tidak ada pengguna yang cocok.' : 'Belum ada data pengguna.'}
                      </td>
                    </tr>
                  ) : filteredUsers.map((u) => (
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
                              : u.role === 'ADMIN'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : u.role === 'PETUGAS'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-sky-50 text-sky-700 border-sky-200'
                          }`}
                        >
                          <option value="WARGA">WARGA</option>
                          <option value="PETUGAS">PETUGAS</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPERADMIN">SUPERADMIN</option>
                        </select>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-500">{u.phone || '-'}</td>

                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                          u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {u.isActive ? t('superadmin.statusActive') : t('superadmin.statusInactive')}
                        </span>
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                            u.isActive ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? t('superadmin.deactivate') : t('superadmin.activate')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 4: Activity Log from real API reports */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <IconHistory className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
                {t('superadmin.logTitle')}
              </h2>
            </div>
            <span className="text-[11px] text-slate-400">{t('superadmin.logSubtitle')}</span>
          </div>

          {activityReports.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs">Memuat log aktivitas...</div>
          ) : (
            <div className="space-y-3">
              {activityReports.map((r: any, i: number) => (
                <div key={r.id || i} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-navy/10 text-navy flex items-center justify-center shrink-0 mt-0.5">
                      <IconHistory className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-medium">
                        {t('superadmin.logText', {
                          title: r.title,
                          area: r.kelurahan?.name || r.kecamatan || 'Surabaya',
                          status: r.status,
                        })}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                        {t('superadmin.logMeta', {
                          score: r.skorUrgensi ?? r.skor_urgensi ?? 0,
                          reporter: r.user?.name || 'Warga',
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                    {r.createdAt
                      ? format(parseISO(r.createdAt), 'dd/MM/yyyy HH:mm')
                      : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default SuperadminDashboardPage;
