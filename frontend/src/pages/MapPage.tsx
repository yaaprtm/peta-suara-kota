import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconPlus,
  IconLogout,
  IconX,
  IconMapPin,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import MapView from '../components/map/MapView';
import MapFilterBar from '../components/map/MapFilterBar';
import ReportDetailPanel from '../components/map/ReportDetailPanel';
import TimeSlider from '../components/map/TimeSlider';
import ReportForm from '../components/reports/ReportForm';
import { LoadingSpinner, UrgencyBadge, getCategoryIcon } from '../components/ui/Badges';
import { SurabayaLogoMark, IllustrationTuguPahlawanUmbrella } from '../components/ui/SurabayaIllustrations';
import { useReportsStore } from '../stores/reportsStore';
import { useAuthStore } from '../stores/authStore';
import { createSSEConnection } from '../lib/api';
import { Report, CATEGORY_LABELS, CATEGORY_COLORS } from '../types';
import { fetchKecamatanGeoJSON, findKecamatanByCoordinate } from '../lib/kecamatan';
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
    setHoveredReportId,
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
        fetchKecamatanGeoJSON().then((geojson) => {
          const match = findKecamatanByCoordinate(latlng.lng, latlng.lat, geojson);
          if (!match) {
            toast.error('Titik berada di luar wilayah Kota Surabaya. Silakan pilih lokasi di dalam Surabaya.');
            return;
          }
          setPickedLocation(latlng);
          setIsPickingLocation(false);
          setIsFormOpen(true);
          toast.success(`Titik lokasi dipilih: Kec. ${match.name}`);
        });
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

  // Split reports into priority sections
  const { urgentReports, otherReports } = useMemo(() => {
    const sorted = [...filteredReports]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const urgent: Report[] = [];
    const other: Report[] = [];

    sorted.forEach((r) => {
      if (r.skorUrgensi >= 60) {
        urgent.push(r);
      } else {
        other.push(r);
      }
    });

    return {
      urgentReports: urgent.slice(0, 15),
      otherReports: other.slice(0, 20),
    };
  }, [filteredReports]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden" style={{ background: 'var(--board-bg)' }}>

      {/* ─── 1. TOP BAR ──────────────────────────────────────────────────────── */}
      <header className="z-[1000] shrink-0 bg-paper-white border-b border-ink">
        <div className="flex items-center justify-between px-4 py-2 gap-3">

          {/* Brand: Logo Mark + Serif Wordmark + SURABAYA tag */}
          <div className="flex items-center gap-2.5 min-w-0">
            <SurabayaLogoMark className="w-7 h-7 shrink-0" />
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="font-serif font-bold text-xl text-ink leading-none whitespace-nowrap tracking-tight">
                Peta Suara Kota
              </span>
              <span
                className="font-mono text-[9px] px-1.5 py-0.5 border border-ink shrink-0 hidden sm:inline-block"
                style={{ background: 'var(--paper-kraft)', color: 'var(--ink)', borderRadius: '2px' }}
              >
                SURABAYA
              </span>
            </div>
          </div>

          {/* Navigation + Actions */}
          <nav className="flex items-center gap-3 shrink-0">

            {/* Primary CTA */}
            <button
              onClick={handleOpenForm}
              className="btn-paper-primary flex items-center gap-1.5 text-xs py-1.5 px-3 font-bold"
            >
              <IconPlus className="w-4 h-4" stroke={2} />
              <span className="hidden sm:inline">Lapor, Rek!</span>
              <span className="sm:hidden">Lapor</span>
            </button>

            {/* Secondary links */}
            <button
              onClick={() => navigate('/leaderboard')}
              className="text-[11px] font-sans text-ink/60 hover:text-ink underline-offset-2 hover:underline whitespace-nowrap hidden sm:block"
            >
              Warga Paling Peduli
            </button>

            {user?.role && ['PETUGAS', 'ADMIN'].includes(user.role) && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-[11px] font-sans text-ink/60 hover:text-ink underline-offset-2 hover:underline whitespace-nowrap hidden md:block"
              >
                Dashboard
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2 border-l border-border-paper pl-3">
                <span className="text-[11px] font-sans text-ink/70 hidden sm:block truncate max-w-[90px]">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="p-1 text-ink/50 hover:text-ink border border-border-paper hover:border-ink transition-colors"
                  style={{ borderRadius: '2px' }}
                  title="Keluar"
                >
                  <IconLogout className="w-3.5 h-3.5" stroke={1.5} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-[11px] font-sans text-ink/60 hover:text-ink underline-offset-2 hover:underline border-l border-border-paper pl-3"
              >
                Masuk, Cak/Ning
              </button>
            )}
          </nav>
        </div>

        {/* Red-and-white accent line */}
        <div className="surabaya-accent-line" />
      </header>

      {/* ─── 2. FILTER BAR ────────────────────────────────────────────────────── */}
      <div className="z-[900] shrink-0 border-b border-border-paper bg-paper-white">
        <MapFilterBar />
      </div>

      {/* ─── 3. MAIN AREA: Sidebar kiri + Peta ──────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left sidebar — report cards split into priority sections */}
        <aside
          className="w-[210px] xl:w-[230px] shrink-0 flex flex-col overflow-hidden border-r border-border-paper hidden md:flex"
          style={{ background: 'var(--paper-bg)' }}
        >
          <div className="flex-1 overflow-y-auto">
            {isLoading && filteredReports.length === 0 ? (
              <div className="p-6 flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            ) : urgentReports.length === 0 && otherReports.length === 0 ? (
              /* Empty state with Tugu Pahlawan illustration */
              <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                <IllustrationTuguPahlawanUmbrella className="w-24 h-24 mb-3 opacity-80" />
                <p className="font-serif text-sm font-bold text-ink mb-1">Aman, Rek.</p>
                <p className="font-sans text-[11px] text-ink/60 max-w-[160px]">
                  Belum ada laporan di sini. Coba longgarkan filternya.
                </p>
              </div>
            ) : (
              <>
                {/* Section: Perlu perhatian sekarang */}
                {urgentReports.length > 0 && (
                  <div>
                    <div
                      className="px-3 py-1.5 border-b border-border-paper font-mono text-[9px] font-bold uppercase tracking-widest text-severity-critical/80 shrink-0 flex items-center gap-1.5"
                      style={{ background: 'var(--paper-kraft)' }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-severity-critical shrink-0" />
                      Perlu perhatian sekarang
                    </div>
                    <div>
                      {urgentReports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onSelect={handleSelectReport}
                          onHover={setHoveredReportId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Section: Laporan lainnya */}
                {otherReports.length > 0 && (
                  <div>
                    <div
                      className="px-3 py-1.5 border-b border-border-paper font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50 shrink-0"
                      style={{ background: 'var(--paper-white)' }}
                    >
                      Laporan lainnya
                    </div>
                    <div>
                      {otherReports.map((report) => (
                        <ReportCard
                          key={report.id}
                          report={report}
                          onSelect={handleSelectReport}
                          onHover={setHoveredReportId}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Map viewport */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
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
                <span>Lagi nyari laporan…</span>
              </div>
            )}

            {/* Location picking hint */}
            {isPickingLocation && (
              <div
                className="absolute top-3 left-1/2 -translate-x-1/2 z-[800] bg-paper-kraft border border-ink px-3 py-1.5 text-xs font-sans text-ink flex items-center gap-2 font-semibold"
                style={{ borderRadius: '2px' }}
              >
                <IconMapPin className="w-3.5 h-3.5" stroke={1.5} />
                Klik titik di peta untuk memilih lokasi
              </div>
            )}
          </div>

          {/* ─── 4. TIME SLIDER ─────────────────────────────────────────────── */}
          <div
            className="shrink-0 border-t border-border-paper"
            style={{ background: 'var(--paper-white)' }}
          >
            <TimeSlider />
          </div>
        </main>

        {/* Report Detail Dossier slide-over */}
        <ReportDetailPanel />

        {/* Report Form modal */}
        {isFormOpen && (
          <div className="absolute inset-0 z-[950] flex items-center justify-center p-3 bg-ink/40">
            <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-paper-white border border-ink" style={{ borderRadius: '2px' }}>
              <div
                className="px-4 py-3 border-b border-ink flex items-center justify-between"
                style={{ background: 'var(--paper-kraft)' }}
              >
                <div className="flex items-center gap-2 text-ink">
                  <SurabayaLogoMark className="w-5 h-5" />
                  <h3 className="font-sans font-bold text-sm text-ink tracking-wide">
                    FORMULIR LAPORAN WARGA
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-ink/60 hover:text-ink border border-border-paper hover:border-ink transition-colors"
                  style={{ borderRadius: '2px' }}
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

// ─── ReportCard: Sidebar Card ────────────────────────────────────────────────

interface ReportCardProps {
  report: Report;
  onSelect: (r: Report) => void;
  onHover: (id: string | null) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onSelect, onHover }) => {
  const isCritical = report.skorUrgensi >= 80;
  const isHigh = report.skorUrgensi >= 60;
  const catColor = CATEGORY_COLORS[report.category] || '#8A7F70';

  // Severity left border: 4px red for critical, 2px orange for high, none for others
  const borderStyle: React.CSSProperties = isCritical
    ? { borderLeftWidth: '4px', borderLeftColor: '#C0392B' }
    : isHigh
    ? { borderLeftWidth: '2px', borderLeftColor: '#D9822B' }
    : {};

  return (
    <button
      type="button"
      onClick={() => onSelect(report)}
      onMouseEnter={() => onHover(report.id)}
      onMouseLeave={() => onHover(null)}
      className="w-full text-left px-3 py-2 block border-b border-border-paper/60 transition-all hover:-translate-y-[1px] hover:shadow-sm space-y-0.5 group"
      style={{
        background: 'var(--paper-white)',
        ...borderStyle,
      }}
    >
      {/* Row 1: Category icon + title */}
      <div className="flex items-start gap-1.5">
        <span className="mt-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {getCategoryIcon(report.category, 'w-3 h-3')}
        </span>
        <span className="font-sans text-[11px] font-semibold text-ink leading-tight line-clamp-2">
          {report.title}
        </span>
      </div>

      {/* Row 2: Meta */}
      <div className="flex items-center justify-between gap-1 pl-[18px]">
        <span className="font-sans text-[9px] text-ink/50 truncate max-w-[100px]">
          {report.kecamatan || report.kelurahan?.kecamatan || 'Surabaya'}
        </span>
        <div className="flex items-center gap-1.5">
          {(isCritical || isHigh) && (
            <UrgencyBadge score={report.skorUrgensi} showScore={false} className="scale-90" />
          )}
          <span className="font-mono text-[9px] text-ink/40">
            {(() => {
              try {
                return format(parseISO(report.createdAt), 'dd/MM HH:mm');
              } catch {
                return '';
              }
            })()}
          </span>
        </div>
      </div>
    </button>
  );
};

export default MapPage;
