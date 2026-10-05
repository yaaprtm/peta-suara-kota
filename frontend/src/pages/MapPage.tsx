import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconPlus,
  IconLogout,
  IconX,
  IconMapPin,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import MapView from '../components/map/MapView';
import MapFilterBar from '../components/map/MapFilterBar';
import ReportDetailPanel from '../components/map/ReportDetailPanel';
import TimeSlider from '../components/map/TimeSlider';
import ReportForm from '../components/reports/ReportForm';
import { LoadingSpinner, UrgencyBadge, getCategoryIcon } from '../components/ui/Badges';
import { useReportsStore } from '../stores/reportsStore';
import { useAuthStore } from '../stores/authStore';
import { createSSEConnection } from '../lib/api';
import { Report, CATEGORY_LABELS } from '../types';
import clsx from 'clsx';

// ─── MapPage: Peta Suara Kota Surabaya ──────────────────────────────────────

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    isLoading,
    filteredReports,
    setSelectedReport,
    addReport,
    updateReportStatus,
  } = useReportsStore();
  const { user, logout } = useAuthStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  // Real-time SSE connection for live updates
  useEffect(() => {
    const es = createSSEConnection(
      (report) => {
        addReport(report as Report);
        toast.success('Laporan baru masuk dan tercatat di peta.');
      },
      ({ reportId, newStatus }) => {
        updateReportStatus(reportId, newStatus as Report['status']);
      }
    );

    es.onopen = () => setIsConnected(true);
    es.onerror = () => setIsConnected(false);

    return () => {
      es.close();
    };
  }, [addReport, updateReportStatus]);

  const handleMapClick = useCallback(
    (latlng: { lat: number; lng: number }) => {
      if (isPickingLocation) {
        setPickedLocation(latlng);
        setIsPickingLocation(false);
        toast.success('Titik koordinat berhasil dipilih.');
      }
    },
    [isPickingLocation]
  );

  const handleSelectReport = useCallback(
    (report: Report) => {
      setSelectedReport(report);
      setIsFormOpen(false);
    },
    [setSelectedReport]
  );

  const handlePickLocation = useCallback(() => {
    setIsFormOpen(false);
    setIsPickingLocation(true);
    toast('Klik titik lokasi pada peta Surabaya', { duration: 4000 });
  }, []);

  const handleOpenForm = useCallback(() => {
    if (!user) {
      toast.error('Silakan masuk terlebih dahulu untuk melapor.');
      navigate('/login');
      return;
    }
    setSelectedReport(null);
    setIsFormOpen((prev) => !prev);
  }, [user, navigate, setSelectedReport]);

  const handleLogout = async () => {
    await logout();
    toast.success('Sesi diakhiri');
    navigate('/login');
  };

  // Recent reports list for left sidebar (latest 30, not a statistics panel)
  const recentReports = useMemo(
    () =>
      [...filteredReports]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30),
    [filteredReports]
  );

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--board-bg)' }}>

      {/* ─── 1. HEADER ────────────────────────────────────────────────────────── */}
      <header className="z-[1000] shrink-0 bg-paper-white border-b border-ink">
        <div className="flex items-center justify-between px-4 py-2.5 gap-3">

          {/* Brand wordmark — Caveat, satu kali saja */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-7 h-7 shrink-0 flex items-center justify-center border border-ink text-ink"
              style={{ background: 'var(--paper-kraft)' }}
            >
              <IconBuildingCommunity className="w-4 h-4" stroke={1.5} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-wordmark font-bold text-2xl text-ink leading-none whitespace-nowrap">
                Peta Suara Kota
              </span>
              <span
                className="font-mono text-[10px] px-1.5 py-0.5 border border-ink shrink-0 hidden sm:inline-block"
                style={{ background: 'var(--paper-kraft)', color: 'var(--ink)' }}
              >
                SURABAYA
              </span>
            </div>
          </div>

          {/* Actions — hanya satu tombol CTA utama, sisanya teks biasa */}
          <nav className="flex items-center gap-3 shrink-0">

            {/* Tombol aksi utama — satu-satunya tombol berat di header */}
            <button
              onClick={handleOpenForm}
              className="btn-paper-primary flex items-center gap-1.5 text-xs py-1.5 px-3 font-bold"
            >
              <IconPlus className="w-4 h-4" stroke={2} />
              <span className="hidden sm:inline">Buat Laporan</span>
              <span className="sm:hidden">Lapor</span>
            </button>

            {/* Link teks biasa — bukan tombol berat */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-xs font-body text-ink/70 hover:text-ink underline-offset-2 hover:underline whitespace-nowrap hidden sm:block"
            >
              Papan Skor
            </button>

            {user?.role && ['PETUGAS', 'ADMIN'].includes(user.role) && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs font-body text-ink/70 hover:text-ink underline-offset-2 hover:underline whitespace-nowrap hidden md:block"
              >
                Dashboard
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 border-l border-ink/20 pl-3">
                <span className="text-xs font-body text-ink/80 hidden sm:block truncate max-w-[90px]">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-ink/60 hover:text-ink border border-ink/30 hover:border-ink transition-colors"
                  title="Keluar"
                >
                  <IconLogout className="w-3.5 h-3.5" stroke={1.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-xs font-body text-ink/70 hover:text-ink underline-offset-2 hover:underline border-l border-ink/20 pl-3"
              >
                Masuk
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* ─── 2. FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="z-[900] shrink-0 border-b border-ink bg-paper-white">
        <MapFilterBar />
      </div>

      {/* ─── 3. MAIN AREA: Sidebar kiri (list laporan) + Peta ────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Sidebar kiri — HANYA list kartu laporan terbaru, tidak ada statistik */}
        <aside
          className="w-[200px] xl:w-[220px] shrink-0 flex flex-col overflow-hidden border-r border-ink"
          style={{ background: 'var(--paper-white)' }}
        >
          <div
            className="px-3 py-2 border-b border-ink font-mono text-[10px] font-bold uppercase tracking-wider text-ink/70 shrink-0"
            style={{ background: 'var(--paper-kraft)' }}
          >
            Laporan Terbaru
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading && filteredReports.length === 0 ? (
              <div className="p-4 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : recentReports.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-ink/50">
                Belum ada laporan
              </div>
            ) : (
              <div className="divide-y divide-ink/15">
                {recentReports.map((report, idx) => {
                  const isCritical = report.skorUrgensi >= 80;
                  const paperBg =
                    report.category === 'BANJIR'
                      ? 'var(--paper-blue)'
                      : ['KEBERSIHAN', 'KEAMANAN'].includes(report.category)
                      ? 'var(--paper-kraft)'
                      : 'var(--paper-white)';

                  const tiltClass = isCritical
                    ? idx % 2 === 0
                      ? 'tilt-kritis-left'
                      : 'tilt-kritis-right'
                    : '';

                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => handleSelectReport(report)}
                      className={clsx(
                        'w-full text-left p-2.5 block border-b border-ink/10 transition-opacity hover:opacity-80 space-y-1',
                        tiltClass
                      )}
                      style={{ background: paperBg }}
                    >
                      {/* Category + urgency row */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1 text-[10px] font-body text-ink/80 truncate min-w-0">
                          {getCategoryIcon(report.category, 'w-3 h-3 shrink-0')}
                          <span className="truncate">{CATEGORY_LABELS[report.category]}</span>
                        </div>
                        <UrgencyBadge score={report.skorUrgensi} showScore={false} />
                      </div>

                      {/* Title */}
                      <div className="font-body text-[11px] font-semibold text-ink leading-tight line-clamp-2">
                        {report.title}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center justify-between font-mono text-[9px] text-ink/60 pt-0.5 border-t border-ink/10">
                        <span className="truncate max-w-[100px]">
                          {report.kelurahan?.name || 'Surabaya'}
                        </span>
                        <span>
                          {(() => {
                            try {
                              return format(parseISO(report.createdAt), 'dd/MM HH:mm');
                            } catch {
                              return '';
                            }
                          })()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Kolom tengah — peta mengisi sisa ruang */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {/* Map Viewport */}
          <div className="flex-1 relative w-full">
            <MapView
              onSelectReport={handleSelectReport}
              onMapClick={handleMapClick}
              isPickingLocation={isPickingLocation}
            />

            {/* Loading overlay */}
            {isLoading && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[800] bg-paper-white border border-ink px-3 py-1 text-xs font-mono text-ink flex items-center gap-2">
                <LoadingSpinner size="sm" />
                <span>Memuat data peta...</span>
              </div>
            )}

            {/* Location picking hint */}
            {isPickingLocation && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[800] bg-mustard border border-ink px-3 py-1.5 text-xs font-mono text-ink flex items-center gap-2 font-bold">
                <IconMapPin className="w-3.5 h-3.5" stroke={1.5} />
                Klik titik di peta untuk memilih lokasi
              </div>
            )}
          </div>

          {/* ─── 4. TIME SLIDER ─────────────────────────────────────────────── */}
          <div
            className="shrink-0 border-t border-ink px-3 py-2"
            style={{ background: 'var(--paper-white)' }}
          >
            <TimeSlider />
          </div>
        </main>

        {/* Report Detail Dossier slide-over */}
        <ReportDetailPanel />

        {/* Report Form modal */}
        {isFormOpen && (
          <div className="absolute inset-0 z-[950] flex items-center justify-center p-3 bg-black/50">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper-white border border-ink">
              <div
                className="px-4 py-3 border-b border-ink flex items-center justify-between"
                style={{ background: 'var(--paper-kraft)' }}
              >
                <div className="flex items-center gap-2 text-ink">
                  <IconBuildingCommunity className="w-4 h-4" stroke={1.5} />
                  <h3 className="font-body font-bold text-sm text-ink tracking-wide">
                    FORMULIR LAPORAN MASALAH WARGA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-ink/70 hover:text-ink border border-ink/30 hover:border-ink transition-colors"
                >
                  <IconX className="w-4 h-4" stroke={1.5} />
                </button>
              </div>
              <div className="p-4">
                <ReportForm
                  onSuccess={() => {
                    setIsFormOpen(false);
                    setPickedLocation(null);
                  }}
                  onCancel={() => setIsFormOpen(false)}
                  initialLocation={pickedLocation}
                  onPickLocation={handlePickLocation}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPage;
