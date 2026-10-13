import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  IconBuildingCommunity,
  IconMicrophone,
  IconMapPin,
  IconShield,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconUser,
  IconCrown,
  IconSparkles,
  IconFlame,
  IconSearch,
  IconChevronRight,
  IconTrophy,
} from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import { useReportsStore } from '../../stores/reportsStore';
import { UrgencyBadge, StatusBadge, CategoryBadge } from '../../components/ui/Badges';
import toast from 'react-hot-toast';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginAsRole } = useAuthStore();
  const { reports } = useReportsStore();

  const totalReports = reports.length;
  const completedReports = reports.filter(r => r.status === 'SELESAI').length;
  const criticalReports = reports.filter(r => r.skorUrgensi >= 80).length;

  const handleQuickEnter = (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => {
    loginAsRole(role);
    toast.success(`Masuk sebagai ${role}`);
    if (role === 'WARGA') navigate('/dashboard');
    else if (role === 'PETUGAS') navigate('/petugas');
    else if (role === 'SUPERADMIN') navigate('/superadmin');
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center text-white shadow-sm">
              <IconBuildingCommunity className="w-5 h-5 text-orange" />
            </div>
            <div>
              <span className="font-bold text-navy text-base tracking-tight leading-none block">
                Peta Suara Kota
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-0.5">
                KOTAMADYA SURABAYA
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-navy transition-colors">Fitur Unggulan</a>
            <a href="#alur" className="hover:text-navy transition-colors">Alur Pelaporan</a>
            <a href="#peta" className="hover:text-navy transition-colors">Peta Publik</a>
            <Link to="/leaderboard" className="hover:text-navy transition-colors flex items-center gap-1">
              <IconTrophy className="w-3.5 h-3.5 text-orange" />
              <span>Leaderboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (user.role === 'PETUGAS') navigate('/petugas');
                    else if (user.role === 'SUPERADMIN' || user.role === 'ADMIN') navigate('/superadmin');
                    else navigate('/dashboard');
                  }}
                  className="btn-navy py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <span>Buka Dashboard ({user.role})</span>
                  <IconArrowRight className="w-3.5 h-3.5 text-orange" />
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn-outline py-1.5 px-3 text-xs"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="btn-navy py-1.5 px-3.5 text-xs"
                >
                  Daftar Warga
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-slate-50 via-white to-white py-12 md:py-16 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-50 border border-navy-100 text-navy text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span>Platform Aspirasi & Command Center Pelaporan Kota Surabaya</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy tracking-tight leading-tight">
            Suarakan Keluhan Kotamu, <br />
            <span className="text-orange">Ditangani Cepat & Transparan.</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Laporkan jalan berlubang, genangan banjir, tumpukan sampah, dan lampu penerangan mati hanya dengan suara atau foto. Terhubung langsung dengan aparatur dan dinas terkait.
          </p>

          {/* Quick Role Portal Buttons (Diagram Alignment) */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleQuickEnter('WARGA')}
              className="bg-navy hover:bg-navy-600 text-white font-semibold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group cursor-pointer"
            >
              <IconUser className="w-4 h-4 text-orange" />
              <span>Masuk Beranda Warga (/dashboard)</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickEnter('PETUGAS')}
              className="bg-orange hover:bg-orange-600 text-navy-900 font-bold px-5 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-md flex items-center gap-2 group cursor-pointer"
            >
              <IconShield className="w-4 h-4" />
              <span>Command Center Petugas (/petugas)</span>
              <IconArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => handleQuickEnter('SUPERADMIN')}
              className="bg-slate-100 hover:bg-slate-200 text-navy font-semibold px-4 py-3 rounded-xl text-xs sm:text-sm border border-slate-300 transition-all flex items-center gap-2 cursor-pointer"
            >
              <IconCrown className="w-4 h-4 text-purple-700" />
              <span>Panel Superadmin (/superadmin)</span>
            </button>
          </div>

          {/* KPI Counters */}
          <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-400 block">TOTAL LAPORAN KOTA</span>
              <span className="text-xl sm:text-2xl font-bold text-navy">{totalReports}+</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Di seluruh Surabaya</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-emerald-600 block">TELAH BERES</span>
              <span className="text-xl sm:text-2xl font-bold text-emerald-700">{completedReports} Selesai</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Penanganan tuntas</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-red-600 block">RESPON CEPAT KRITIS</span>
              <span className="text-xl sm:text-2xl font-bold text-red-700">{criticalReports} Kasus</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Target &lt; 2 Jam</span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[11px] font-semibold text-orange block">CAKUPAN WILAYAH</span>
              <span className="text-xl sm:text-2xl font-bold text-navy">31 Kecamatan</span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">154 Kelurahan</span>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow Section (Alur Pelaporan) */}
      <section id="alur" className="py-12 bg-white px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-orange text-xs font-bold uppercase tracking-wider">PROSES TRANSPARAN</span>
            <h2 className="text-2xl font-bold text-navy mt-1">Bagaimana Peta Suara Kota Bekerja?</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Dari laporan masuk hingga petugas selesai bertindak di lapangan
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-navy text-sm">Warga Melapor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Kirim rekaman suara atau ketik keluhan, sertakan foto bukti dan tentukan titik lokasi pada peta.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-orange text-navy-900 flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-navy text-sm">Skor Urgensi Otomatis</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sistem menilai tingkat kegentingan (Kritis, Tinggi, Sedang, Rendah) agar masalah darurat diprioritaskan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-navy text-white flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-navy text-sm">Tindakan Petugas</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Petugas menerima di Command Center, mengubah status ke <i>Diproses</i>, dan mengisi catatan tindakan lapangan.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-bold text-navy text-sm">Masalah Beres</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Status diperbarui menjadi <i>Selesai</i>. Warga dan publik dapat melihat riwayat garis waktu secara transparan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Public Interactive Map Section */}
      <section id="peta" className="py-12 bg-slate-50 px-4 border-b border-slate-200">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-orange text-xs font-bold uppercase tracking-wider">EKSPLORASI TERBUKA</span>
              <h2 className="text-2xl font-bold text-navy mt-1">Peta Publik Suara Kota Surabaya</h2>
              <p className="text-xs text-slate-500">
                Pantau titik sebaran pengaduan yang aktif dilaporkan oleh warga
              </p>
            </div>

            <button
              onClick={() => handleQuickEnter('WARGA')}
              className="btn-orange text-xs font-semibold py-2 px-4 shadow-sm"
            >
              Lapor Sekarang di Peta
            </button>
          </div>

          <div className="h-[460px] rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm relative">
            <iframe
              title="Peta Eksplorasi Publik"
              width="100%"
              height="100%"
              frameBorder="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=112.65%2C-7.35%2C112.82%2C-7.20&layer=mapnik`}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <IconBuildingCommunity className="w-5 h-5 text-orange" />
            <span className="font-bold text-white">Peta Suara Kota Surabaya</span>
            <span className="text-slate-500">·</span>
            <span>Workshop Rekayasa Perangkat Lunak</span>
          </div>

          <p className="text-slate-400 text-center sm:text-right">
            Warna Tema: Navy (#1E3A5F) · Orange (#F5A524) · Base Putih (#FFFFFF)
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
