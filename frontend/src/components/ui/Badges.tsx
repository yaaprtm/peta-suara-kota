import React from 'react';
import { clsx } from 'clsx';
import {
  getUrgencyLevel,
  URGENCY_LABELS,
  STATUS_LABELS_SURABAYA,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from '../../types';
import type { Report, UrgencyLevel, ReportCategory, ReportStatus } from '../../types';
import {
  CategoryGlyph,
  StatusShape,
  IllustrationTuguPahlawanUmbrella,
} from './SurabayaIllustrations';

// ─── UrgencyBadge: Modern Status Indicator ───────────────────────────────────

interface UrgencyBadgeProps {
  score: number;
  showScore?: boolean;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ score, showScore = true, className }) => {
  const level = getUrgencyLevel(score);

  const config = {
    kritis: { bg: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-600 animate-pulse' },
    tinggi: { bg: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
    sedang: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
    rendah: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  }[level];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-sans font-medium rounded-full border shadow-2xs',
        config.bg,
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
      <span>{URGENCY_LABELS[level]}</span>
      {showScore && (
        <span className="font-mono text-[10px] opacity-75 border-l border-current/25 pl-1 ml-0.5">
          {score}
        </span>
      )}
    </span>
  );
};

// ─── StatusBadge: Modern Badges ──────────────────────────────────────────────

interface StatusBadgeProps {
  status: ReportStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const label = STATUS_LABELS_SURABAYA[status] || status;

  const styleMap: Record<ReportStatus, string> = {
    BARU: 'bg-sky-50 text-sky-800 border-sky-200',
    DIPROSES: 'bg-amber-50 text-amber-800 border-amber-200',
    SELESAI: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    DITOLAK: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-sans font-medium border rounded-full',
        styleMap[status] || 'bg-slate-50 text-slate-700 border-slate-200',
        className
      )}
    >
      <StatusShape status={status} size={11} />
      <span>{label}</span>
    </span>
  );
};

// ─── CategoryBadge: Clean Badge with Category Accent ─────────────────────────

interface CategoryBadgeProps {
  category: ReportCategory;
  className?: string;
}

export const getCategoryIcon = (category: ReportCategory, className = 'w-3.5 h-3.5') => {
  const catColor = CATEGORY_COLORS[category] || '#1E3A5F';
  return <CategoryGlyph category={category} strokeColor={catColor} className={className} />;
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  const catColor = CATEGORY_COLORS[category] || '#1E3A5F';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-sans font-medium text-navy bg-navy-50/70 border border-navy-100 rounded-md',
        className
      )}
    >
      <CategoryGlyph category={category} strokeColor={catColor} size={13} />
      <span>{CATEGORY_LABELS[category]}</span>
    </span>
  );
};

// ─── Official Verification Stamp ──────────────────────────────────────────────

interface OfficialStampProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export const OfficialVerificationStamp: React.FC<OfficialStampProps> = ({
  label = 'TERCATAT',
  sublabel = 'KOTA SURABAYA',
  className,
}) => {
  return (
    <div
      className={clsx(
        'inline-flex flex-col items-center justify-center select-none border border-ink/40 px-2 py-0.5 rounded-[2px] bg-paper-kraft/40 text-ink',
        className
      )}
    >
      <span className="text-[9px] font-sans font-bold tracking-wider uppercase leading-tight">{label}</span>
      <span className="text-[7.5px] font-mono tracking-widest text-ink-dim uppercase">{sublabel}</span>
    </div>
  );
};

// ─── LoadingSpinner: Newspaper Ink Spinner ────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  return (
    <div className={clsx(sizes[size], 'relative flex items-center justify-center', className)}>
      <div className="absolute inset-0 rounded-full border border-border-paper" />
      <div className="absolute inset-0 rounded-full border-2 border-ink border-t-transparent animate-spin" />
    </div>
  );
};

// ─── EmptyState: Surabaya Civic Editorial Empty State ─────────────────────────

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  illustration?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Aman, Rek. Belum ada laporan di sini.',
  description,
  action,
  illustration,
}) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-paper-white border border-border-paper rounded-[2px]">
    <div className="mb-3 flex items-center justify-center">
      {illustration || <IllustrationTuguPahlawanUmbrella className="w-28 h-28" />}
    </div>
    <h3 className="font-serif font-bold text-ink text-sm mb-1">{title}</h3>
    {description && <p className="text-ink-dim text-xs font-sans max-w-xs mb-3">{description}</p>}
    {action}
  </div>
);

// ─── Avatar: Clean Newspaper ID ───────────────────────────────────────────────

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {
  const sizes = { sm: 'w-5 h-5 text-[9px]', md: 'w-7 h-7 text-xs', lg: 'w-9 h-9 text-sm' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(sizes[size], 'object-cover border border-border-paper rounded-[2px]')}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizes[size],
        'flex items-center justify-center font-mono font-bold text-ink bg-paper-kraft border border-border-paper rounded-[2px]'
      )}
    >
      {initials}
    </div>
  );
};

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

export const SkeletonCard: React.FC = () => (
  <div className="p-3 border border-border-paper bg-paper-white space-y-2 rounded-[2px] animate-pulse">
    <div className="h-3 bg-border-paper/40 w-3/4 rounded-[2px]" />
    <div className="h-2 bg-border-paper/25 w-1/2 rounded-[2px]" />
    <div className="flex gap-2 pt-1">
      <div className="h-3 w-12 bg-border-paper/30 rounded-[2px]" />
      <div className="h-3 w-14 bg-border-paper/30 rounded-[2px]" />
    </div>
  </div>
);
