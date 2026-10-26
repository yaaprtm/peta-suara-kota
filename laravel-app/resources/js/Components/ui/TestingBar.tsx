import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import {
  IconTestPipe,
  IconUser,
  IconShield,
  IconCrown,
  IconChecklist,
  IconRotate,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconExternalLink,
  IconInfoCircle,
  IconCheck,
} from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import { useReportsStore } from '../../stores/reportsStore';
import toast from 'react-hot-toast';
import { useTranslation } from '../../i18n/useTranslation';
import { LanguageToggleDark } from './LanguageToggle';

export const TestingBar: React.FC = () => {
  const navigate = (url: string) => router.visit(url);
  const { user, loginAsRole, logout } = useAuthStore();
  const { resetReports } = useReportsStore();
  const { t } = useTranslation();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [checkedTests, setCheckedTests] = useState<Record<string, boolean>>({
    warga_view: true,
  });

  const toggleCheck = (key: string) => {
    setCheckedTests(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRoleSwitch = (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => {
    loginAsRole(role);
    toast.success(t('testing.toastSwitch', { role }));
    if (role === 'WARGA') navigate('/dashboard');
    else if (role === 'PETUGAS') navigate('/petugas');
    else if (role === 'SUPERADMIN') navigate('/superadmin');
  };

  const handleResetData = () => {
    if (window.confirm(t('testing.resetConfirm'))) {
      resetReports();
      toast.success(t('testing.toastReset'));
    }
  };

  return (
    <>
      {/* Testing Top Floater */}
      <aside 
        aria-label="Panel Uji Coba Pengembang"
        className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-3 sm:bottom-3 z-50 transition-all duration-200 shadow-xl sm:max-w-xl"
      >
        <div className="bg-navy text-white rounded-lg border border-navy-700 shadow-elevated overflow-hidden text-xs">
          {/* Header Row */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-navy-800 border-b border-navy-700/60 select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
              <span className="font-semibold text-[11px] tracking-wide text-white uppercase flex items-center gap-1">
                <IconTestPipe className="w-3.5 h-3.5 text-orange" />
                {t('testing.modeLabel')}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-navy-700 text-slate-300 font-mono">
                {t('testing.roleLabel', { role: user?.role || t('testing.noRole') })}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="px-2 py-0.5 rounded bg-orange hover:bg-orange-600 text-navy-900 font-semibold text-[11px] transition-colors flex items-center gap-1"
                title="Testing Guide"
              >
                <IconChecklist className="w-3 h-3" />
                {t('testing.guideBtn')}
              </button>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 hover:bg-navy-700 rounded text-slate-300"
                title={isCollapsed ? t('testing.expandTitle') : t('testing.collapseTitle')}
              >
                {isCollapsed ? <IconChevronUp className="w-3.5 h-3.5" /> : <IconChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Body content when expanded */}
          {!isCollapsed && (
            <div className="p-2.5 bg-navy/95 backdrop-blur flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-300 font-medium">{t('testing.quickRoleLabel')}</span>

              <button
                type="button"
                onClick={() => handleRoleSwitch('WARGA')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  user?.role === 'WARGA' ? 'bg-orange text-navy-900 font-bold shadow' : 'bg-navy-700 hover:bg-navy-600 text-white'
                }`}
              >
                <IconUser className="w-3 h-3" />
                {t('testing.wargaBtn')}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('PETUGAS')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  user?.role === 'PETUGAS' ? 'bg-orange text-navy-900 font-bold shadow' : 'bg-navy-700 hover:bg-navy-600 text-white'
                }`}
              >
                <IconShield className="w-3 h-3" />
                {t('testing.petugasBtn')}
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('SUPERADMIN')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                  user?.role === 'SUPERADMIN' || user?.role === 'ADMIN' ? 'bg-orange text-navy-900 font-bold shadow' : 'bg-navy-700 hover:bg-navy-600 text-white'
                }`}
              >
                <IconCrown className="w-3 h-3" />
                {t('testing.superadminBtn')}
              </button>

              <div className="h-4 w-px bg-navy-700 mx-1 hidden sm:block" />

              <LanguageToggleDark />

              <button
                type="button"
                onClick={handleResetData}
                className="px-2 py-1 rounded bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white text-[10px] transition-colors flex items-center gap-1"
                title={t('testing.resetDataTitle')}
              >
                <IconRotate className="w-3 h-3 text-orange" />
                {t('testing.resetData')}
              </button>

              {user && (
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    toast(t('testing.toastLogout'), { icon: '👋' });
                    navigate('/login');
                  }}
                  className="px-2 py-1 rounded bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[10px] transition-colors ml-auto"
                >
                  {t('testing.logoutBtn')}
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Guide Checklist Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-navy px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange/20 border border-orange/40 flex items-center justify-center text-orange">
                  <IconChecklist className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-white">{t('testing.guideTitle')}</h3>
                  <p className="text-[11px] text-slate-300">{t('testing.guideSubtitle')}</p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="text-slate-400 hover:text-white p-1 rounded transition-colors">
                <IconX className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4 text-slate-700 text-xs">
              <div className="bg-navy-50/60 p-3 rounded-lg border border-navy-100 flex items-start gap-2.5">
                <IconInfoCircle className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <p className="text-[11px] text-navy-800 leading-relaxed">
                  Web telah direbuild sesuai struktur diagram: <b>Warga (/dashboard)</b>, <b>Petugas (/petugas)</b>, <b>Superadmin (/superadmin & /superadmin/master)</b>, serta <b>Detail Laporan (/laporan/:id)</b>.
                  Gunakan tombol uji cepat di bawah atau checklist ini untuk menguji tiap modul!
                </p>
              </div>

              {/* Skenario Warga */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-navy flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    1. Pengujian Role: WARGA (/dashboard)
                  </span>
                  <button
                    onClick={() => { handleRoleSwitch('WARGA'); setShowGuideModal(false); }}
                    className="text-[11px] text-orange hover:text-orange-600 font-semibold flex items-center gap-0.5"
                  >
                    Buka Halaman <IconExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5 pl-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.warga_view}
                      onChange={() => toggleCheck('warga_view')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Lihat Beranda Warga: Peta sebaran laporan kota Surabaya dan statistik pengaduan saya.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.warga_create}
                      onChange={() => toggleCheck('warga_create')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Coba tombol <b>"Buat Laporan Baru"</b>: isi form (judul, suara/teks, foto, kategori, pin koordinat) dan submit.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.warga_my_reports}
                      onChange={() => toggleCheck('warga_my_reports')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Buka tab <b>"Laporan Saya"</b> dan klik salah satu laporan untuk melihat Detail Laporan.</span>
                  </label>
                </div>
              </div>

              {/* Skenario Petugas */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-navy flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-orange" />
                    2. Pengujian Role: PETUGAS (/petugas)
                  </span>
                  <button
                    onClick={() => { handleRoleSwitch('PETUGAS'); setShowGuideModal(false); }}
                    className="text-[11px] text-orange hover:text-orange-600 font-semibold flex items-center gap-0.5"
                  >
                    Buka Halaman <IconExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5 pl-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.petugas_urgent}
                      onChange={() => toggleCheck('petugas_urgent')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Periksa <b>Antrean Laporan</b>: Laporan Urgent/Kritis (skor &gt; 80) tampil otomatis di urutan paling atas.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.petugas_filter}
                      onChange={() => toggleCheck('petugas_filter')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Coba filter kategori (Infrastruktur, Banjir, Kebersihan) dan level urgensi.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.petugas_action}
                      onChange={() => toggleCheck('petugas_action')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span><b>Ubah Status & Tulis Catatan Tindakan</b>: Ubah status ke <i>Diproses</i> atau <i>Selesai</i> dan beri catatan (contoh: "Tim DKRTH meluncur").</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.petugas_rekap}
                      onChange={() => toggleCheck('petugas_rekap')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Buka tombol <b>"Rekap Laporan Harian"</b> untuk melihat ringkasan metrik penanganan hari ini.</span>
                  </label>
                </div>
              </div>

              {/* Skenario Superadmin */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-navy flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    3. Pengujian Role: SUPERADMIN (/superadmin & /superadmin/master)
                  </span>
                  <button
                    onClick={() => { handleRoleSwitch('SUPERADMIN'); setShowGuideModal(false); }}
                    className="text-[11px] text-orange hover:text-orange-600 font-semibold flex items-center gap-0.5"
                  >
                    Buka Halaman <IconExternalLink className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1.5 pl-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.admin_stats}
                      onChange={() => toggleCheck('admin_stats')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Lihat <b>Statistik Seluruh Kota</b>: Grafik persentase penyelesaian, sebaran per kecamatan & kategori.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.admin_users}
                      onChange={() => toggleCheck('admin_users')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span><b>Kelola Akun</b>: Ubah role pengguna (Warga &harr; Petugas &harr; Superadmin) dan toggle status aktif.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.admin_master}
                      onChange={() => toggleCheck('admin_master')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Buka <b>Kelola Master Data (/superadmin/master)</b>: Coba edit atau tambah Kategori Laporan dan Level Laporan.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.admin_logs}
                      onChange={() => toggleCheck('admin_logs')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Periksa <b>Log Aktivitas</b>: Audit trail riwayat tindakan status dan aktivitas sistem.</span>
                  </label>
                </div>
              </div>

              {/* Skenario Detail Laporan */}
              <div className="border border-slate-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-navy flex items-center gap-1.5 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    4. Pengujian: Detail Laporan (/laporan/:id)
                  </span>
                </div>
                <div className="space-y-1.5 pl-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.detail_timeline}
                      onChange={() => toggleCheck('detail_timeline')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Periksa <b>Garis Waktu Status</b> (Belum/Baru &rarr; Diproses &rarr; Selesai) beserta jejak catatan tindakan petugas.</span>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!checkedTests.detail_action}
                      onChange={() => toggleCheck('detail_action')}
                      className="mt-0.5 rounded text-navy focus:ring-navy"
                    />
                    <span>Jika login sebagai Petugas/Admin: coba ubah status dan isi catatan tindakan langsung di halaman detail!</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">{t('testing.footerNote')}</span>
              <button onClick={() => setShowGuideModal(false)} className="btn-navy py-1.5 px-4 text-xs">
                {t('testing.closeGuide')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
