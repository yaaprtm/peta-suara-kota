import React, { useCallback, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { IconRotateClockwise } from '@tabler/icons-react';
import { useReportsStore } from '../../stores/reportsStore';

const MIN_DATE = subDays(new Date(), 90);
const MAX_DATE = new Date();
const RANGE_MS = MAX_DATE.getTime() - MIN_DATE.getTime();

function dateToPercent(date: Date): number {
  return ((date.getTime() - MIN_DATE.getTime()) / RANGE_MS) * 100;
}

function percentToDate(pct: number): Date {
  return new Date(MIN_DATE.getTime() + (pct / 100) * RANGE_MS);
}

const PRESETS = [
  { label: '7 hari', days: 7 },
  { label: '14 hari', days: 14 },
  { label: '30 hari', days: 30 },
  { label: '90 hari', days: 90 },
];

// ─── TimeSlider: One Slim Bar ──────────────────────────────────────────────────

const TimeSlider: React.FC = () => {
  const { timeRange, setTimeRange, filteredReports } = useReportsStore();
  const startPct = dateToPercent(timeRange.start);
  const endPct = dateToPercent(timeRange.end);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<'start' | 'end' | null>(null);

  const reset = useCallback(() => {
    setTimeRange(subDays(new Date(), 14), new Date());
  }, [setTimeRange]);

  const getPercent = useCallback((clientX: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const handlePointerMove = useCallback(
    (clientX: number) => {
      if (!dragging.current) return;
      const pct = getPercent(clientX);
      const date = percentToDate(pct);
      if (dragging.current === 'start') {
        if (date < timeRange.end) setTimeRange(date, timeRange.end);
      } else {
        if (date > timeRange.start) setTimeRange(timeRange.start, date);
      }
    },
    [getPercent, timeRange, setTimeRange]
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handlePointerMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Determine which preset is currently active (if any)
  const activePresetDays = PRESETS.find(({ days }) => {
    const presetStart = subDays(new Date(), days);
    return (
      Math.abs(timeRange.start.getTime() - presetStart.getTime()) < 1000 * 60 * 60 &&
      Math.abs(timeRange.end.getTime() - MAX_DATE.getTime()) < 1000 * 60 * 60
    );
  })?.days;

  return (
    <div className="flex items-center gap-2 sm:gap-3 py-1.5 px-1 select-none">
      {/* Quick-preset chips */}
      <div className="flex items-center gap-1 shrink-0">
        {PRESETS.map(({ label, days }) => (
          <button
            key={days}
            type="button"
            onClick={() => setTimeRange(subDays(new Date(), days), new Date())}
            className={`px-2 py-0.5 text-[10px] font-sans border transition-colors ${
              activePresetDays === days
                ? 'border-ink bg-ink text-paper-white font-semibold'
                : 'border-border-paper bg-paper-white text-ink/70 hover:border-ink hover:text-ink'
            }`}
            style={{ borderRadius: '2px' }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Compact range slider */}
      <div className="flex-1 min-w-[80px] relative">
        <div
          ref={trackRef}
          className="relative h-[6px] bg-border-paper/60 border border-border-paper cursor-pointer"
          style={{ borderRadius: '2px' }}
          onClick={(e) => {
            const pct = getPercent(e.clientX);
            const date = percentToDate(pct);
            const distStart = Math.abs(pct - startPct);
            const distEnd = Math.abs(pct - endPct);
            if (distStart < distEnd) {
              if (date < timeRange.end) setTimeRange(date, timeRange.end);
            } else {
              if (date > timeRange.start) setTimeRange(timeRange.start, date);
            }
          }}
        >
          {/* Active range fill */}
          <div
            className="absolute top-0 h-full bg-ink/25"
            style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
          />

          {/* Start handle */}
          <div
            className="absolute top-1/2 w-2.5 h-4 -translate-y-1/2 -translate-x-1/2 bg-paper-white border border-ink cursor-grab active:cursor-grabbing hover:bg-paper-kraft transition-colors"
            style={{ left: `${startPct}%`, borderRadius: '2px' }}
            onMouseDown={() => { dragging.current = 'start'; }}
            onTouchStart={() => { dragging.current = 'start'; }}
          />

          {/* End handle */}
          <div
            className="absolute top-1/2 w-2.5 h-4 -translate-y-1/2 -translate-x-1/2 bg-paper-white border border-ink cursor-grab active:cursor-grabbing hover:bg-paper-kraft transition-colors"
            style={{ left: `${endPct}%`, borderRadius: '2px' }}
            onMouseDown={() => { dragging.current = 'end'; }}
            onTouchStart={() => { dragging.current = 'end'; }}
          />
        </div>
      </div>

      {/* Date range label (monospace) */}
      <span className="font-mono text-[10px] text-ink/70 whitespace-nowrap shrink-0 hidden sm:inline">
        {format(timeRange.start, 'dd MMM', { locale: localeId })} — {format(timeRange.end, 'dd MMM', { locale: localeId })}
      </span>

      {/* Report count */}
      <span className="font-mono text-[10px] font-semibold text-ink bg-paper-kraft/60 border border-border-paper px-1.5 py-0.5 shrink-0" style={{ borderRadius: '2px' }}>
        {filteredReports.length}
      </span>

      {/* Reset */}
      <button
        type="button"
        onClick={reset}
        className="p-1 text-ink/50 hover:text-ink hover:bg-paper-kraft border border-border-paper transition-colors shrink-0"
        style={{ borderRadius: '2px' }}
        title="Reset ke 14 hari terakhir"
      >
        <IconRotateClockwise className="w-3 h-3" />
      </button>
    </div>
  );
};

export default TimeSlider;
