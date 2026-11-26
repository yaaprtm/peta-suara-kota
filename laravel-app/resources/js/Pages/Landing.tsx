import React, { useState, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
  IconMapPin,
  IconShield,
  IconArrowRight,
  IconUser,
  IconTrophy,
  IconMenu2,
  IconX,
  IconSearch,
  IconLoader2,
  IconPlus,
  IconLogout,
  IconLayoutDashboard,
  IconShieldLock,
  IconDatabase,
  IconMicrophone,
  IconVideo,
  IconDroplet,
  IconCircleCheck,
  IconAlertTriangle,
  IconMap2,
} from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';
import { statsApi, reportsApi } from '@/lib/api';
import { OverviewStats, User } from '@/types';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageToggle from '@/Components/ui/LanguageToggle';
import PatrolLogo from '@/Components/ui/PatrolLogo';

// ─── KPI Skeleton ──────────────────────────────────────────────────────────────
const KpiSkeleton: React.FC = () => (
  <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs animate-pulse">
    <div className="h-3 w-24 bg-slate-200 rounded mb-2" />
    <div className="h-7 w-16 bg-slate-200 rounded mb-1" />
    <div className="h-2.5 w-20 bg-slate-100 rounded" />
  </div>
);

const LandingPage: React.FC = () => {
  const navigate = (url: string) => router.visit(url);
  const { props } = usePage<{ auth: { user: User | null } }>();
  const { user, logout } = useAuthStore();
  const currentUser = props.auth?.user || user;

  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // ─── Live stats from API ───────────────────────────────────────────────────
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchStats = () => {
    statsApi.overview()
      .then((data: any) => {
        if (data && typeof data.total === 'number') {
          setStats(data as OverviewStats);
        }
      })
      .catch(() => {
        // Keep stats null — fallback text shown
      })
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalReports = stats?.total ?? 0;
  const completedReports = stats?.selesai ?? 0;
  const resolutionPct = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;
  const criticalReports = stats?.highUrgency ?? 0;

  const handleLogout = async () => {
    try {
      await logout();
      router.post('/logout');
    } catch {
      router.visit('/');
    }
  };

  return (
    <div className="min-h-screen w-full shrink-0 bg-white text-slate-800 font-sans">
      {/* ── Top Navigation ── */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <PatrolLogo size={38} variant="navy" className="shrink-0" />
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

            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <IconUser className="w-3.5 h-3.5 text-slate-500" />
                  <span className="max-w-[120px] truncate">{currentUser.name}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-mono px-1.5 py-0.5 rounded uppercase">
                    {currentUser.role}
                  </span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-800 truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{currentUser.email}</p>
                    </div>

                    {currentUser.role === 'WARGA' && (
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <IconLayoutDashboard className="w-4 h-4 text-slate-400" />
                        <span>{t('landing.btnWarga') || 'Beranda Warga'}</span>
                      </Link>
                    )}

                    {currentUser.role === 'PETUGAS' && (
                      <Link
                        href="/petugas"
                        className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <IconShield className="w-4 h-4 text-slate-400" />
                        <span>{t('landing.btnPetugas') || 'Panel Petugas'}</span>
                      </Link>
                    )}

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN') && (
                      <>
                        <Link
                          href="/superadmin"
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <IconShieldLock className="w-4 h-4 text-slate-400" />
                          <span>{t('landing.btnSuperadmin') || 'Panel Admin'}</span>
                        </Link>
                        <Link
                          href="/superadmin/master"
                          className="flex items-center gap-2 px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium"
                        >
                          <IconDatabase className="w-4 h-4 text-slate-400" />
                          <span>Data Master</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 font-medium cursor-pointer"
                      >
                        <IconLogout className="w-4 h-4" />
                        <span>{t('common.logout') || 'Keluar'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

            {currentUser && (
              <div className="border-t border-slate-100 pt-2 space-y-1">
                <div className="px-2 py-1 text-slate-500 font-mono text-[10px] uppercase">
                  {currentUser.name} ({currentUser.role})
                </div>
                {currentUser.role === 'WARGA' && (
                  <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 px-2 text-navy font-semibold">
                    {t('landing.btnWarga') || 'Beranda Warga'}
                  </Link>
                )}
                {currentUser.role === 'PETUGAS' && (
                  <Link href="/petugas" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 px-2 text-navy font-semibold">
                    {t('landing.btnPetugas') || 'Panel Petugas'}
                  </Link>
                )}
                {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPERADMIN') && (
                  <>
                    <Link href="/superadmin" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 px-2 text-navy font-semibold">
                      {t('landing.btnSuperadmin') || 'Panel Admin'}
                    </Link>
                    <Link href="/superadmin/master" onClick={() => setIsMobileMenuOpen(false)} className="block py-1.5 px-2 text-slate-700">
                      Data Master
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left py-1.5 px-2 text-red-600 font-semibold cursor-pointer"
                >
                  {t('common.logout') || 'Keluar'}
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
              <LanguageToggle />
              {!currentUser && (
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
      <section className="relative overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-white pt-14 pb-12 md:pt-20 md:pb-16 px-4 border-b border-slate-100">
        {/* Subtle decorative background accents */}
        <div
          className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[360px] rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(245,165,36,0.22) 0%, rgba(30,58,95,0.08) 55%, transparent 75%)' }}
        />

        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-navy-50/90 border border-navy-100 text-navy text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span>{t('landing.heroBadge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-navy tracking-tight leading-[1.15]">
            {t('landing.heroTitle1')} <br className="hidden sm:inline" />
            <span className="text-orange">{t('landing.heroTitle2')}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t('landing.heroDesc')}
          </p>

          {/* Dua Aksi Publik Utama */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/peta"
              className="bg-navy hover:bg-navy-600 text-white font-semibold px-6 py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <IconMapPin className="w-4 h-4 text-orange" />
              <span>{t('landing.btnViewMap') || 'Jelajahi Peta Kota'}</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <button
              onClick={() => {
                if (currentUser) {
                  navigate('/peta?lapor=true');
                } else {
                  navigate('/lapor');
                }
              }}
              className="bg-orange hover:bg-orange-600 text-navy-900 font-bold px-6 py-3.5 rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 group cursor-pointer"
            >
              <IconPlus className="w-4 h-4" />
              <span>{t('landing.btnCreateReport') || 'Buat Laporan'}</span>
            </button>
          </div>

          {/* KPI Counters */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-left">
            {statsLoading ? (
              <>
                <KpiSkeleton />
                <KpiSkeleton />
                <KpiSkeleton />
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-orange block">{t('landing.kpiCoverage')}</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-navy mt-0.5 block">{t('landing.kpiCoverageSub1')}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{t('landing.kpiCoverageSub2')}</span>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-slate-500">{t('landing.kpiTotal')}</span>
                    <IconMap2 className="w-4 h-4 text-navy/60" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-navy">{totalReports}+</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{t('landing.kpiTotalSub')}</span>
                </div>

                <div className="p-4 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-emerald-700">{t('landing.kpiDone')}</span>
                    <IconCircleCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-700">{resolutionPct}%</span>
                  <span className="text-[11px] text-emerald-700/70 mt-0.5 block">{completedReports} {t('landing.kpiDoneUnit')}</span>
                </div>

                <div className="p-4 rounded-2xl border border-red-100 bg-red-50/30 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-red-600">{t('landing.kpiCritical')}</span>
                    <IconAlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-red-700">{criticalReports} {t('landing.kpiCasesUnit')}</span>
                  <span className="text-[11px] text-red-600/75 mt-0.5 block">{t('landing.kpiCriticalSub')}</span>
                </div>

                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-xs hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-orange">{t('landing.kpiCoverage')}</span>
                    <IconMapPin className="w-4 h-4 text-orange" />
                  </div>
                  <span className="text-xl sm:text-2xl font-extrabold text-navy">{t('landing.kpiCoverageSub1')}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">{t('landing.kpiCoverageSub2')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Tracking Code Search ── */}
      <section className="py-10 bg-white px-4 border-b border-slate-100">
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
            <div className="text-center mb-4">
              <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-orange mb-1">
                PELACAKAN TIKET REAL-TIME
              </span>
              <h3 className="text-base font-bold text-navy">
                {t('landing.trackTitle') || 'Cek Status Laporan Anda'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
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
                <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={trackingInput}
                  onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                  placeholder="PSK-SBY-XXXXXX"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-mono text-navy focus:outline-none focus:ring-2 focus:ring-orange/40 focus:border-orange placeholder:text-slate-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !trackingInput.trim()}
                className="btn-navy px-5 py-2.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shadow-xs"
              >
                {isSearching ? <IconLoader2 className="w-4 h-4 animate-spin" /> : <IconSearch className="w-4 h-4" />}
                <span className="hidden sm:inline">{t('landing.trackBtn') || 'Lacak'}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Key Features Section ── */}
      <section id="fitur" className="py-14 bg-slate-50/70 px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-orange text-xs font-bold uppercase tracking-widest">FITUR UNGGULAN</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mt-1">Satu Peta untuk Mengawal Kota Surabaya</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2">
              Menggabungkan partisipasi aktif warga dengan pemantauan kondisi lapangan kota secara terpadu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: <IconMicrophone className="w-5 h-5 text-orange" />,
                badge: 'AI Voice & Photo',
                title: 'Lapor Cepat Via Suara',
                desc: 'Rekam keluhan secara langsung tanpa perlu mengetik panjang, lengkapi foto bukti dan koordinat GPS akurat.',
              },
              {
                icon: <IconVideo className="w-5 h-5 text-emerald-600" />,
                badge: 'Surabaya 3D Map',
                title: 'Titik CCTV & Peta 3D',
                desc: 'Tinjau 40 titik pantauan persimpangan Surabaya dengan citra satelit 3D dan integrasi laporan warga terdekat.',
              },
              {
                icon: <IconDroplet className="w-5 h-5 text-sky-600" />,
                badge: 'Early Warning',
                title: 'Sensor Air & Rumah Pompa',
                desc: 'Pantau status ketinggian air dan kesiapan rumah pompa di wilayah rawan genangan Kota Surabaya.',
              },
              {
                icon: <IconTrophy className="w-5 h-5 text-amber-500" />,
                badge: 'Transparansi Publik',
                title: 'Leaderboard & Garis Waktu',
                desc: 'Lacak progres penanganan setiap tiket secara terbuka dan apresiasi kelurahan dengan warga paling peduli.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {item.badge}
                  </span>
                </div>
                <h3 className="font-bold text-navy text-sm">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Workflow Section ── */}
      <section id="alur" className="py-14 bg-white px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-orange text-xs font-bold uppercase tracking-widest">{t('landing.sectionProcessLabel')}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mt-1">{t('landing.sectionProcessTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5">{t('landing.sectionProcessDesc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', bg: 'bg-navy', text: 'text-white', title: t('landing.step1Title'), desc: t('landing.step1Desc') },
              { step: '02', bg: 'bg-orange', text: 'text-navy-900', title: t('landing.step2Title'), desc: t('landing.step2Desc') },
              { step: '03', bg: 'bg-navy', text: 'text-white', title: t('landing.step3Title'), desc: t('landing.step3Desc') },
              { step: '04', bg: 'bg-emerald-600', text: 'text-white', title: t('landing.step4Title'), desc: t('landing.step4Desc') },
            ].map(({ step, bg, text, title, desc }) => (
              <div key={step} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:shadow-sm transition-all space-y-2.5">
                <div className={`w-9 h-9 rounded-xl ${bg} ${text} flex items-center justify-center font-extrabold text-xs tracking-wider shadow-2xs`}>
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
      <section id="peta" className="py-14 bg-slate-50 px-4 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-orange text-xs font-bold uppercase tracking-widest">{t('landing.mapSectionLabel')}</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-navy mt-1">{t('landing.mapSectionTitle')}</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('landing.mapSectionDesc')}</p>
            </div>
            <Link
              href="/peta"
              className="btn-orange text-xs font-bold py-2.5 px-5 rounded-xl shadow-sm inline-flex items-center gap-2 hover:shadow-md transition-all"
            >
              <IconMapPin className="w-4 h-4" />
              <span>{t('landing.mapBtn')}</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-[440px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-md relative">
            <iframe
              title={t('landing.mapIframeTitle')}
              width="100%"
              height="100%"
              frameBorder="0"
              src="https://www.openstreetmap.org/export/embed.html?bbox=112.60%2C-7.36%2C112.85%2C-7.18&layer=mapnik"
            />
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2 text-[11px] font-semibold text-navy pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Wilayah Pantauan: Kota Surabaya (31 Kecamatan)</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-navy text-white py-10 px-4 mt-auto border-t border-navy-600">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-md">
              <div className="flex items-center gap-2.5">
                <img src="/patrol-logo.png" alt="PATROL" className="w-7 h-7 object-contain" />
                <div>
                  <span className="font-extrabold text-sm tracking-wide text-white block leading-none">PATROL SURABAYA</span>
                  <span className="text-[11px] text-orange font-medium">Peta Suara Kota Surabaya</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t('landing.footerWorkshop')} — Menghubungkan suara warga dengan tindakan cepat dan transparan untuk Surabaya yang lebih tanggap.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-300">
              <a href="#fitur" className="hover:text-orange transition-colors">Fitur</a>
              <a href="#alur" className="hover:text-orange transition-colors">Alur Kerja</a>
              <Link href="/peta" className="hover:text-orange transition-colors">Peta Interaktif</Link>
              <Link href="/leaderboard" className="hover:text-orange transition-colors">Leaderboard</Link>
            </div>
          </div>

          <div className="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>© 2026 PATROL Surabaya. All rights reserved.</p>
            <p className="font-medium text-slate-300">
              Made with care by <span className="text-orange font-bold tracking-wide">@arya</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
