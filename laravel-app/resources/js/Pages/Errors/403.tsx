import React from 'react';
import { Link, router } from '@inertiajs/react';
import { IconShieldLock, IconArrowLeft, IconHome, IconLogout } from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';

interface Error403Props {
  status?: number;
  message?: string;
}

const Error403: React.FC<Error403Props> = ({ status = 403, message }) => {
  const { logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.visit('/login');
  };

  return (
    <div className="min-h-screen bg-[#FAF6EE] text-[#2B2822] font-sans flex flex-col justify-between p-4 sm:p-8">
      {/* Header bar */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between border-b border-[#E8D9B5] pb-4">
        <Link href="/" className="flex items-center gap-2 group">
          <img src="/patrol-logo.png" alt="PATROL" className="w-8 h-8 object-contain" />
          <span className="font-['Caveat'] text-2xl font-bold tracking-tight text-[#2B2822]">
            PATROL
          </span>
          <span className="text-[10px] font-['Courier_Prime'] uppercase tracking-widest text-[#7A7265] border border-[#E8D9B5] px-1.5 py-0.5 rounded">
            SURABAYA
          </span>
        </Link>
        <span className="font-['Courier_Prime'] text-xs text-[#B23327] font-bold">
          STATUS 403
        </span>
      </header>

      {/* Main card */}
      <main className="max-w-lg mx-auto w-full my-auto py-12">
        <div className="bg-white border-2 border-[#2B2822] p-8 shadow-[4px_4px_0px_#2B2822] relative">
          {/* Stamp header */}
          <div className="inline-block border-2 border-[#B23327] text-[#B23327] font-['Courier_Prime'] text-xs font-bold px-2 py-0.5 uppercase tracking-wider mb-4 -rotate-1">
            AKSES DITOLAK / FORBIDDEN
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-[#FAF6EE] border border-[#2B2822] flex items-center justify-center shrink-0">
              <IconShieldLock className="w-6 h-6 text-[#B23327]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2B2822] font-['Fraunces',serif] leading-tight mb-1">
                Hak Akses Tidak Mencukupi
              </h1>
              <p className="text-xs text-[#7A7265] font-['Courier_Prime']">
                DOKUMEN / HALAMAN TERBATAS
              </p>
            </div>
          </div>

          <p className="text-sm text-[#4A443A] leading-relaxed mb-6">
            {message || 'Akun Anda tidak memiliki kewenangan untuk mengakses halaman ini. Halaman ini dikhususkan untuk peran pengguna tertentu.'}
          </p>

          <div className="border-t border-[#E8D9B5] pt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-[#2B2822] hover:bg-[#403B33] text-white text-xs font-semibold px-4 py-2.5 transition-colors shadow-[2px_2px_0px_#7A7265]"
            >
              <IconHome className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FAF6EE] text-[#2B2822] border border-[#2B2822] text-xs font-semibold px-4 py-2.5 transition-colors shadow-[2px_2px_0px_#2B2822]"
            >
              <IconLogout className="w-4 h-4 text-[#B23327]" />
              <span>Ganti Akun Lain</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center border-t border-[#E8D9B5] pt-4">
        <p className="text-[11px] font-['Courier_Prime'] text-[#7A7265]">
          PATROL Surabaya - Sistem Keamanan Terpadu
        </p>
      </footer>
    </div>
  );
};

export default Error403;
