import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  IconLoader2,
  IconEye,
  IconEyeOff,
  IconUser,
  IconShield,
  IconArrowLeft,
  IconFileText,
} from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Autentikasi berhasil. Selamat datang!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Autentikasi gagal';
      toast.error(msg);
    }
  };

  const handleDemo = async (role: 'warga' | 'petugas') => {
    const credentials = {
      warga: { email: 'demo@petasuarakota.id', password: 'password123' },
      petugas: { email: 'petugas.pu@petasuarakota.id', password: 'password123' },
    };
    const cred = credentials[role];
    try {
      await login(cred.email, cred.password);
      toast.success(`Masuk sebagai ${role}`);
      navigate('/');
    } catch {
      toast.error('Gagal login demo. Pastikan server aktif.');
    }
  };

  return (
    <div className="min-h-screen bg-board-bg board-pattern flex items-center justify-center p-4 font-body">
      <div className="w-full max-w-md relative">
        {/* Back Link */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/')}
            className="btn-paper-secondary text-xs font-mono inline-flex items-center gap-1.5"
          >
            <IconArrowLeft className="w-3.5 h-3.5" stroke={1.5} />
            <span>KEMBALI KE PETA SURABAYA</span>
          </button>
        </div>

        {/* Paper Document Card */}
        <div className="bg-paper-white border border-ink p-6 text-ink">
          {/* Header */}
          <div className="border-b border-ink/40 pb-4 mb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="font-wordmark font-bold text-2xl text-ink">
                Peta Suara Kota
              </span>
            </div>
            <p className="font-mono text-[10px] uppercase text-ink/70 tracking-wider">
              KOTAMADYA SURABAYA · BLANGKO AKSES ARSIP
            </p>
          </div>

          <h2 className="font-body font-bold text-base text-ink uppercase tracking-tight mb-4">
            MASUK KE AKUN TERDAFTAR
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="login-email">
                ALAMAT SUREL (EMAIL)
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@domain.id"
                className="input-paper text-xs"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="login-password">
                KATA SANDI (PASSWORD)
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-paper text-xs pr-9"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/60 hover:text-ink"
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" stroke={1.5} /> : <IconEye className="w-4 h-4" stroke={1.5} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-paper-primary w-full py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" stroke={1.5} />
                  <span>MEMVERIFIKASI...</span>
                </>
              ) : (
                'MASUK SEKARANG'
              )}
            </button>
          </form>

          {/* Quick demo login */}
          <div className="mt-5 pt-4 border-t border-ink/20">
            <p className="font-mono text-[10px] text-center text-ink/60 mb-2 uppercase">
              AKUN UJI COBA (DEMO)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('warga')}
                className="btn-paper-secondary text-xs font-mono flex items-center justify-center gap-1.5 py-1.5"
              >
                <IconUser className="w-3.5 h-3.5" stroke={1.5} />
                <span>WARGA</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemo('petugas')}
                className="btn-paper-secondary text-xs font-mono flex items-center justify-center gap-1.5 py-1.5"
              >
                <IconShield className="w-3.5 h-3.5" stroke={1.5} />
                <span>PETUGAS</span>
              </button>
            </div>
          </div>

          <p className="text-center font-body text-xs text-ink/70 mt-5">
            Belum terdaftar?{' '}
            <Link to="/register" className="font-bold underline text-ink hover:text-stamp-red">
              Daftar akun warga baru
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
