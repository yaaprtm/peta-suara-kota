import React from 'react';
import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Base Skeleton Component
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-gray-200';
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={clsx(
        baseClasses,
        animationClasses[animation],
        variantClasses[variant],
        className
      )}
      style={style}
    />
  );
};

/**
 * Skeleton for Report Card
 */
export const ReportCardSkeleton: React.FC = () => (
  <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-2">
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <Skeleton width={60} height={20} className="rounded-full" />
        <Skeleton width={80} height={20} className="rounded-full" />
      </div>
      <Skeleton width={60} height={20} className="rounded-full" />
    </div>
    <Skeleton width="80%" height={16} />
    <Skeleton width="100%" height={12} />
    <Skeleton width="60%" height={12} />
    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
      <Skeleton width={100} height={12} />
      <Skeleton width={80} height={24} className="rounded" />
    </div>
  </div>
);

/**
 * Skeleton for Stats Card (Landing Page KPI)
 */
export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
    <div className="flex items-center justify-between">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton width={60} height={24} className="rounded-full" />
    </div>
    <Skeleton width="60%" height={20} />
    <Skeleton width={100} height={32} />
  </div>
);

/**
 * Skeleton for Map Loading
 */
export const MapSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={clsx('relative bg-gray-100', className)}>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block">
          <svg
            className="animate-spin h-12 w-12 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
        <p className="text-sm text-gray-500 font-medium">Loading map...</p>
      </div>
    </div>
    {/* Fake map grid */}
    <div className="absolute inset-0 opacity-10">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {Array.from({ length: 64 }).map((_, i) => (
          <div key={i} className="border border-gray-300" />
        ))}
      </div>
    </div>
  </div>
);

/**
 * Skeleton for Table Row
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 4 }) => (
  <tr className="border-b border-gray-100">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton height={16} width={i === 0 ? '80%' : '60%'} />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton for User Avatar + Name
 */
export const UserSkeleton: React.FC = () => (
  <div className="flex items-center gap-3">
    <Skeleton variant="circular" width={40} height={40} />
    <div className="space-y-2">
      <Skeleton width={120} height={14} />
      <Skeleton width={80} height={12} />
    </div>
  </div>
);

/**
 * Skeleton List (Multiple Cards)
 */
export const SkeletonList: React.FC<{ count?: number; type?: 'card' | 'row' }> = ({
  count = 3,
  type = 'card',
}) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i}>{type === 'card' ? <ReportCardSkeleton /> : <TableRowSkeleton />}</div>
    ))}
  </div>
);

/**
 * Full Page Loading Skeleton
 */
export const PageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gray-50 p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton width={200} height={32} />
        <Skeleton width={120} height={40} className="rounded-lg" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <SkeletonList count={5} />
        </div>
        <div>
          <Skeleton height={400} className="rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// CSS for shimmer animation (add to global CSS or inline)
export const SkeletonStyles = `
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
`;
