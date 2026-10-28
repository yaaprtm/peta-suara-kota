import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconShield,
  IconAlertTriangle,
  IconFlame,
  IconCheck,
  IconClock,
  IconRefresh,
  IconMapPin,
  IconSearch,
  IconFileSpreadsheet,
  IconChevronRight,
  IconTrendingUp,
  IconX,
  IconExternalLink,
  IconCurrentLocation,
  IconCircleDot,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { useReportsStore } from '@/stores/reportsStore';
import { useAuthStore } from '@/stores/authStore';
import { Report, ReportCategory, ReportStatus, UrgencyLevel, getUrgencyLevel, STATUS_LABELS, CATEGORY_LABELS } from '@/types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '@/Components/ui/Badges';
import { LanguageToggleDark } from '@/Components/ui/LanguageToggle';
import { useTranslation } from '@/i18n/useTranslation';

const PetugasDashboardPage: React.FC = () => {
  const navigate = (url: string) => router.visit(url);
  const { user } = useAuthStore();
  const { reports, updateReportStatus, fetchReports } = useReportsStore();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [actionReport, setActionReport] = useState<Report | null>(null);
  const [actionStatus, setActionStatus] = useState<ReportStatus>('DIPROSES');
  const [actionNote, setActionNote] = useState('');
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [mobileTab, setMobileTab] = useState<'queue' | 'map'>('queue');

  // ── GIS: Nearby Me ──────────────────────────────────────────────────────
  const [nearbyReports, setNearbyReports] = useState<(Report & { distanceKm: number })[]>([]);
  const [isNearbyMode, setIsNearbyMode] = useState(false);
  const [isLoadingNearby, setIsLoadingNearby] = useState(false);
  const [myLocation, setMyLocation] = useState<{ lat: number; lng: number } | null>(null);

  const handleFindNearest = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Browser tidak mendukung geolokasi.');
      return;
    }
    setIsLoadingNearby(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setMyLocation({ lat, lng });
        try {
          const { reportsApi } = await import('@/lib/api');
          const res = await reportsApi.nearby({ lat, lng, radius: 3, limit: 20 });
          if (res.reports.length === 0) {
            toast('Tidak ada laporan aktif dalam radius 3 km dari lokasi Anda.', { icon: '📍' });
          } else {
            toast.success(`Ditemukan ${res.reports.length} laporan dalam radius 3 km`);
          }
          setNearbyReports(res.reports as (Report & { distanceKm: number })[]);
          setIsNearbyMode(true);
        } catch {
          toast.error('Gagal memuat laporan terdekat.');
        } finally {
          setIsLoadingNearby(false);
        }
      },
      (err) => {
        setIsLoadingNearby(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error('Akses lokasi ditolak. Izinkan lokasi di browser Anda.');
        } else {
          toast.error('Gagal mendapatkan lokasi Anda.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const handleClearNearby = useCallback(() => {
    setIsNearbyMode(false);
    setNearbyReports([]);
    setMyLocation(null);
  }, []);

  // Fetch reports from API on mount
  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const sortedAndFilteredReports = useMemo(() => {
    // Jika mode nearby aktif, gunakan daftar laporan terdekat
    if (isNearbyMode) return nearbyReports;

    return reports
      .filter((r) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !(r.kecamatan || r.kelurahan?.name || '').toLowerCase().includes(q)) return false;
        }
        if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
        if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
        if (selectedLevel !== 'ALL' && getUrgencyLevel(r.skorUrgensi) !== selectedLevel) return false;
        return true;
      })
      .sort((a, b) => {
        if (b.skorUrgensi !== a.skorUrgensi) return b.skorUrgensi - a.skorUrgensi;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, searchQuery, selectedCategory, selectedStatus, selectedLevel, isNearbyMode, nearbyReports]);

  const activeReport = useMemo(() => {
    if (selectedReportId) return reports.find((r) => r.id === selectedReportId) || sortedAndFilteredReports[0] || null;
    return sortedAndFilteredReports[0] || null;
  }, [reports, selectedReportId, sortedAndFilteredReports]);

  const dailyStats = useMemo(() => {
    const total = reports.length;
    const baru = reports.filter(r => r.status === 'BARU').length;
    const diproses = reports.filter(r => r.status === 'DIPROSES').length;
    const selesai = reports.filter(r => r.status === 'SELESAI').length;
    const urgentCount = reports.filter(r => r.skorUrgensi >= 80).length;
    return { total, baru, diproses, selesai, urgentCount };
  }, [reports]);

  const handleOpenAction = (report: Report) => {
    setActionReport(report);
    setActionStatus(report.status === 'BARU' ? 'DIPROSES' : report.status === 'DIPROSES' ? 'SELESAI' : 'DIPROSES');
    setActionNote('');
  };

  const handleSaveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionReport) return;
    updateReportStatus(
      actionReport.id,
      actionStatus,
      actionNote || `${t('status.' + actionStatus as any)}`,
      { id: user?.id || 'petugas-cc', name: user?.name || 'Petugas Command Center', role: user?.role || 'PETUGAS' }
    );
    toast.success(t('petugas.toastUpdated', { status: t(`status.${actionStatus}` as any) }));
    setActionReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-navy text-white px-4 py-3 border-b border-navy-700 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center text-navy-900 font-bold shadow-sm">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                  {t('petugas.headerTitle')}
                </h1>
                <span className="bg-orange/20 text-orange border border-orange/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  {t('petugas.liveTag')}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {t('petugas.headerSubtitle', { name: user?.name || 'Petugas Operasional' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggleDark />
            <button
              onClick={() => setShowRekapModal(true)}
              className="bg-orange hover:bg-orange-600 text-navy-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <IconFileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">{t('petugas.rekapBtn')}</span>
            </button>
            <button
              onClick={() => toast.success(t('petugas.refreshSuccess'))}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
              title={t('petugas.refreshTitle')}
            >
              <IconRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Metrics */}
      <section className="bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-red-50/70 border border-red-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider block">{t('petugas.metricUrgent')}</span>
              <span className="text-base font-bold text-red-700 leading-none">{dailyStats.urgentCount}</span>
            </div>
            <IconFlame className="w-5 h-5 text-red-600 animate-pulse" />
          </div>
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-sky-600 font-semibold uppercase tracking-wider block">{t('petugas.metricBaru')}</span>
              <span className="text-base font-bold text-sky-700 leading-none">{dailyStats.baru}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider block">{t('petugas.metricDiproses')}</span>
              <span className="text-base font-bold text-amber-700 leading-none">{dailyStats.diproses}</span>
            </div>
            <IconClock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider block">{t('petugas.metricSelesai')}</span>
              <span className="text-base font-bold text-emerald-700 leading-none">{dailyStats.selesai}</span>
            </div>
            <IconCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="bg-navy-50 border border-navy-100 rounded-lg p-2 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] text-navy font-semibold uppercase tracking-wider block">{t('petugas.metricTotal')}</span>
              <span className="text-base font-bold text-navy leading-none">{t('petugas.metricReportsUnit', { count: dailyStats.total })}</span>
            </div>
            <IconTrendingUp className="w-4 h-4 text-navy" />
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-slate-100/80 border-b border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('petugas.filterSearch')}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-navy"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">{t('common.allCategories')}</option>
              <option value="INFRASTRUKTUR">{t('category.INFRASTRUKTUR')}</option>
              <option value="KEBERSIHAN">{t('category.KEBERSIHAN')}</option>
              <option value="KEAMANAN">{t('category.KEAMANAN')}</option>
              <option value="BANJIR">{t('category.BANJIR')}</option>
              <option value="LAINNYA">{t('category.LAINNYA')}</option>
            </select>

            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">{t('petugas.filterAllUrgency')}</option>
              <option value="kritis">{t('petugas.filterKritis')}</option>
              <option value="tinggi">{t('petugas.filterTinggi')}</option>
              <option value="sedang">{t('petugas.filterSedang')}</option>
              <option value="rendah">{t('petugas.filterRendah')}</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">{t('common.allStatus')}</option>
              <option value="BARU">{t('petugas.filterBaruMasuk')}</option>
              <option value="DIPROSES">{t('petugas.filterDiproses')}</option>
              <option value="SELESAI">{t('petugas.filterSelesai')}</option>
              <option value="DITOLAK">{t('petugas.filterDitolak')}</option>
            </select>

            {(selectedCategory !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => { setSelectedCategory('ALL'); setSelectedLevel('ALL'); setSelectedStatus('ALL'); setSearchQuery(''); }}
                className="text-[11px] text-rose-600 hover:underline font-medium px-1"
              >
                {t('petugas.resetFilter')}
              </button>
            )}

            {/* ── GIS: Tombol Terdekat dari Saya ── */}
            {!isNearbyMode ? (
              <button
                onClick={handleFindNearest}
                disabled={isLoadingNearby}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-navy bg-navy text-white text-xs font-semibold hover:bg-navy-700 disabled:opacity-60 transition-colors"
                title="Tampilkan laporan aktif terdekat dari posisi Anda (radius 3 km)"
              >
                <IconCurrentLocation className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
                {isLoadingNearby ? 'Mencari…' : 'Terdekat dari Saya'}
              </button>
            ) : (
              <button
                onClick={handleClearNearby}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-orange bg-orange text-white text-xs font-semibold hover:bg-orange-600 transition-colors"
              >
                <IconX className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
                Keluar Mode Terdekat
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Grid */}
      <main className="max-w-7xl mx-auto px-4 py-4 flex-1 w-full">
        {/* Mobile tab switcher */}
        <div className="lg:hidden flex items-center bg-slate-200 p-1 rounded-xl mb-3 text-xs font-semibold shadow-2xs">
          <button
            type="button"
            onClick={() => setMobileTab('queue')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'queue' ? 'bg-navy text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <IconFlame className="w-3.5 h-3.5 text-orange" />
            <span>{t('petugas.mobileTabQueue', { count: sortedAndFilteredReports.length })}</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${mobileTab === 'map' ? 'bg-navy text-white shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <IconMapPin className="w-3.5 h-3.5 text-orange" />
            <span>{t('petugas.mobileTabMap')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Queue */}
          <section className={`lg:col-span-5 flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs h-[520px] lg:h-[720px] ${mobileTab === 'queue' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <IconFlame className="w-4 h-4 text-orange" />
                <h2 className="font-bold text-xs text-navy uppercase tracking-wider">
                  {t('petugas.queueTitle', { count: sortedAndFilteredReports.length })}
                </h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{t('petugas.queueSort')}</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
              {/* ── GIS: Nearby Mode Banner ── */}
              {isNearbyMode && myLocation && (
                <div className="flex items-start gap-2 bg-navy/5 border border-navy/20 rounded-lg p-2.5 mb-1 text-[10px]">
                  <IconCircleDot className="w-4 h-4 text-navy shrink-0 mt-0.5" stroke={1.8} />
                  <div>
                    <p className="font-bold text-navy">Mode Terdekat Aktif</p>
                    <p className="text-slate-500 mt-0.5">
                      {nearbyReports.length} laporan aktif dalam radius 3 km dari posisi Anda.
                      Diurutkan berdasarkan jarak terdekat.
                    </p>
                  </div>
                </div>
              )}

              {sortedAndFilteredReports.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <IconCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-bold text-slate-700 text-xs">
                    {isNearbyMode ? 'Tidak ada laporan aktif dalam radius 3 km' : t('petugas.queueEmpty')}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isNearbyMode ? 'Coba perluas radius atau periksa koneksi lokasi Anda.' : t('petugas.queueEmptyDesc')}
                  </p>
                </div>
              ) : (
                sortedAndFilteredReports.map((report) => {
                  const isSelected = activeReport?.id === report.id;
                  const isCritical = report.skorUrgensi >= 80;
                  const distKm = (report as any).distanceKm as number | undefined;
                  return (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        isSelected ? 'border-navy bg-navy-50/50 shadow-xs ring-1 ring-navy'
                        : isCritical ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <UrgencyBadge score={report.skorUrgensi} />
                          <CategoryBadge category={report.category} />
                          {/* Distance badge di mode nearby */}
                          {isNearbyMode && distKm !== undefined && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-navy/10 text-navy text-[9px] font-bold">
                              <IconCurrentLocation className="w-2.5 h-2.5" stroke={2} />
                              {distKm < 1
                                ? `${Math.round(distKm * 1000)} m`
                                : `${distKm.toFixed(1)} km`}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={report.status} />
                      </div>
                      <h3 className="font-bold text-navy text-xs line-clamp-1 mb-1">{report.title}</h3>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">{report.description}</p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <IconMapPin className="w-3 h-3 text-orange shrink-0" />
                          <span className="truncate">{report.kelurahan?.name || report.kecamatan || 'Surabaya'}</span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span>{format(parseISO(report.createdAt), 'dd/MM HH:mm')}</span>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleOpenAction(report); }}
                            className="bg-navy hover:bg-navy-700 text-white font-medium px-2 py-0.5 rounded text-[10px]"
                          >
                            {t('petugas.changeStatus')}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Right: Map + Detail */}
          <section className={`lg:col-span-7 flex-col gap-4 h-[520px] lg:h-[720px] ${mobileTab === 'map' ? 'flex' : 'hidden lg:flex'}`}>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex-1 flex flex-col">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconMapPin className="w-4 h-4 text-orange" />
                  <h3 className="font-bold text-xs text-navy uppercase tracking-wider">{t('petugas.mapTitle')}</h3>
                </div>
                {activeReport && (
                  <span className="text-[11px] font-medium text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                    {t('petugas.mapTarget', { target: activeReport.kelurahan?.name || activeReport.kecamatan || 'Surabaya' })}
                  </span>
                )}
              </div>
              <div className="flex-1 w-full bg-slate-100 relative">
                {activeReport ? (
                  <iframe
                    title="Peta Command Center"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeReport.longitude - 0.015}%2C${activeReport.latitude - 0.015}%2C${activeReport.longitude + 0.015}%2C${activeReport.latitude + 0.015}&layer=mapnik&marker=${activeReport.latitude}%2C${activeReport.longitude}`}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-xs">
                    {t('petugas.mapEmptyHint')}
                  </div>
                )}
              </div>
            </div>

            {activeReport && (
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <CategoryBadge category={activeReport.category} />
                      <UrgencyBadge score={activeReport.skorUrgensi} />
                      <StatusBadge status={activeReport.status} />
                    </div>
                    <h3 className="font-bold text-navy text-sm">{activeReport.title}</h3>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => handleOpenAction(activeReport)} className="btn-orange py-1 px-3 text-xs">
                      {t('petugas.actionBtn')}
                    </button>
                    <Link href={`/laporan/${activeReport.id}`} className="btn-outline py-1 px-2.5 text-xs flex items-center gap-1">
                      <span>{t('petugas.detailBtn')}</span>
                      <IconExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{activeReport.description}</p>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1">
                    <IconMapPin className="w-3.5 h-3.5 text-orange" />
                    <span>{activeReport.address || t('petugas.addressLabel')}</span>
                  </span>
                  <span className="font-mono text-[10px]">
                    {t('petugas.reporterLabel', { name: activeReport.user?.name || 'Warga' })}
                  </span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Action Dialog */}
      {actionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="bg-navy px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconShield className="w-4 h-4 text-orange" />
                <h3 className="font-bold text-xs uppercase tracking-wider">{t('petugas.actionDialogTitle')}</h3>
              </div>
              <button onClick={() => setActionReport(null)} className="text-slate-400 hover:text-white">
                <IconX className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveAction} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">{t('petugas.actionDialogReport')}</span>
                <h4 className="font-bold text-navy text-xs line-clamp-1">{actionReport.title}</h4>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('petugas.changeStatusTo')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BARU', 'DIPROSES', 'SELESAI'] as ReportStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActionStatus(st)}
                      className={`py-2 text-xs rounded-lg font-medium border text-center transition-all ${
                        actionStatus === st ? 'bg-navy text-white border-navy font-bold shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t(`status.${st}` as any)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t('petugas.actionNoteLabel')}</label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={t('petugas.actionNotePlaceholder')}
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setActionReport(null)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-navy py-1.5 px-4 text-xs">{t('petugas.saveAction')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rekap Modal */}
      {showRekapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden">
            <div className="bg-navy px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFileSpreadsheet className="w-5 h-5 text-orange" />
                <div>
                  <h3 className="font-bold text-sm text-white">{t('petugas.rekapTitle')}</h3>
                  <p className="text-[11px] text-slate-300">{t('petugas.rekapSubtitle')}</p>
                </div>
              </div>
              <button onClick={() => setShowRekapModal(false)} className="text-slate-400 hover:text-white">
                <IconX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">{t('petugas.rekapTotal')}</span>
                  <span className="text-xl font-bold text-navy">{dailyStats.total}</span>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <span className="text-[10px] text-red-600 block font-semibold">{t('petugas.rekapUrgent')}</span>
                  <span className="text-xl font-bold text-red-700">{dailyStats.urgentCount}</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-600 block font-semibold">{t('petugas.rekapDiproses')}</span>
                  <span className="text-xl font-bold text-amber-700">{dailyStats.diproses}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-600 block font-semibold">{t('petugas.rekapSelesai')}</span>
                  <span className="text-xl font-bold text-emerald-700">{dailyStats.selesai}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-navy text-xs uppercase tracking-wider mb-2">{t('petugas.rekapTableTitle')}</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">{t('petugas.rekapColTitle')}</th>
                        <th className="p-2.5">{t('petugas.rekapColCategory')}</th>
                        <th className="p-2.5">{t('petugas.rekapColScore')}</th>
                        <th className="p-2.5">{t('petugas.rekapColStatus')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.slice(0, 8).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-navy max-w-xs truncate">{r.title}</td>
                          <td className="p-2.5">{t(`category.${r.category}` as any)}</td>
                          <td className="p-2.5 font-bold font-mono text-orange">{r.skorUrgensi}</td>
                          <td className="p-2.5"><StatusBadge status={r.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <a
                href="/api/reports/export"
                download
                onClick={() => setShowRekapModal(false)}
                className="btn-navy py-1.5 px-4 text-xs flex items-center gap-1.5 font-semibold"
              >
                <IconFileSpreadsheet className="w-4 h-4 text-orange" />
                <span>{t('petugas.rekapExport')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetugasDashboardPage;
