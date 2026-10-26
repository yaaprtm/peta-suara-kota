import React, { useState } from 'react';
import {
  IconAdjustments,
  IconX,
  IconAlertTriangle,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react';
import { useReportsStore } from '../../stores/reportsStore';
import { ReportCategory, ReportStatus, CATEGORY_LABELS, CATEGORY_COLORS, STATUS_LABELS_SURABAYA } from '../../types';
import { CategoryGlyph, StatusShape } from '../ui/SurabayaIllustrations';
import { KECAMATAN_SURABAYA } from '../../lib/kecamatan';
import { useTranslation } from '../../i18n/useTranslation';
import clsx from 'clsx';

const CATEGORIES = Object.values(ReportCategory) as ReportCategory[];
const VISIBLE_STATUSES: ReportStatus[] = ['BARU', 'DIPROSES', 'SELESAI'];

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60 shrink-0 select-none">
    {children}
  </span>
);

const MapFilterBar: React.FC = () => {
  const { filter, setFilter } = useReportsStore();
  const { t, lang } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasFilter = !!(
    filter.category ||
    (filter.categories && filter.categories.length > 0) ||
    filter.status ||
    filter.kecamatan ||
    filter.onlyCritical ||
    filter.minScore !== undefined
  );

  const clearFilters = () => {
    setFilter({
      category: undefined,
      categories: undefined,
      status: undefined,
      kecamatan: undefined,
      onlyCritical: undefined,
      minScore: undefined,
      maxScore: undefined,
    });
  };

  const toggleCategory = (cat: ReportCategory) => {
    const current = filter.categories || (filter.category ? [filter.category] : []);
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    setFilter({ categories: next.length > 0 ? next : undefined, category: undefined });
  };

  const isCategoryActive = (cat: ReportCategory) => {
    if (filter.categories && filter.categories.length > 0) return filter.categories.includes(cat);
    return filter.category === cat;
  };

  // Status label: use translated status labels
  const getStatusLabel = (status: ReportStatus) => {
    const key = `statusSurabaya.${status}` as const;
    return t(key as any);
  };

  // Category label: use translated category labels
  const getCatLabel = (cat: ReportCategory) => {
    return t(`category.${cat}` as any);
  };

  const filterContent = (
    <>
      {/* District dropdown */}
      <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border-paper">
        <IconMapPin className="w-3 h-3 text-ink/60" stroke={1.5} />
        <select
          value={filter.kecamatan || ''}
          onChange={(e) => setFilter({ kecamatan: e.target.value || undefined })}
          className="text-[11px] font-sans px-1.5 py-0.5 outline-none cursor-pointer border border-border-paper focus:border-ink bg-paper-white text-ink"
          style={{ borderRadius: '2px' }}
          title={t('filter.districtTitle')}
        >
          <option value="">{t('filter.allDistricts')}</option>
          {KECAMATAN_SURABAYA.map((kec) => (
            <option key={kec} value={kec}>{t('filter.districtPrefix')} {kec}</option>
          ))}
        </select>
      </div>

      {/* Category chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        <SectionLabel>{t('filter.categoryLabel')}</SectionLabel>
        <div className="flex items-center gap-1">
          {CATEGORIES.map((cat) => {
            const active = isCategoryActive(cat);
            const catColor = CATEGORY_COLORS[cat];
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={clsx(
                  'flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-sans border transition-colors shrink-0',
                  active
                    ? 'border-ink font-medium bg-paper-kraft'
                    : 'border-border-paper text-ink/70 hover:border-ink/50 hover:text-ink bg-paper-white'
                )}
                style={{
                  borderRadius: '2px',
                  borderLeftWidth: '2px',
                  borderLeftColor: active ? catColor : 'transparent',
                }}
              >
                <CategoryGlyph category={cat} strokeColor={active ? catColor : 'currentColor'} size={12} className="w-3 h-3" />
                <span className="hidden lg:inline">{getCatLabel(cat)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-border-paper shrink-0" />

      {/* Status segmented control */}
      <div className="flex items-center gap-1.5 shrink-0">
        <SectionLabel>{t('filter.statusLabel')}</SectionLabel>
        <div className="flex items-center border border-border-paper bg-paper-white" style={{ borderRadius: '2px' }}>
          {VISIBLE_STATUSES.map((status, idx) => {
            const active = filter.status === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter({ status: active ? undefined : status })}
                className={clsx(
                  'flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans transition-colors',
                  idx > 0 && 'border-l border-border-paper',
                  active
                    ? 'bg-ink text-paper-white font-medium'
                    : 'text-ink/70 hover:bg-paper-kraft hover:text-ink'
                )}
              >
                <StatusShape status={status} size={10} className={active ? 'text-paper-white' : 'text-ink/60'} />
                <span className="hidden md:inline">{getStatusLabel(status)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-border-paper shrink-0" />

      {/* Critical-only toggle */}
      <button
        type="button"
        onClick={() => {
          if (filter.onlyCritical) setFilter({ onlyCritical: undefined, minScore: undefined });
          else setFilter({ onlyCritical: true, minScore: 80 });
        }}
        className={clsx(
          'flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans border transition-colors shrink-0',
          filter.onlyCritical
            ? 'border-severity-critical bg-severity-critical/10 text-severity-critical font-semibold'
            : 'border-border-paper text-ink/70 hover:border-ink/40 hover:text-ink bg-paper-white'
        )}
        style={{ borderRadius: '2px' }}
      >
        <IconAlertTriangle className="w-3 h-3 shrink-0" stroke={1.5} />
        <span className="hidden sm:inline">{t('filter.onlyCritical')}</span>
      </button>

      {/* Reset */}
      {hasFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-sans border border-border-paper hover:border-ink text-ink/70 hover:text-ink transition-colors shrink-0 ml-auto"
          style={{ borderRadius: '2px', background: 'var(--paper-white)' }}
          title={t('filter.resetTitle')}
        >
          <IconX className="w-3 h-3" stroke={2} />
          <span className="hidden sm:inline">{t('filter.reset')}</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop inline bar */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 overflow-x-auto whitespace-nowrap"
        style={{ background: 'var(--paper-white)' }}
      >
        {filterContent}
      </div>

      {/* Mobile collapsed drawer */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left font-sans text-[11px] text-ink/80"
          style={{ background: 'var(--paper-white)' }}
        >
          <IconAdjustments className="w-3.5 h-3.5" stroke={1.5} />
          <span className="font-medium">{t('filter.filterToggle')}</span>
          {hasFilter && <span className="w-1.5 h-1.5 rounded-full bg-severity-critical shrink-0" />}
          <IconCheck className={clsx('w-3 h-3 ml-auto transition-transform', drawerOpen && 'rotate-180')} stroke={1.5} />
        </button>
        {drawerOpen && (
          <div
            className="flex flex-wrap items-center gap-2 px-3 py-2 border-t border-border-paper"
            style={{ background: 'var(--paper-white)' }}
          >
            {filterContent}
          </div>
        )}
      </div>
    </>
  );
};

export default MapFilterBar;
