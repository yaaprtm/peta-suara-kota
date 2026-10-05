import React from 'react';
import { clsx } from 'clsx';
import {
  IconTool,
  IconTrash,
  IconShield,
  IconDroplet,
  IconDots,
  IconClock,
  IconCheck,
  IconX,
  IconFileText,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { getUrgencyLevel, URGENCY_LABELS, STATUS_LABELS, CATEGORY_LABELS } from '../../types';
import type { Report, UrgencyLevel, ReportCategory } from '../../types';

// ─── UrgencyBadge (Solid Circular Dot with Text Label) ────────────────────────

interface UrgencyBadgeProps {
  score: number;
  showScore?: boolean;
  className?: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ score, showScore = true, className }) => {
  const level = getUrgencyLevel(score);

  const styleMap: Record<UrgencyLevel, { bg: string; dot: string; text: string; border: string }> = {
    kritis: {
      bg: 'bg-[#B23327]/10',
      border: 'border-[#B23327]',
      text: 'text-[#B23327]',
      dot: 'bg-[#B23327]',
    },
    tinggi: {
      bg: 'bg-[#C9972F]/10',
      border: 'border-[#C9972F]',
      text: 'text-[#8A6414]',
      dot: 'bg-[#C9972F]',
    },
    sedang: {
      bg: 'bg-[#C9972F]/10',
      border: 'border-[#C9972F]',
      text: 'text-[#8A6414]',
      dot: 'bg-[#C9972F]',
    },
    rendah: {
      bg: 'bg-[#4A7A6E]/10',
      border: 'border-[#4A7A6E]',
      text: 'text-[#2D5249]',
      dot: 'bg-[#4A7A6E]',
    },
  };

  const current = styleMap[level];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-sans font-medium border bg-paper-white',
        current.border,
        current.text,
        className
      )}
    >
      {/* Lingkaran kecil solid warna sesuai level */}
      <span className={clsx('w-2 h-2 rounded-full shrink-0', current.dot)} />
      <span>{URGENCY_LABELS[level]}</span>
      {showScore && (
        <span className="font-mono text-[11px] opacity-75 border-l border-current/30 pl-1">
          {score}
        </span>
      )}
    </span>
  );
};

// ─── StatusBadge (Document Paper Badge) ────────────────────────────────────────

interface StatusBadgeProps {
  status: Report['status'];
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const statusConfig: Record<
    Report['status'],
    { border: string; bg: string; text: string; icon: React.ReactNode }
  > = {
    BARU: {
      border: 'border-ink',
      bg: 'bg-paper-kraft',
      text: 'text-ink',
      icon: <IconFileText className="w-3.5 h-3.5 stroke-[1.5]" />,
    },
    DIPROSES: {
      border: 'border-[#C9972F]',
      bg: 'bg-[#C9972F]/15',
      text: 'text-[#7D5B11]',
      icon: <IconClock className="w-3.5 h-3.5 stroke-[1.5]" />,
    },
    SELESAI: {
      border: 'border-[#4A7A6E]',
      bg: 'bg-[#4A7A6E]/15',
      text: 'text-[#2D5249]',
      icon: <IconCheck className="w-3.5 h-3.5 stroke-[2]" />,
    },
    DITOLAK: {
      border: 'border-stamp-red',
      bg: 'bg-stamp-red/10',
      text: 'text-stamp-red',
      icon: <IconX className="w-3.5 h-3.5 stroke-[2]" />,
    },
  };

  const conf = statusConfig[status];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-sans font-medium border',
        conf.border,
        conf.bg,
        conf.text,
        className
      )}
    >
      {conf.icon}
      <span>{STATUS_LABELS[status]}</span>
    </span>
  );
};

// ─── Official Verification Stamp (Lingkaran ganda untuk status verifikasi) ────

interface OfficialStampProps {
  label?: string;
  sublabel?: string;
  className?: string;
}

