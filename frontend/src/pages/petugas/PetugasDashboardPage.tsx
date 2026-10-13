import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconShield,
  IconAlertTriangle,
  IconFlame,
  IconFilter,
  IconCheck,
  IconClock,
  IconRefresh,
  IconMapPin,
  IconSearch,
  IconSend,
  IconFileSpreadsheet,
  IconChevronRight,
  IconTrendingUp,
  IconX,
  IconFileText,
  IconExternalLink,
  IconCalendar,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useReportsStore } from '../../stores/reportsStore';
import { useAuthStore } from '../../stores/authStore';
import { Report, ReportCategory, ReportStatus, UrgencyLevel, getUrgencyLevel, STATUS_LABELS, CATEGORY_LABELS } from '../../types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '../../components/ui/Badges';

const PetugasDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, updateReportStatus, resetReports } = useReportsStore();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'ALL'>('ALL');
  const [selectedLevel, setSelectedLevel] = useState<UrgencyLevel | 'ALL'>('ALL');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Status Action Modal
  const [actionReport, setActionReport] = useState<Report | null>(null);
  const [actionStatus, setActionStatus] = useState<ReportStatus>('DIPROSES');
  const [actionNote, setActionNote] = useState('');
  const [showRekapModal, setShowRekapModal] = useState(false);

  // Filter and sort reports: Urgent at the TOP!
  const sortedAndFilteredReports = useMemo(() => {
    return reports
      .filter((r) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = r.title.toLowerCase().includes(q);
          const matchDesc = r.description.toLowerCase().includes(q);
          const matchLoc = (r.kecamatan || r.kelurahan?.name || '').toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchLoc) return false;
        }
        if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
        if (selectedStatus !== 'ALL' && r.status !== selectedStatus) return false;
        if (selectedLevel !== 'ALL' && getUrgencyLevel(r.skorUrgensi) !== selectedLevel) return false;
        return true;
      })
      .sort((a, b) => {
        // First sort by Urgency score descending (Urgent on TOP)
        if (b.skorUrgensi !== a.skorUrgensi) {
          return b.skorUrgensi - a.skorUrgensi;
        }
        // Then sort by date descending
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [reports, searchQuery, selectedCategory, selectedStatus, selectedLevel]);

  // Selected report object
  const activeReport = useMemo(() => {
    if (selectedReportId) {
      return reports.find((r) => r.id === selectedReportId) || sortedAndFilteredReports[0] || null;
    }
    return sortedAndFilteredReports[0] || null;
  }, [reports, selectedReportId, sortedAndFilteredReports]);

  // Daily recap stats
  const dailyStats = useMemo(() => {
    const total = reports.length;
    const baru = reports.filter(r => r.status === 'BARU').length;
    const diproses = reports.filter(r => r.status === 'DIPROSES').length;
    const selesai = reports.filter(r => r.status === 'SELESAI').length;
    const urgentCount = reports.filter(r => r.skorUrgensi >= 80).length;
    const highCount = reports.filter(r => r.skorUrgensi >= 60 && r.skorUrgensi < 80).length;
    return { total, baru, diproses, selesai, urgentCount, highCount };
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
      actionNote || `Status diperbarui menjadi ${STATUS_LABELS[actionStatus]} oleh ${user?.name || 'Petugas'}`,
      {
        id: user?.id || 'petugas-cc',
        name: user?.name || 'Petugas Command Center',
        role: user?.role || 'PETUGAS',
      }
    );

    toast.success(`Laporan diperbarui: ${STATUS_LABELS[actionStatus]}`);
    setActionReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <header className="bg-navy text-white px-4 py-3 border-b border-navy-700 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange flex items-center justify-center text-navy-900 font-bold shadow-sm">
              <IconShield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm sm:text-base text-white tracking-tight leading-none">
                  COMMAND CENTER PETUGAS SURABAYA
                </h1>
                <span className="bg-orange/20 text-orange border border-orange/30 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                  LIVE RADAR
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Aparatur: <b className="text-white">{user?.name || 'Petugas Operasional'}</b> · Antrean Urgensi Terpadu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRekapModal(true)}
              className="bg-orange hover:bg-orange-600 text-navy-900 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <IconFileSpreadsheet className="w-4 h-4" />
              <span>Rekap Laporan Harian</span>
            </button>
            <button
              onClick={() => {
                toast.success('Data antrean berhasil disegarkan');
              }}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
              title="Segarkan Data"
            >
              <IconRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Quick Metrics Bar */}
      <section className="bg-white border-b border-slate-200 px-4 py-2.5">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div className="bg-red-50/70 border border-red-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-red-600 font-semibold uppercase tracking-wider block">Urgent (Kritis)</span>
              <span className="text-base font-bold text-red-700 leading-none">{dailyStats.urgentCount}</span>
            </div>
            <IconFlame className="w-5 h-5 text-red-600 animate-pulse" />
          </div>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-sky-600 font-semibold uppercase tracking-wider block">Baru Masuk</span>
              <span className="text-base font-bold text-sky-700 leading-none">{dailyStats.baru}</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider block">Diproses</span>
              <span className="text-base font-bold text-amber-700 leading-none">{dailyStats.diproses}</span>
            </div>
            <IconClock className="w-4 h-4 text-amber-600" />
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider block">Telah Selesai</span>
              <span className="text-base font-bold text-emerald-700 leading-none">{dailyStats.selesai}</span>
            </div>
            <IconCheck className="w-4 h-4 text-emerald-600" />
          </div>

          <div className="bg-navy-50 border border-navy-100 rounded-lg p-2 flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <span className="text-[10px] text-navy font-semibold uppercase tracking-wider block">Total Kota</span>
              <span className="text-base font-bold text-navy leading-none">{dailyStats.total} Laporan</span>
            </div>
            <IconTrendingUp className="w-4 h-4 text-navy" />
          </div>
        </div>
      </section>

      {/* Filter and Control Bar */}
      <section className="bg-slate-100/80 border-b border-slate-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, kata kunci, kelurahan..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-navy"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Kategori</option>
              <option value="INFRASTRUKTUR">Infrastruktur</option>
              <option value="KEBERSIHAN">Kebersihan</option>
              <option value="KEAMANAN">Keamanan</option>
              <option value="BANJIR">Banjir</option>
              <option value="LAINNYA">Lainnya</option>
            </select>

            {/* Urgency Level Filter */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Level Urgensi</option>
              <option value="kritis">Kritis (80-100)</option>
              <option value="tinggi">Tinggi (60-79)</option>
              <option value="sedang">Sedang (35-59)</option>
              <option value="rendah">Rendah (0-34)</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="BARU">Baru Masuk</option>
              <option value="DIPROSES">Sedang Diproses</option>
              <option value="SELESAI">Selesai</option>
              <option value="DITOLAK">Ditolak</option>
            </select>

            {(selectedCategory !== 'ALL' || selectedLevel !== 'ALL' || selectedStatus !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedCategory('ALL');
                  setSelectedLevel('ALL');
                  setSelectedStatus('ALL');
                  setSearchQuery('');
                }}
                className="text-[11px] text-rose-600 hover:underline font-medium px-1"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Command Center Grid: Left = Queue, Right = Interactive Map + Detail */}
      <main className="max-w-7xl mx-auto px-4 py-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 Cols): Antrean Laporan (Urgent di Atas) */}
        <section className="lg:col-span-5 flex flex-col bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs h-[720px]">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <IconFlame className="w-4 h-4 text-orange" />
              <h2 className="font-bold text-xs text-navy uppercase tracking-wider">
                Antrean Laporan ({sortedAndFilteredReports.length})
              </h2>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Urut: Prioritas Tertinggi</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5">
            {sortedAndFilteredReports.length === 0 ? (
              <div className="text-center py-16 px-4">
                <IconCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="font-bold text-slate-700 text-xs">Antrean Kosong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Tidak ada laporan dengan filter yang dipilih.</p>
              </div>
            ) : (
              sortedAndFilteredReports.map((report) => {
                const isSelected = activeReport?.id === report.id;
                const isCritical = report.skorUrgensi >= 80;

                return (
                  <div
                    key={report.id}
                    onClick={() => setSelectedReportId(report.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-navy bg-navy-50/50 shadow-xs ring-1 ring-navy'
                        : isCritical
                        ? 'border-red-200 bg-red-50/30 hover:border-red-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <UrgencyBadge score={report.skorUrgensi} />
                        <CategoryBadge category={report.category} />
                      </div>
                      <StatusBadge status={report.status} />
                    </div>

                    <h3 className="font-bold text-navy text-xs line-clamp-1 mb-1">
                      {report.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-relaxed">
                      {report.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1 truncate max-w-[180px]">
                        <IconMapPin className="w-3 h-3 text-orange shrink-0" />
                        <span className="truncate">{report.kelurahan?.name || report.kecamatan || 'Surabaya'}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <span>{format(parseISO(report.createdAt), 'dd/MM HH:mm')}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAction(report);
                          }}
                          className="bg-navy hover:bg-navy-700 text-white font-medium px-2 py-0.5 rounded text-[10px] flex items-center gap-0.5"
                        >
                          Ubah Status
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column (7 Cols): Command Center Map & Detail Panel */}
        <section className="lg:col-span-7 flex flex-col gap-4 h-[720px]">
          {/* Top Half: Interactive Map */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs flex-1 flex flex-col">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconMapPin className="w-4 h-4 text-orange" />
                <h3 className="font-bold text-xs text-navy uppercase tracking-wider">
                  Peta Posisi Semua Laporan Kota
                </h3>
              </div>
              {activeReport && (
                <span className="text-[11px] font-medium text-navy bg-navy-50 px-2 py-0.5 rounded border border-navy-100">
                  Target: {activeReport.kelurahan?.name || activeReport.kecamatan || 'Surabaya'}
                </span>
              )}
            </div>

            {/* Live Interactive OpenStreetMap View */}
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
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                  Pilih laporan untuk fokus koordinat
                </div>
              )}
            </div>
          </div>

          {/* Bottom Half: Active Report Action Card */}
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
                  <button
                    onClick={() => handleOpenAction(activeReport)}
                    className="btn-orange py-1 px-3 text-xs"
                  >
                    Tindakan Lapangan
                  </button>
                  <Link
                    to={`/laporan/${activeReport.id}`}
                    className="btn-outline py-1 px-2.5 text-xs flex items-center gap-1"
                  >
                    <span>Detail</span>
                    <IconExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">
                {activeReport.description}
              </p>

              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1">
                  <IconMapPin className="w-3.5 h-3.5 text-orange" />
                  <span>{activeReport.address || 'Alamat Surabaya'}</span>
                </span>
                <span className="font-mono text-[10px]">
                  Pelapor: <b>{activeReport.user?.name || 'Warga'}</b>
                </span>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Action Dialog: Update Status & Action Note */}
      {actionReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconShield className="w-4 h-4 text-orange" />
                <h3 className="font-bold text-xs uppercase tracking-wider">
                  Update Status & Tindakan Lapangan
                </h3>
              </div>
              <button
                onClick={() => setActionReport(null)}
                className="text-slate-400 hover:text-white"
              >
                <IconX className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAction} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-mono">Laporan:</span>
                <h4 className="font-bold text-navy text-xs line-clamp-1">{actionReport.title}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Ubah Status Menjadi:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['BARU', 'DIPROSES', 'SELESAI'] as ReportStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setActionStatus(st)}
                      className={`py-2 text-xs rounded-lg font-medium border text-center transition-all ${
                        actionStatus === st
                          ? 'bg-navy text-white border-navy font-bold shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Tindakan Petugas:
                </label>
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="Contoh: Tim Unit Reaksi Cepat DKRTH sedang membersihkan tumpukan sampah di lokasi..."
                  rows={3}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:border-navy"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionReport(null)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-navy py-1.5 px-4 text-xs"
                >
                  Simpan Tindakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rekap Laporan Harian Modal */}
      {showRekapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-navy px-5 py-3.5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconFileSpreadsheet className="w-5 h-5 text-orange" />
                <div>
                  <h3 className="font-bold text-sm text-white">Rekapitulasi Laporan Harian Petugas</h3>
                  <p className="text-[11px] text-slate-300">
                    Laporan Kinerja Penanganan Command Center Kota Surabaya
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRekapModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <IconX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-xs">
              {/* Daily Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-semibold">TOTAL LAPORAN</span>
                  <span className="text-xl font-bold text-navy">{dailyStats.total}</span>
                </div>
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <span className="text-[10px] text-red-600 block font-semibold">URGENT KRITIS</span>
                  <span className="text-xl font-bold text-red-700">{dailyStats.urgentCount}</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <span className="text-[10px] text-amber-600 block font-semibold">DALAM PROSES</span>
                  <span className="text-xl font-bold text-amber-700">{dailyStats.diproses}</span>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-emerald-600 block font-semibold">SELESAI DITANGANI</span>
                  <span className="text-xl font-bold text-emerald-700">{dailyStats.selesai}</span>
                </div>
              </div>

              {/* Table of top urgent reports handled today */}
              <div>
                <h4 className="font-bold text-navy text-xs uppercase tracking-wider mb-2">
                  Daftar Pengaduan Prioritas Tertinggi Hari Ini:
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="p-2.5">Judul Laporan</th>
                        <th className="p-2.5">Kategori</th>
                        <th className="p-2.5">Skor</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reports.slice(0, 8).map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="p-2.5 font-medium text-navy max-w-xs truncate">{r.title}</td>
                          <td className="p-2.5">{CATEGORY_LABELS[r.category]}</td>
                          <td className="p-2.5 font-bold font-mono text-orange">{r.skorUrgensi}</td>
                          <td className="p-2.5">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Pembaruan otomatis tiap ada pengaduan baru dari warga
              </span>
              <button
                onClick={() => {
                  toast.success('Rekap harian berhasil diunduh (Simulasi PDF/Excel)');
                  setShowRekapModal(false);
                }}
                className="btn-navy py-1.5 px-4 text-xs flex items-center gap-1.5"
              >
                <IconFileSpreadsheet className="w-4 h-4 text-orange" />
                <span>Cetak / Ekspor Rekap Harian</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetugasDashboardPage;
