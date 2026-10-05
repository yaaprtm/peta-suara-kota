import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconArrowLeft,
  IconRefresh,
  IconClock,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconFilter,
  IconMapPin,
  IconUser,
  IconChevronRight,
  IconX,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { reportsApi, statsApi } from '../../lib/api';
import { Report, ReportStatus, OverviewStats, STATUS_LABELS } from '../../types';
import { UrgencyBadge, StatusBadge, CategoryBadge, LoadingSpinner, SkeletonCard, Avatar } from '../../components/ui/Badges';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';

const STATUS_OPTIONS: ReportStatus[] = ['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK'];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'ALL'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Redirect if not petugas/admin
  useEffect(() => {
    if (user && user.role === 'WARGA') {
      toast.error('Halaman ini khusus untuk aparatur petugas');
      navigate('/');
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        reportsApi.list({ limit: '100', ...(statusFilter !== 'ALL' ? { status: statusFilter } : {}) }) as Promise<{ reports: Report[] }>,
        statsApi.overview() as Promise<OverviewStats>,
      ]);
      setReports(reportsData.reports);
      setStats(statsData);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memuat berkas laporan');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusUpdate = async (reportId: string, newStatus: ReportStatus, note?: string) => {
    setUpdatingId(reportId);
    try {
      await reportsApi.updateStatus(reportId, newStatus, note);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));
      toast.success(`Status laporan diperbarui: ${STATUS_LABELS[newStatus]}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memperbarui status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-board-bg board-pattern text-paper-white overflow-y-auto font-body">
      {/* Official Header */}
      <header className="bg-paper-white border-b border-ink text-ink sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-1.5 border border-ink bg-paper-white hover:bg-paper-kraft text-ink transition-colors"
              title="Kembali ke Peta"
            >
              <IconArrowLeft className="w-4 h-4" stroke={1.5} />
            </button>
            <div>
              <h1 className="font-body font-bold text-base text-ink uppercase tracking-tight leading-none">
                PANEL PENANGANAN PENGADUAN PETUGAS
              </h1>
              <p className="font-mono text-[10px] text-ink/70 mt-0.5 tracking-tight uppercase">
                APARATUR: {user?.name || 'PETUGAS'} · PERAN: {user?.role || 'PETUGAS'}
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="btn-paper-secondary text-xs flex items-center gap-1 font-mono"
            title="Muat Ulang Berkas"
          >
            <IconRefresh className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} stroke={1.5} />
            <span>SEGARKAN</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="TOTAL BERKAS LAPORAN"
              value={stats.total}
              icon={<IconFileText className="w-5 h-5 text-ink" stroke={1.5} />}
              bg="bg-paper-white"
            />
            <StatCard
              label="BERKAS BARU"
              value={stats.baru}
              icon={<IconAlertTriangle className="w-5 h-5 text-mustard" stroke={1.5} />}
              bg="bg-paper-kraft"
            />
            <StatCard
              label="SEDANG DIPROSES"
              value={stats.diproses}
              icon={<IconClock className="w-5 h-5 text-ink" stroke={1.5} />}
              bg="bg-paper-blue"
            />
            <StatCard
              label="TUNTAS / SELESAI"
              value={stats.selesai}
              icon={<IconCheck className="w-5 h-5 text-muted-teal" stroke={2} />}
              bg="bg-paper-white"
            />
          </div>
        )}

        {/* 14-day Activity Chart */}
        {stats && stats.byDay.length > 0 && (
          <div className="bg-paper-white border border-ink p-4 text-ink">
            <div className="flex items-center justify-between mb-3 border-b border-ink/20 pb-2">
              <h2 className="font-body font-bold text-xs uppercase tracking-tight">
                INTENSITAS PENGADUAN 14 HARI TERAKHIR
              </h2>
              <span className="font-mono text-[10px] text-ink/60">KOTAMADYA SURABAYA</span>
            </div>
            <div className="flex items-end gap-1.5 h-20 pt-2">
              {stats.byDay.map(({ date, count }) => {
                const maxCount = Math.max(...stats.byDay.map(d => d.count), 1);
                const pct = (count / maxCount) * 100;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex items-end h-14 bg-paper-kraft/40 border border-ink/20">
                      <div
                        className="w-full bg-ink hover:bg-stamp-red transition-all cursor-default"
                        style={{ height: `${Math.max(pct, 6)}%` }}
                        title={`${date}: ${count} berkas`}
                      />
                    </div>
                    <p className="font-mono text-[8px] text-ink/70">
                      {date.slice(5)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── Reports Table / Dossier List */}
        <div className="bg-paper-white border border-ink text-ink overflow-hidden">
          {/* Status Filter Tab */}
          <div className="flex items-center gap-2 p-3 border-b border-ink bg-paper-kraft overflow-x-auto">
            <IconFilter className="w-4 h-4 text-ink/70 shrink-0" stroke={1.5} />
            {(['ALL', ...STATUS_OPTIONS] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={clsx(
                  'px-2.5 py-1 border text-xs font-mono font-bold transition-all shrink-0 uppercase',
                  statusFilter === s
                    ? 'bg-ink text-paper-white border-ink'
                    : 'bg-paper-white text-ink border-ink/40 hover:border-ink'
                )}
              >
                {s === 'ALL' ? 'SEMUA BERKAS' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Dossier Items */}
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-ink/50 font-mono text-xs">
              <IconFileText className="w-8 h-8 mx-auto mb-2 text-ink/30" stroke={1} />
              <p>TIDAK ADA BERKAS LAPORAN PADA STATUS INI</p>
            </div>
          ) : (
            <div className="divide-y divide-ink/20">
              {reports.map(report => (
                <ReportRow
                  key={report.id}
                  report={report}
                  isUpdating={updatingId === report.id}
                  onStatusUpdate={handleStatusUpdate}
                  onViewMap={() => navigate(`/?report=${report.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// ─── StatCard Subcomponent ───────────────────────────────────────────────────

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}> = ({ label, value, icon, bg }) => (
  <div className={clsx('p-3.5 border border-ink text-ink', bg)}>
    <div className="flex items-center justify-between mb-1">
      <span className="font-mono text-[9px] font-bold text-ink/70 tracking-wider">{label}</span>
      {icon}
    </div>
    <p className="font-mono font-bold text-2xl text-ink leading-tight">{value}</p>
  </div>
);

// ─── ReportRow Subcomponent ──────────────────────────────────────────────────

const STATUS_NEXT: Record<ReportStatus, ReportStatus[]> = {
  BARU: ['DIPROSES', 'DITOLAK'],
  DIPROSES: ['SELESAI', 'DITOLAK'],
  SELESAI: [],
  DITOLAK: [],
};

const ReportRow: React.FC<{
  report: Report;
  isUpdating: boolean;
  onStatusUpdate: (id: string, status: ReportStatus, note?: string) => void;
  onViewMap: () => void;
}> = ({ report, isUpdating, onStatusUpdate, onViewMap }) => {
  const [expanded, setExpanded] = useState(false);
  const next = STATUS_NEXT[report.status];

  return (
    <div className="hover:bg-paper-kraft/20 transition-colors">
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full text-left p-3 sm:p-4 flex items-start gap-3"
      >
        <UrgencyBadge score={report.skorUrgensi} showScore={false} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-ink text-xs sm:text-sm font-bold truncate">{report.title}</p>
            <StatusBadge status={report.status} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <CategoryBadge category={report.category} />
            {report.kelurahan && (
              <span className="font-mono text-[10px] text-ink/70 bg-paper-blue/50 px-1.5 py-0.5 border border-ink/30">
                Kel. {report.kelurahan.name}
              </span>
            )}
            <span className="font-mono text-[10px] text-ink/60">
              {format(parseISO(report.createdAt), 'd MMM yyyy HH:mm', { locale: localeId })} WIB
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Dossier Details */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-ink/20 pt-3 bg-paper-kraft/30 font-body">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-ink">
              <IconUser className="w-3.5 h-3.5" stroke={1.5} />
              <span>Pelapor: {report.user.name}</span>
            </div>
            <button
              onClick={onViewMap}
              className="btn-paper-secondary text-[10px] font-mono py-1 px-2"
            >
              LIHAT TITIK DI PETA
            </button>
          </div>

          <p className="text-ink text-xs bg-paper-white border border-ink/30 p-3 leading-relaxed">
            {report.description}
          </p>

          {/* Action update buttons */}
          {next.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="font-mono text-[10px] uppercase font-bold text-ink/70">Ubah Status Berkas:</span>
              {next.map(s => (
                <button
                  key={s}
                  onClick={() => onStatusUpdate(report.id, s)}
                  disabled={isUpdating}
                  className="btn-paper-primary text-xs py-1 px-2.5 font-mono"
                >
                  {isUpdating ? <LoadingSpinner size="sm" /> : null}
                  TETAPKAN {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
