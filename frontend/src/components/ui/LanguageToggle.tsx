// ─── LanguageToggle: EN / ID switcher button ─────────────────────────────────

import React from 'react';
import { useLangStore } from '../../stores/langStore';
import clsx from 'clsx';

interface LanguageToggleProps {
  /** Visual variant: 'pill' for a two-segment pill, 'text' for a minimal text button */
  variant?: 'pill' | 'text';
  /** Extra Tailwind classes */
  className?: string;
}

const LanguageToggle: React.FC<LanguageToggleProps> = ({
  variant = 'pill',
  className,
}) => {
  const { lang, setLang } = useLangStore();

  if (variant === 'text') {
    return (
      <button
        type="button"
        onClick={() => setLang(lang === 'ID' ? 'EN' : 'ID')}
        className={clsx(
          'text-[11px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border transition-all select-none',
          'border-slate-300 text-slate-600 hover:border-navy hover:text-navy bg-white',
          className
        )}
        title={lang === 'ID' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
        aria-label={lang === 'ID' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
      >
        {lang === 'ID' ? 'EN' : 'ID'}
      </button>
    );
  }

  // Pill variant: two segments side by side
  return (
    <div
      className={clsx(
        'inline-flex items-center border border-slate-300 rounded-md overflow-hidden text-[11px] font-bold tracking-wider select-none',
        className
      )}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang('ID')}
        className={clsx(
          'px-2.5 py-1 transition-colors',
          lang === 'ID'
            ? 'bg-navy text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-navy'
        )}
        aria-pressed={lang === 'ID'}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={clsx(
          'px-2.5 py-1 border-l border-slate-300 transition-colors',
          lang === 'EN'
            ? 'bg-navy text-white'
            : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-navy'
        )}
        aria-pressed={lang === 'EN'}
        title="English"
      >
        EN
      </button>
    </div>
  );
};

// Dark variant for use on navy backgrounds (MapPage, PetugasPage headers)
export const LanguageToggleDark: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useLangStore();
  return (
    <div
      className={clsx(
        'inline-flex items-center border border-navy-600 rounded-md overflow-hidden text-[11px] font-bold tracking-wider select-none',
        className
      )}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang('ID')}
        className={clsx(
          'px-2.5 py-1 transition-colors',
          lang === 'ID'
            ? 'bg-orange text-navy font-black'
            : 'bg-navy-700 text-slate-300 hover:bg-navy-600 hover:text-white'
        )}
        aria-pressed={lang === 'ID'}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={clsx(
          'px-2.5 py-1 border-l border-navy-600 transition-colors',
          lang === 'EN'
            ? 'bg-orange text-navy font-black'
            : 'bg-navy-700 text-slate-300 hover:bg-navy-600 hover:text-white'
        )}
        aria-pressed={lang === 'EN'}
        title="English"
      >
        EN
      </button>
    </div>
  );
};

// Paper/ink variant for use on the MapPage's newspaper-style header
export const LanguageTogglePaper: React.FC<{ className?: string }> = ({ className }) => {
  const { lang, setLang } = useLangStore();
  return (
    <div
      className={clsx(
        'inline-flex items-center border border-ink/40 overflow-hidden text-[10px] font-mono font-bold tracking-wider select-none',
        className
      )}
      style={{ borderRadius: '2px' }}
      role="group"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang('ID')}
        className={clsx(
          'px-2 py-0.5 transition-colors',
          lang === 'ID'
            ? 'bg-ink text-paper-white'
            : 'bg-paper-white text-ink/60 hover:bg-paper-kraft hover:text-ink'
        )}
        aria-pressed={lang === 'ID'}
        title="Bahasa Indonesia"
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => setLang('EN')}
        className={clsx(
          'px-2 py-0.5 border-l border-ink/40 transition-colors',
          lang === 'EN'
            ? 'bg-ink text-paper-white'
            : 'bg-paper-white text-ink/60 hover:bg-paper-kraft hover:text-ink'
        )}
        aria-pressed={lang === 'EN'}
        title="English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageToggle;
