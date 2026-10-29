import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconLoader2,
  IconEye,
  IconEyeOff,
  IconUser,
  IconShield,
  IconCrown,
  IconArrowLeft,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageToggle from '@/Components/ui/LanguageToggle';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginAsRole, isLoading } = useAuthStore();
  const navigate = (url: string) => router.visit(url);
  const { t } = useTranslation();

  const redirectByRole = (role?: string) => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        window.location.href = redirect;
        return;
      }
    }
    if (role === 'PETUGAS') window.location.href = '/petugas';
    else if (role === 'SUPERADMIN' || role === 'ADMIN') window.location.href = '/superadmin';
    else window.location.href = '/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loggedUser = await login(email, password);
      toast.success(t('auth.welcomeToast', { name: loggedUser.name }));
      redirectByRole(loggedUser.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.authFailed');
      toast.error(msg);
    }
  };

  const handleDemo = async (role: 'WARGA' | 'PETUGAS' | 'SUPERADMIN') => {
    const demoCreds = {
      WARGA:      { email: 'demo@petasuarakota.id',        password: 'password123' },
      PETUGAS:    { email: 'petugas.pu@petasuarakota.id',  password: 'password123' },
      SUPERADMIN: { email: 'admin@petasuarakota.id',       password: 'password123' },
    };
    const cred = demoCreds[role];
    setEmail(cred.email);
    setPassword(cred.password);
    try {
      const loggedUser = await login(cred.email, cred.password);
      toast.success(t('auth.demoLogin', { role }));
      redirectByRole(loggedUser.role);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.authFailed');
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md relative">
        {/* Back + Language toggle row */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/')}
            className="btn-outline text-xs inline-flex items-center gap-1.5"
          >
            <IconArrowLeft className="w-3.5 h-3.5 text-navy" />
            <span>{t('common.backToHome')}</span>
          </button>
          <LanguageToggle />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center pb-5 mb-5 border-b border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center text-white mx-auto mb-2 shadow-sm">
              <IconBuildingCommunity className="w-6 h-6 text-orange" />
            </div>
            <h1 className="font-bold text-lg text-navy tracking-tight">
              {t('auth.loginTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="login-email">
                {t('auth.emailLabel')}
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="login-password">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  className="w-full p-2.5 pr-9 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                  title={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                >
                  {showPassword ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-navy w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin text-orange" />
                  <span>{t('auth.loggingIn')}</span>
                </>
              ) : t('auth.loginBtn')}
            </button>
          </form>

          {/* Quick Demo */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {t('auth.demoLabel')}
              </span>
              <span className="text-[10px] text-orange font-semibold">{t('auth.demoOneClick')}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemo('WARGA')}
                className="p-2 rounded-lg border border-slate-200 hover:border-navy bg-slate-50 hover:bg-slate-100 text-navy font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
              >
                <IconUser className="w-4 h-4 text-sky-600" />
                <span>{t('roles.WARGA')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('PETUGAS')}
                className="p-2 rounded-lg border border-slate-200 hover:border-navy bg-slate-50 hover:bg-slate-100 text-navy font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
              >
                <IconShield className="w-4 h-4 text-orange" />
                <span>{t('roles.PETUGAS')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemo('SUPERADMIN')}
                className="p-2 rounded-lg border border-slate-200 hover:border-navy bg-slate-50 hover:bg-slate-100 text-navy font-semibold text-[11px] flex flex-col items-center justify-center gap-1 transition-all"
              >
                <IconCrown className="w-4 h-4 text-purple-600" />
                <span>{t('roles.SUPERADMIN')}</span>
              </button>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-5">
            {t('auth.noAccount')}{' '}
            <Link href="/register" className="font-bold text-navy hover:text-orange underline">
              {t('auth.registerLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
