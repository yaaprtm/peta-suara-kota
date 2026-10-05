import React from 'react';
import {
  IconAdjustments,
  IconX,
  IconShield,
  IconTool,
  IconTrash,
  IconDroplet,
  IconDots,
  IconAlertTriangle,
  IconMapPin,
  IconCheck,
} from '@tabler/icons-react';
import { useReportsStore } from '../../stores/reportsStore';
import { ReportCategory, ReportStatus, CATEGORY_LABELS, STATUS_LABELS } from '../../types';
import clsx from 'clsx';

const CATEGORIES = Object.values(ReportCategory) as ReportCategory[];
const STATUSES = Object.values(ReportStatus) as ReportStatus[];

const KECAMATAN_SURABAYA = [
  'Genteng', 'Tegalsari', 'Gubeng', 'Rungkut', 'Wonokromo',
  'Tambaksari', 'Sawahan', 'Sukolilo',
];

// Ikon sesuai makna — BUKAN asal pilih secara visual
const CATEGORY_ICON_MAP: Record<ReportCategory, React.ReactNode> = {
  INFRASTRUKTUR: <IconTool className="w-3.5 h-3.5 shrink-0" stroke={1.5} />,
  KEBERSIHAN:    <IconTrash className="w-3.5 h-3.5 shrink-0" stroke={1.5} />,
  KEAMANAN:      <IconShield className="w-3.5 h-3.5 shrink-0" stroke={1.5} />,
  BANJIR:        <IconDroplet className="w-3.5 h-3.5 shrink-0" stroke={1.5} />,
  LAINNYA:       <IconDots className="w-3.5 h-3.5 shrink-0" stroke={1.5} />,
};

// ─── Komponen chip tunggal yang seragam untuk SEMUA filter ────────────────────
// Dipakai untuk kategori, status, maupun urgency — tidak ada perlakuan khusus.

interface FilterChipProps {
  isActive: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  label: string;
  showCheckbox?: boolean;
}

const FilterChip: React.FC<FilterChipProps> = ({ isActive, onClick, icon, label, showCheckbox = true }) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      'px-2 py-0.5 text-[11px] font-body border shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer select-none',
      isActive
        ? 'border-ink font-medium'
        : 'border-ink/30 text-ink/75 hover:border-ink/60 hover:text-ink'
    )}
    style={{
      background: isActive ? 'var(--paper-kraft)' : 'var(--paper-white)',
      color: 'var(--ink)',
    }}
  >
    {showCheckbox && (
      <span
        className="w-3.5 h-3.5 border border-current flex items-center justify-center rounded-[2px] shrink-0 transition-colors"
        style={{
          background: isActive ? 'var(--ink)' : 'transparent',
        }}
      >
        {isActive && (
          <IconCheck
            className="w-3 h-3"
            stroke={2.5}
            style={{ color: 'var(--paper-white)' }}
          />
        )}
      </span>
    )}
    {icon && <span className="shrink-0 text-ink/70">{icon}</span>}
    <span>{label}</span>
  </button>
);

// ─── MapFilterBar ─────────────────────────────────────────────────────────────
// Satu-satunya tempat filter — tidak ada duplikat di sidebar.

const MapFilterBar: React.FC = () => {
  const { filter, setFilter } = useReportsStore();
  const hasFilter = !!(filter.category || filter.status || filter.kecamatan || filter.minScore !== undefined);

  const clearFilters = () => {
    setFilter({ category: undefined, status: undefined, kecamatan: undefined, minScore: undefined, maxScore: undefined });
  };

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 overflow-x-auto whitespace-nowrap"
      style={{ background: 'var(--paper-white)' }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 text-ink text-xs font-mono font-bold uppercase tracking-wider shrink-0 border-r border-ink/30 pr-3 mr-1">
        <IconAdjustments className="w-3.5 h-3.5" stroke={1.5} />
        <span>Filter</span>
      </div>

      {/* Kecamatan dropdown — satu-satunya elemen non-chip */}
      <div className="flex items-center gap-1.5 shrink-0 border-r border-ink/20 pr-3 mr-1">
        <IconMapPin className="w-3 h-3 text-ink/60" stroke={1.5} />
        <select
          value={filter.kecamatan || ''}
          onChange={(e) => setFilter({ kecamatan: e.target.value || undefined })}
          className="text-xs font-mono px-2 py-0.5 outline-none cursor-pointer border border-ink/40 focus:border-ink"
          style={{ background: 'var(--paper-white)', color: 'var(--ink)' }}
          title="Filter per Kecamatan Surabaya"
        >
          <option value="">Semua Kecamatan</option>
          {KECAMATAN_SURABAYA.map((kec) => (
            <option key={kec} value={kec}>Kec. {kec}</option>
          ))}
        </select>
      </div>

      {/* ─── Kategori chips ─── */}
      <div className="flex items-center gap-1 shrink-0">
        {CATEGORIES.map((cat) => (
          <FilterChip
            key={cat}
            isActive={filter.category === cat}
            onClick={() => setFilter({ category: filter.category === cat ? undefined : cat })}
            icon={CATEGORY_ICON_MAP[cat]}
            label={CATEGORY_LABELS[cat]}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-ink/20 shrink-0" />

      {/* ─── Status chips ─── */}
      <div className="flex items-center gap-1 shrink-0">
        {STATUSES.filter((s) => s !== 'DITOLAK').map((status) => (
          <FilterChip
            key={status}
            isActive={filter.status === status}
            onClick={() => setFilter({ status: filter.status === status ? undefined : status })}
            label={STATUS_LABELS[status]}
            showCheckbox={false}
          />
        ))}
      </div>

      <div className="w-px h-4 bg-ink/20 shrink-0" />

      {/* ─── Urgency chip — sama persis dengan chip lain, tidak ada border khusus ─── */}
      <FilterChip
        isActive={filter.minScore === 70}
        onClick={() => setFilter({ minScore: filter.minScore === 70 ? undefined : 70, maxScore: undefined })}
        icon={<IconAlertTriangle className="w-3.5 h-3.5" stroke={1.5} />}
        label="Kritis & Tinggi"
      />

      {/* Reset — hanya muncul kalau ada filter aktif */}
      {hasFilter && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-body border border-ink/40 hover:border-ink text-ink/70 hover:text-ink transition-colors shrink-0 ml-1"
          style={{ background: 'var(--paper-white)' }}
        >
          <IconX className="w-3 h-3" stroke={2} />
          Reset
        </button>
      )}
    </div>
  );
};

export default MapFilterBar;
