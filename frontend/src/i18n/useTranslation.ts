// ─── useTranslation: Lightweight i18n hook ───────────────────────────────────
// Reads current language from langStore and returns a `t()` function that
// resolves dot-path keys and performs {{placeholder}} interpolation.

import { useLangStore } from '../stores/langStore';
import idTranslations from './id';
import enTranslations from './en';

type Translations = typeof idTranslations;

// Nested key lookup helper: "auth.loginTitle" → translations.auth.loginTitle
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return typeof current === 'string' ? current : undefined;
}

// Replace {{key}} placeholders with provided values
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useTranslation() {
  const { lang } = useLangStore();
  const translations = lang === 'EN' ? enTranslations : idTranslations;

  /**
   * Translate a dot-path key with optional interpolation.
   * Example: t('auth.loginTitle') → "Peta Suara Kota Surabaya"
   * Example: t('auth.welcomeToast', { name: 'Budi' }) → "Selamat datang, Budi!"
   */
  const t = (key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations as Record<string, any>, key);
    if (value === undefined) {
      // Fallback: return the last segment of the key so missing keys are visible
      return key.split('.').pop() ?? key;
    }
    return interpolate(value, params);
  };

  return { t, lang };
}

// ─── Standalone getter (for non-component contexts like toast callbacks) ──────

export function getT(lang: 'ID' | 'EN') {
  const translations = lang === 'EN' ? enTranslations : idTranslations;
  return (key: string, params?: Record<string, string | number>): string => {
    const value = getNestedValue(translations as Record<string, any>, key);
    if (value === undefined) return key.split('.').pop() ?? key;
    return interpolate(value, params);
  };
}
