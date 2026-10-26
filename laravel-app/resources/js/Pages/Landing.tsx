import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconBuildingCommunity,
  IconMapPin,
  IconShield,
  IconArrowRight,
  IconUser,
  IconCrown,
  IconTrophy,
  IconMenu2,
  IconX,
  IconSearch,
  IconLoader2,
} from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';
import { useReportsStore } from '@/stores/reportsStore';
import { reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageToggle from '@/Components/ui/LanguageToggle';

const LandingPage: React.FC = () => {
  const navigate = (url: string) => router.visit(url);
  const { user, loginAsRole } = useAuthStore();
  const { reports } = useReportsStore();
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'SELESAI').length;
  const criticalReports = reports.filter(r => r.skorUrgensi >= 80).length;

  const handleQuickEnter = (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => {
    loginAsRole(role);
    toast.success(`${t('auth.demoLogin', { role })}`);
    if (role === 'WARGA') navigate('/dashboard');
    else if (role === 'PETUGAS') navigate('/petugas');
    else if (role === 'SUPERADMIN') navigate('/superadmin');
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col">
      {/* ── Top Navigation ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white shadow-sm">
              <IconBuildingCommunity className="w-5 h-5 text-orange" />
            </div>
            <div>
              <span className="font-bold text-navy text-base tracking-tight leading-none block">
                {t('common.appName')}
              </span>
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block mt-0.5">
                {t('common.appSubtitle')}
              </span>
            </div>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-navy transition-colors">{t('landing.navFeatures')}</a>
            <a href="#alur" className="hover:text-navy transition-colors">{t('landing.navFlow')}</a>
            <a href="#peta" className="hover:text-navy transition-colors">{t('landing.navMap')}</a>
            <Link href="/leaderboard" className="hover:text-navy transition-colors flex items-center gap-1">
              <IconTrophy className="w-3.5 h-3.5 text-orange" />
              <span>{t('landing.navLeaderboard')}</span>
            </Link>
          </div>

          {/* Right side: actions + language toggle */}
          <div className="flex items-center gap-2 text-xs">
            <LanguageToggle className="hidden sm:inline-flex" />

            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'PETUGAS') navigate('/petugas');
                  else if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') navigate('/superadmin');
                  else navigate('/dashboard');
                }}
                className="btn-navy py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <span className="hidden sm:inline">{t('landing.openDashboard', { role: user.role })}</span>
                <span className="sm:hidden">{t('common.dashboard')}</span>
                <IconArrowRight className="w-3.5 h-3.5 text-orange" />
              </button>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/login" className="btn-outline py-1.5 px-3 text-xs">
                  {t('common.login')}
                </Link>
                <Link href="/register" className="btn-navy py-1.5 px-3.5 text-xs">
                  {t('common.register')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
              aria-label={t('landing.openMenu')}
            >
              {isMobileMenuOpen ? <IconX className="w-5 h-5" /> : <IconMenu2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-2 text-xs shadow-md">
            <a href="#alur" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium hover:text-navy">
              {t('landing.mobileFlow')}
            </a>
            <a href="#peta" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium hover:text-navy">
              {t('landing.mobileMap')}
            </a>
            <Link href="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 py-2 text-slate-700 font-medium hover:text-navy">
              <IconTrophy className="w-4 h-4 text-orange" />
              <span>{t('landing.mobileLeaderboard')}</span>
            </Link>
            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <LanguageToggle />
              {!user && (
                <>
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn-outline flex-1 py-2 text-center text-xs">
                    {t('common.login')}
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="btn-navy flex-1 py-2 text-center text-xs">
                    {t('common.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-white py-12 md:py-16 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-navy text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span>{t('landing.heroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
            {t('landing.heroTitle1')} <br />
            <span className="text-orange">{t('landing.heroTitle2')}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroDesc')}
          </p>

          {/* Quick Role Portal Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleQuickEnter('WARGA')}
              className="bg-navy hover:bg-navy-600 text-white font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group cursor-pointer"
            >
              <IconUser className="w-4 h-4 text-orange" />
              <span>{t('landing.btnWarga')}</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickEnter('PETUGAS')}
              className="bg-orange hover:bg-orange-600 text-navy-900 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group cursor-pointer"
            >
              <IconShield className="w-4 h-4" />
              <span>{t('landing.btnPetugas')}</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickEnter('SUPERADMIN')}
              className="bg-slate-100 hover:bg-slate-200 text-navy font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm border border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <IconCrown className="w-4 h-4 text-purple-700" />
              <span>{t('landing.btnSuperadmin')}</span>
            </button>
          </div>

          {/* KPI Counters */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 block">{t('landing.kpiTotal')}</span>
              <span className="text-xl sm:text-2xl font-bold text-navy">{totalReports}+</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{t('landing.kpiTotalSub')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-600 block">{t('landing.kpiDone')}</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-700">{completedReports} {t('landing.kpiDoneUnit')}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{t('landing.kpiDoneSub')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-red-600 block">{t('landing.kpiCritical')}</span>
              <span className="text-xl sm:text-2xl font-bold text-red-700">{criticalReports} {t('landing.kpiCasesUnit')}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{t('landing.kpiCriticalSub')}</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-orange block">{t('landing.kpiCoverage')}</span>
              <span className="text-xl sm:text-2xl font-bold text-navy">{t('landing.kpiCoverageSub1')}</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">{t('landing.kpiCoverageSub2')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Tracking Code Search ── */}
      <section className="py-8 bg-white px-4 border-b border-slate-100">
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 sm:p-6">
            <div className="text-center mb-4">
              <h3 className="text-sm font-bold text-navy">
                {t('landing.trackTitle') || 'Cek Status Laporan Anda'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {t('landing.trackDesc') || 'Masukkan kode tiket laporan Anda (contoh: PSK-SBY-XXXXXX)'}
              </p>
            </div>
            <form
              className="flex gap-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const code = trackingInput.trim();
                if (!code) return;
                setIsSearching(true);
                try {
                  const data = await reportsApi.track(code);
                  if (data.report) {
                    router.visit(`/laporan/${data.report.id}`);
                  } else {
                    toast.error(t('landing.trackNotFound') || 'Laporan tidak ditemukan.');
                  }
                } catch {
                  toast.error(t('landing.trackNotFound') || 'Kode tiket tidak ditemukan. Pastikan format kode benar.');
                } finally {
                  setIsSearching(false);
                }
              }}
            >
              <div className="flex-1 relative">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="PSK-SBY-XXXXXX"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !trackingInput.trim()}
                className="btn-navy px-4 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {isSearching ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconSearch className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('landing.trackBtn') || 'Lacak'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Workflow Section ── */}
      <section id="alur" className="py-12 bg-white px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-orange text-xs font-bold uppercase tracking-wider">{t('landing.sectionProcessLabel')}</span>
            <h2 className="text-2xl font-bold text-navy mt-1">{t('landing.sectionProcessTitle')}</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">{t('landing.sectionProcessDesc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { step: '1', bg: 'bg-navy', text: 'text-white', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
              { step: '2', bg: 'bg-orange', text: 'text-navy-900', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
              { step: '3', bg: 'bg-navy', text: 'text-white', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
              { step: '4', bg: 'bg-emerald-600', text: 'text-white', title: t('landing.step4Title'), desc: t('landing.step4Desc') },
            ].map(({ step, bg, text, title, desc }) => (
              <div key={step} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className={`w-8 h-8 rounded-lg ${bg} ${text} flex items-center justify-center font-bold text-xs`}>
                  {step}
                </div>
                <h3 className="font-bold text-navy text-sm">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Public Map Section ── */}
      <section id="peta" className="py-12 bg-slate-50 px-4 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-orange text-xs font-bold uppercase tracking-wider">{t('landing.mapSectionLabel')}</span>
              <h2 className="text-2xl font-bold text-navy mt-1">{t('landing.mapSectionTitle')}</h2>
              <p className="text-xs text-slate-500">{t('landing.mapSectionDesc')}</p>
            </div>
            <button
              onClick={() => handleQuickEnter('WARGA')}
              className="btn-orange text-xs font-semibold py-2 px-4 shadow-sm"
            >
              {t('landing.mapBtn')}
            </button>
          </div>

          <div className="h-[460px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm relative">
            <iframe
              title={t('landing.mapIframeTitle')}
              width="100%"
              height="100%"
              frameBorder="0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=112.65%2C-7.35%2C112.82%2C-7.20&layer=mapnik"
            />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy text-white py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <IconBuildingCommunity className="w-5 h-5 text-orange" />
            <span className="font-bold text-white">{t('common.appName')} Surabaya</span>
            <span className="text-slate-500">·</span>
            <span>{t('landing.footerWorkshop')}</span>
          </div>
          <p className="text-slate-400 text-center sm:text-right">{t('landing.footerColors')}</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
