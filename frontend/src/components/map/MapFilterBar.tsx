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
import clsx from 'clsx';

const CATEGORIES = Object.values(ReportCategory) as ReportCategory[];
const VISIBLE_STATUSES: ReportStatus[] = ['BARU', 'DIPROSES', 'SELESAI'];

// ─── Section Label ────────────────────────────────────────────────────────────

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/50 shrink-0 select-none">
    {children}
  </span>
);

// ─── MapFilterBar ─────────────────────────────────────────────────────────────

const MapFilterBar: React.FC = () => {
  const { filter, setFilter } = useReportsStore();
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
    setFilter({
      categories: next.length > 0 ? next : undefined,
      category: undefined,
    });
  };

  const isCategoryActive = (cat: ReportCategory) => {
    if (filter.categories && filter.categories.length > 0) return filter.categories.includes(cat);
    return filter.category === cat;
  };

  // ─── Filter Content (shared between inline bar and mobile drawer) ─────────

  const filterContent = (
    <>
      {/* District dropdown */}
      <div className="flex items-center gap-1.5 shrink-0 pr-3 border-r border-border-paper">
        <IconMapPin className="w-3 h-3 text-ink/50" stroke={1.5} />
        <select
          value={filter.kecamatan || ''}
          onChange={(e) => setFilter({ kecamatan: e.target.value || undefined })}
          className="text-[11px] font-sans px-1.5 py-0.5 outline-none cursor-pointer border border-border-paper focus:border-ink bg-paper-white text-ink"
          style={{ borderRadius: '2px' }}
          title="Filter per Kecamatan Surabaya"
        >
          <option value="">Semua Kecamatan</option>
          {KECAMATAN_SURABAYA.map((kec) => (
            <option key={kec} value={kec}>Kec. {kec}</option>
          ))}
        </select>
      </div>

      {/* ─── KATEGORI: multi-select chips ─── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <SectionLabel>Kategori</SectionLabel>
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
                    : 'border-border-paper text-ink/65 hover:border-ink/50 hover:text-ink bg-paper-white'
                )}
                style={{
                  borderRadius: '2px',
                  borderLeftWidth: '2px',
                  borderLeftColor: active ? catColor : 'transparent',
                }}
              >
                <CategoryGlyph category={cat} strokeColor={active ? catColor : 'currentColor'} size={12} className="w-3 h-3" />
                <span className="hidden lg:inline">{CATEGORY_LABELS[cat]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-border-paper shrink-0" />

      {/* ─── STATUS: segmented control ─── */}
      <div className="flex items-center gap-1.5 shrink-0">
        <SectionLabel>Status</SectionLabel>
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
                    : 'text-ink/65 hover:bg-paper-kraft hover:text-ink'
                )}
              >
                <StatusShape status={status} size={10} className={active ? 'text-paper-white' : 'text-ink/50'} />
                <span className="hidden md:inline">{STATUS_LABELS_SURABAYA[status]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="w-px h-4 bg-border-paper shrink-0" />

      {/* ─── PRIORITAS: single toggle ─── */}
      <button
        type="button"
        onClick={() => {
          if (filter.onlyCritical) {
            setFilter({ onlyCritical: undefined, minScore: undefined });
          } else {
            setFilter({ onlyCritical: true, minScore: 80 });
          }
        }}
        className={clsx(
          'flex items-center gap-1 px-2 py-0.5 text-[10px] font-sans border transition-colors shrink-0',
          filter.onlyCritical
            ? 'border-severity-critical bg-severity-critical/10 text-severity-critical font-semibold'
            : 'border-border-paper text-ink/60 hover:border-ink/40 hover:text-ink bg-paper-white'
        )}
        style={{ borderRadius: '2px' }}
      >
        <IconAlertTriangle className="w-3 h-3 shrink-0" stroke={1.5} />
        <span className="hidden sm:inline">Hanya kritis</span>
      </button>

      {/* Reset */}
      {hasFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-sans border border-border-paper hover:border-ink text-ink/60 hover:text-ink transition-colors shrink-0 ml-auto"
          style={{ borderRadius: '2px', background: 'var(--paper-white)' }}
        >
          <IconX className="w-3 h-3" stroke={2} />
          <span className="hidden sm:inline">Reset</span>
        </button>
      )}
    </>
  );

  return (
    <>
      {/* Desktop / tablet: inline horizontal bar */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 overflow-x-auto whitespace-nowrap"
        style={{ background: 'var(--paper-white)' }}
      >
        {filterContent}
      </div>

      {/* Mobile: collapsed toggle + slide drawer */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 w-full text-left font-sans text-[11px] text-ink/70"
          style={{ background: 'var(--paper-white)' }}
        >
          <IconAdjustments className="w-3.5 h-3.5" stroke={1.5} />
          <span className="font-medium">Filter</span>
          {hasFilter && (
            <span className="w-1.5 h-1.5 rounded-full bg-severity-critical shrink-0" />
          )}
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