export const OfficialVerificationStamp: React.FC<OfficialStampProps> = ({
  label = 'TERVERIFIKASI',
  sublabel = 'PEMKOT SBY',
  className,
}) => {
  return (
    <div
      className={clsx(
        'official-stamp inline-flex flex-col items-center justify-center select-none rotate-[-4deg] scale-90 sm:scale-100',
        className
      )}
    >
      <span className="text-[10px] leading-tight font-bold tracking-wider">{label}</span>
      <span className="text-[8px] tracking-widest text-stamp-red/80">{sublabel}</span>
    </div>
  );
};

// ─── CategoryBadge (Paper Category Tag) ───────────────────────────────────────

interface CategoryBadgeProps {
  category: Report['category'];
  className?: string;
}

// Ikon sesuai makna: tool=infrastruktur, trash=kebersihan, shield=keamanan, droplet=banjir, dots=lainnya
export const getCategoryIcon = (category: ReportCategory, className = 'w-3.5 h-3.5') => {
  switch (category) {
    case 'INFRASTRUKTUR':
      return <IconTool className={className} stroke={1.5} />;
    case 'KEBERSIHAN':
      return <IconTrash className={className} stroke={1.5} />;
    case 'KEAMANAN':
      return <IconShield className={className} stroke={1.5} />;
    case 'BANJIR':
      return <IconDroplet className={className} stroke={1.5} />;
    default:
      return <IconDots className={className} stroke={1.5} />;
  }
};

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, className }) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-sans font-medium border border-ink bg-paper-white text-ink',
        className
      )}
    >
      {getCategoryIcon(category, 'w-3 h-3 text-ink/70')}
      <span>{CATEGORY_LABELS[category]}</span>
    </span>
  );
};

// ─── LoadingSpinner (Clean Paper Spinner) ─────────────────────────────────────

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const sizes = { sm: 'w-4 h-4', md: 'w-7 h-7', lg: 'w-10 h-10' };
  return (
    <div className={clsx(sizes[size], 'relative flex items-center justify-center', className)}>
      <div className="absolute inset-0 rounded-full border border-paper-kraft/40" />
      <div className="absolute inset-0 rounded-full border-2 border-paper-kraft border-t-transparent animate-spin" />
    </div>
  );
};

// ─── EmptyState (Paper Document Blank) ─────────────────────────────────────────

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-8 px-4 text-center border border-ink/40 bg-paper-white">
    <div className="w-10 h-10 mb-2.5 flex items-center justify-center border border-ink text-ink bg-paper-kraft">
      <IconFileText className="w-5 h-5 stroke-[1.5]" />
    </div>
    <h3 className="font-sans font-semibold text-ink text-sm mb-1">{title}</h3>
    {description && <p className="text-ink/70 text-xs font-sans max-w-xs mb-3">{description}</p>}
    {action}
  </div>
);

// ─── Avatar (Paper ID Tag) ───────────────────────────────────────────────────

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Avatar: React.FC<AvatarProps> = ({ name, src, size = 'md' }) => {
  const sizes = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-10 h-10 text-sm' };
  const initials = name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx(sizes[size], 'object-cover border border-ink rounded-none')}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizes[size],
        'flex items-center justify-center font-mono font-bold text-ink bg-paper-kraft border border-ink'
      )}
    >
      {initials}
    </div>
  );
};

// ─── SkeletonCard (Paper Card Skeleton) ────────────────────────────────────────

export const SkeletonCard: React.FC = () => (
  <div className="p-3 border border-ink/30 bg-paper-white/70 space-y-2.5 animate-pulse">
    <div className="h-3.5 bg-ink/15 w-3/4" />
    <div className="h-2.5 bg-ink/10 w-1/2" />
    <div className="flex gap-2 pt-1">
      <div className="h-4 w-14 bg-ink/10" />
      <div className="h-4 w-16 bg-ink/10" />
    </div>
  </div>
);


