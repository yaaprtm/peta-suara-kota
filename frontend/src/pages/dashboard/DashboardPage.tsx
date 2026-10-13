import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconUser,
  IconPlus,
  IconMapPin,
  IconClock,
  IconCheck,
  IconFileText,
  IconMicrophone,
  IconSearch,
  IconFilter,
  IconExternalLink,
  IconChevronRight,
  IconSparkles,
  IconAlertCircle,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useReportsStore } from '../../stores/reportsStore';
import { Report, ReportCategory, ReportStatus, CATEGORY_LABELS } from '../../types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '../../components/ui/Badges';
import ReportForm from '../../components/reports/ReportForm';

const WargaDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, addReport } = useReportsStore();

  const [activeTab, setActiveTab] = useState<'laporanku' | 'peta' | 'semua'>('laporanku');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Filter reports submitted by current user (or fallback sample)
  const myReports = useMemo(() => {
    const userEmail = user?.email?.toLowerCase();
    const userName = user?.name?.toLowerCase();
    return reports.filter(r => {
      const matchUser = r.user?.name?.toLowerCase().includes('budi') ||
                        r.user?.name?.toLowerCase() === userName ||
                        r.userId === user?.id;
      return matchUser;
    });
  }, [reports, user]);

  // If user has no reports yet, provide user-created reports first
  const displayMyReports = myReports.length > 0 ? myReports : reports.slice(0, 3);

  // My stats
  const myStats = {
    total: displayMyReports.length,
    diproses: displayMyReports.filter(r => r.status === 'DIPROSES').length,
    selesai: displayMyReports.filter(r => r.status === 'SELESAI').length,
    baru: displayMyReports.filter(r => r.status === 'BARU').length,
  };

  // All city reports filtered
  const filteredAllReports = useMemo(() => {
    return reports.filter(r => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      }
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      return true;
    });
  }, [reports, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 font-sans">
      {/* Top Banner Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold shadow-sm">
              <IconBuildingCommunity className="w-5 h-5 text-orange" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-orange/20 text-orange-800 font-bold px-1.5 py-0.5 rounded uppercase">
                  BERANDA WARGA
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Peta Suara Kota Surabaya</span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base">
                Selamat Datang, {user?.name || 'Warga Surabaya'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-orange py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <IconPlus className="w-4 h-4" />
              <span>Buat Laporan Baru</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Welcome Card */}
      <section className="bg-gradient-to-r from-navy to-navy-800 text-white px-4 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-orange text-xs font-semibold flex items-center gap-1">
                <IconSparkles className="w-4 h-4" />
                Layanan Suara Aspirasi Warga
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
              Ada masalah di lingkungan sekitarmu, Rek?
            </h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Laporkan jalan rusak, tumpukan sampah, banjir, atau lampu mati lewat suara & foto. Laporanmu langsung tersambung ke Command Center dinas terkait.
            </p>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 p-3.5 rounded-xl flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-300 block">Status Akun Warga:</span>
              <span className="font-bold text-white block">{user?.name || 'Warga Kota'}</span>
              <span className="text-[11px] text-orange block">{user?.kelurahan?.name || 'Kelurahan Gubeng, Surabaya'}</span>
            </div>
            <div className="h-8 w-px bg-navy-700" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-orange py-1.5 px-3 text-xs whitespace-nowrap"
            >
              Lapor Cepat
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Personal Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 block mb-1">TOTAL LAPORANKU</span>
            <span className="text-2xl font-bold text-navy">{myStats.total}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Aspirasi diajukan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-sky-600 block mb-1">BARU DITERIMA</span>
            <span className="text-2xl font-bold text-sky-700">{myStats.baru}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Menunggu penugasan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-600 block mb-1">SEDANG DIPROSES</span>
            <span className="text-2xl font-bold text-amber-700">{myStats.diproses}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Petugas di lapangan</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-600 block mb-1">WES BERES (SELESAI)</span>
            <span className="text-2xl font-bold text-emerald-700">{myStats.selesai}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">Penanganan tuntas</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="border-b border-slate-200 px-4 flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab('laporanku')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'laporanku'
                  ? 'border-navy text-navy font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconFileText className="w-4 h-4 text-orange" />
              <span>Laporan Saya ({displayMyReports.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('peta')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'peta'
                  ? 'border-navy text-navy font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconMapPin className="w-4 h-4 text-orange" />
              <span>Peta Interaktif Suara Kota</span>
            </button>

            <button
              onClick={() => setActiveTab('semua')}
              className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                activeTab === 'semua'
                  ? 'border-navy text-navy font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <IconBuildingCommunity className="w-4 h-4 text-orange" />
              <span>Semua Laporan Warga ({reports.length})</span>
            </button>
          </div>

          {/* TAB 1: LAPORAN SAYA */}
          {activeTab === 'laporanku' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">
                  Riwayat pengaduan yang telah kamu kirimkan ke Pemerintah Kota Surabaya:
                </span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs text-orange hover:text-orange-600 font-semibold flex items-center gap-1"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  Tambah Laporan Baru
                </button>
              </div>

              {displayMyReports.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">Belum Ada Laporan Terkirim</h3>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                    Kamu belum pernah membuat pengaduan. Ayo buat laporan pertamamu sekarang!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-navy text-xs"
                  >
                    Buat Laporan Baru
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {displayMyReports.map((report) => (
                    <div
                      key={report.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <CategoryBadge category={report.category} />
                          <StatusBadge status={report.status} />
                        </div>

                        <h3 className="font-bold text-navy text-sm line-clamp-1">
                          {report.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                          {report.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-[11px]">
                          <IconMapPin className="w-3.5 h-3.5 text-orange" />
                          <span>{report.kelurahan?.name || report.kecamatan || 'Surabaya'}</span>
                        </span>

                        <Link
                          to={`/laporan/${report.id}`}
                          className="text-xs font-semibold text-navy hover:text-orange flex items-center gap-1"
                        >
                          <span>Lihat Garis Waktu</span>
                          <IconChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PETA INTERAKTIF KOTA */}
          {activeTab === 'peta' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-navy text-xs uppercase tracking-wider">
                    Peta Sebaran Laporan Seluruh Surabaya
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Jelajahi titik laporan aktif dari warga se-Surabaya
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {reports.length} Titik Terdeteksi
                </span>
              </div>

              <div className="h-[520px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <iframe
                  title="Peta Interaktif Warga"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=112.65%2C-7.35%2C112.82%2C-7.20&layer=mapnik`}
                />
              </div>
            </div>
          )}

          {/* TAB 3: SEMUA LAPORAN WARGA */}
          {activeTab === 'semua' && (
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari pengaduan kota..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="INFRASTRUKTUR">Infrastruktur</option>
                  <option value="KEBERSIHAN">Kebersihan</option>
                  <option value="KEAMANAN">Keamanan</option>
                  <option value="BANJIR">Banjir</option>
                  <option value="LAINNYA">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAllReports.slice(0, 12).map((r) => (
                  <div
                    key={r.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <CategoryBadge category={r.category} />
                      <StatusBadge status={r.status} />
                    </div>

                    <h4 className="font-bold text-navy text-xs line-clamp-1">{r.title}</h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{r.description}</p>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="w-3 h-3 text-orange" />
                        <span>{r.kelurahan?.name || r.kecamatan || 'Surabaya'}</span>
                      </span>

                      <Link
                        to={`/laporan/${r.id}`}
                        className="text-xs font-semibold text-navy hover:text-orange flex items-center gap-0.5"
                      >
                        <span>Detail Laporan</span>
                        <IconChevronRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modal Form: Buat Laporan Baru */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <ReportForm
              onClose={() => setShowCreateModal(false)}
              onCancel={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                toast.success('Laporan berhasil dikirim dan masuk ke antrean petugas!');
              }}
              onPickLocation={() => {
                toast('Klik titik peta untuk memilih lokasi');
              }}
              pickedLocation={pickedLocation}
              initialLocation={pickedLocation || { lat: -7.2754, lng: 112.7533 }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WargaDashboardPage;
