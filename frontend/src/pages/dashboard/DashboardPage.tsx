import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconUser,
  IconPlus,
  IconMapPin,
  IconFileText,
  IconSearch,
  IconChevronRight,
  IconSparkles,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { useReportsStore } from '../../stores/reportsStore';
import { Report, ReportCategory } from '../../types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '../../components/ui/Badges';
import ReportForm from '../../components/reports/ReportForm';
import LanguageToggle from '../../components/ui/LanguageToggle';
import { useTranslation } from '../../i18n/useTranslation';

const WargaDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, addReport } = useReportsStore();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'laporanku' | 'peta' | 'semua'>('laporanku');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'ALL'>('ALL');
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null);

  const myReports = useMemo(() => {
    const userName = user?.name?.toLowerCase();
    return reports.filter(r => {
      return r.user?.name?.toLowerCase().includes('budi') ||
             r.user?.name?.toLowerCase() === userName ||
             r.userId === user?.id;
    });
  }, [reports, user]);

  const displayMyReports = myReports.length > 0 ? myReports : reports.slice(0, 3);

  const myStats = {
    total: displayMyReports.length,
    diproses: displayMyReports.filter(r => r.status === 'DIPROSES').length,
    selesai: displayMyReports.filter(r => r.status === 'SELESAI').length,
    baru: displayMyReports.filter(r => r.status === 'BARU').length,
  };

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
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-navy flex items-center justify-center text-white font-bold shadow-sm">
              <IconBuildingCommunity className="w-5 h-5 text-orange" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-orange/20 text-orange-800 font-bold px-1.5 py-0.5 rounded uppercase">
                  {t('dashboard.badgeLabel')}
                </span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">{t('dashboard.pageSubtitle')}</span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base">
                {t('dashboard.welcomeTitle', { name: user?.name || 'Warga Surabaya' })}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-orange py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <IconPlus className="w-4 h-4" />
              <span>{t('dashboard.createBtn')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-navy to-navy-800 text-white px-4 py-6 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-orange text-xs font-semibold flex items-center gap-1">
                <IconSparkles className="w-4 h-4" />
                {t('dashboard.heroLabel')}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white mb-1">{t('dashboard.heroTitle')}</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">{t('dashboard.heroDesc')}</p>
          </div>

          <div className="bg-navy-900/60 border border-navy-700 p-3.5 rounded-xl flex items-center gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-300 block">{t('dashboard.accountStatus')}</span>
              <span className="font-bold text-white block">{user?.name || 'Warga Kota'}</span>
              <span className="text-[11px] text-orange block">
                {(user as any)?.kelurahan?.name || t('dashboard.defaultLocation')}
              </span>
            </div>
            <div className="h-8 w-px bg-navy-700" />
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-orange py-1.5 px-3 text-xs whitespace-nowrap"
            >
              {t('dashboard.quickReport')}
            </button>
          </div>
        </div>
      </section>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-500 block mb-1">{t('dashboard.statTotalLabel')}</span>
            <span className="text-2xl font-bold text-navy">{myStats.total}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">{t('dashboard.statTotalSub')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-sky-600 block mb-1">{t('dashboard.statBaruLabel')}</span>
            <span className="text-2xl font-bold text-sky-700">{myStats.baru}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">{t('dashboard.statBaruSub')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-amber-600 block mb-1">{t('dashboard.statDiprosesLabel')}</span>
            <span className="text-2xl font-bold text-amber-700">{myStats.diproses}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">{t('dashboard.statDiprosesSub')}</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-600 block mb-1">{t('dashboard.statSelesaiLabel')}</span>
            <span className="text-2xl font-bold text-emerald-700">{myStats.selesai}</span>
            <span className="text-[11px] text-slate-500 mt-1 block">{t('dashboard.statSelesaiSub')}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="border-b border-slate-200 px-4 flex items-center gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
            {[
              { key: 'laporanku', label: t('dashboard.tab1', { count: displayMyReports.length }), icon: <IconFileText className="w-4 h-4 text-orange" /> },
              { key: 'peta', label: t('dashboard.tab2'), icon: <IconMapPin className="w-4 h-4 text-orange" /> },
              { key: 'semua', label: t('dashboard.tab3', { count: reports.length }), icon: <IconBuildingCommunity className="w-4 h-4 text-orange" /> },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                  activeTab === key
                    ? 'border-navy text-navy font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: My Reports */}
          {activeTab === 'laporanku' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs text-slate-600">{t('dashboard.tab1Subtitle')}</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="text-xs text-orange hover:text-orange-600 font-semibold flex items-center gap-1"
                >
                  <IconPlus className="w-3.5 h-3.5" />
                  {t('dashboard.addReportBtn')}
                </button>
              </div>

              {displayMyReports.length === 0 ? (
                <div className="text-center py-12">
                  <IconFileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <h3 className="font-bold text-slate-700 text-sm">{t('dashboard.emptyTitle')}</h3>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">{t('dashboard.emptyDesc')}</p>
                  <button onClick={() => setShowCreateModal(true)} className="btn-navy text-xs">
                    {t('dashboard.emptyBtn')}
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
                        <h3 className="font-bold text-navy text-sm line-clamp-1">{report.title}</h3>
                        <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">{report.description}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <IconMapPin className="w-3.5 h-3.5 text-orange" />
                          <span>{report.kelurahan?.name || report.kecamatan || 'Surabaya'}</span>
                        </span>
                        <Link
                          to={`/laporan/${report.id}`}
                          className="text-xs font-semibold text-navy hover:text-orange flex items-center gap-1"
                        >
                          <span>{t('dashboard.viewTimeline')}</span>
                          <IconChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Map */}
          {activeTab === 'peta' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-navy text-xs uppercase tracking-wider">{t('dashboard.mapTitle')}</h3>
                  <p className="text-[11px] text-slate-500">{t('dashboard.mapSubtitle')}</p>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {t('dashboard.mapPoints', { count: reports.length })}
                </span>
              </div>
              <div className="h-[520px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                <iframe
                  title={t('dashboard.mapIframeTitle')}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=112.65%2C-7.35%2C112.82%2C-7.20&layer=mapnik"
                />
              </div>
            </div>
          )}

          {/* TAB 3: All Reports */}
          {activeTab === 'semua' && (
            <div className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <IconSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dashboard.searchPlaceholder')}
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white"
                >
                  <option value="ALL">{t('common.allCategories')}</option>
                  <option value="INFRASTRUKTUR">{t('category.INFRASTRUKTUR')}</option>
                  <option value="KEBERSIHAN">{t('category.KEBERSIHAN')}</option>
                  <option value="KEAMANAN">{t('category.KEAMANAN')}</option>
                  <option value="BANJIR">{t('category.BANJIR')}</option>
                  <option value="LAINNYA">{t('category.LAINNYA')}</option>
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
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="w-3 h-3 text-orange" />
                        <span>{r.kelurahan?.name || r.kecamatan || 'Surabaya'}</span>
                      </span>
                      <Link
                        to={`/laporan/${r.id}`}
                        className="text-xs font-semibold text-navy hover:text-orange flex items-center gap-0.5"
                      >
                        <span>{t('dashboard.detailLink')}</span>
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

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden my-6">
            <ReportForm
              onClose={() => setShowCreateModal(false)}
              onCancel={() => setShowCreateModal(false)}
              onSuccess={() => {
                setShowCreateModal(false);
                toast.success(t('dashboard.submitSuccess'));
              }}
              onPickLocation={() => toast(t('map.pickLocationToast'))}
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
