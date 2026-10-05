import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IconLoader2, IconArrowLeft } from '@tabler/icons-react';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Kata sandi minimal 6 karakter');
      return;
    }
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined });
      toast.success('Pendaftaran akun berhasil!');
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pendaftaran gagal';
      toast.error(msg);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

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
              KOTAMADYA SURABAYA · PENDAFTARAN WARGA PELAPOR
            </p>
          </div>

          <h2 className="font-body font-bold text-base text-ink uppercase tracking-tight mb-4">
            REGISTRASI AKUN WARGA BARU
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="reg-name">
                NAMA LENGKAP WARGA
              </label>
              <input
                id="reg-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Nama sesuai identitas..."
                className="input-paper text-xs"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="reg-email">
                ALAMAT SUREL (EMAIL)
              </label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="nama@domain.id"
                className="input-paper text-xs"
                required
              />
            </div>

            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="reg-phone">
                NOMOR TELEPON / WA (OPSIONAL)
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="08xxxxxxxxxx"
                className="input-paper text-xs"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1" htmlFor="reg-password">
                KATA SANDI (MINIMAL 6 KARAKTER)
              </label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                className="input-paper text-xs"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-paper-primary w-full py-2.5 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin" stroke={1.5} />
                  <span>MENDAFTARKAN IDENTITAS...</span>
                </>
              ) : (
                'DAFTAR SEBAGAI PELAPOR'
              )}
            </button>
          </form>

          <p className="text-center font-body text-xs text-ink/70 mt-5">
            Sudah memiliki akun terdaftar?{' '}
            <Link to="/login" className="font-bold underline text-ink hover:text-stamp-red">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
