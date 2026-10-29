import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconLoader2,
  IconArrowLeft,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { useAuthStore } from '@/stores/authStore';
import toast from 'react-hot-toast';
import { useTranslation } from '@/i18n/useTranslation';
import LanguageToggle from '@/Components/ui/LanguageToggle';

const RegisterPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const { register, isLoading } = useAuthStore();
  const navigate = (url: string) => router.visit(url);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone || undefined });
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('auth.registerFailed');
      toast.error(msg);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

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

        {/* Register Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          {/* Header */}
          <div className="text-center pb-5 mb-5 border-b border-slate-100">
            <div className="w-16 h-16 mx-auto mb-2">
              <img src="/patrol-logo.png" alt="PATROL" className="w-full h-full object-contain" />
            </div>
            <h1 className="font-bold text-lg text-navy tracking-tight">
              {t('auth.registerTitle')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth.registerSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="reg-name">
                {t('auth.nameLabel')}
              </label>
              <input
                id="reg-name"
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder={t('auth.namePlaceholder')}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                required
                minLength={2}
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="reg-email">
                {t('auth.emailRegLabel')}
              </label>
              <input
                id="reg-email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder={t('auth.emailRegPlaceholder')}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="reg-phone">
                {t('auth.phoneLabel')}
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder={t('auth.phonePlaceholder')}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1.5" htmlFor="reg-password">
                {t('auth.passwordRegLabel')}
              </label>
              <input
                id="reg-password"
                type="password"
                value={form.password}
                onChange={set('password')}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-navy w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
            >
              {isLoading ? (
                <>
                  <IconLoader2 className="w-4 h-4 animate-spin text-orange" />
                  <span>{t('auth.registering')}</span>
                </>
              ) : t('auth.registerBtn')}
            </button>
          </form>

          <p className="text-center text-xs text-slate-500 mt-5">
            {t('auth.alreadyHaveAccount')}{' '}
            <Link href="/login" className="font-bold text-navy hover:text-orange underline">
              {t('auth.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
