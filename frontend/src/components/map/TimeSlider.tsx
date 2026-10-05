import React, { useCallback, useRef, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { IconCalendar, IconRotateClockwise, IconActivity } from '@tabler/icons-react';
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

// ─── TimeSlider (Physical Bulletin Time Range Controller) ───────────────────────

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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging.current) return;
      const pct = getPercent(e.clientX);
      const date = percentToDate(pct);
      if (dragging.current === 'start') {
        if (date < timeRange.end) setTimeRange(date, timeRange.end);
      } else {
        if (date > timeRange.start) setTimeRange(timeRange.start, date);
      }
    },
    [dragging, getPercent, timeRange, setTimeRange]
  );

  const handleMouseUp = useCallback(() => {
    dragging.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', (e) => {
      if (!dragging.current || !e.touches[0]) return;
      const pct = getPercent(e.touches[0].clientX);
      const date = percentToDate(pct);
      if (dragging.current === 'start' && date < timeRange.end) setTimeRange(date, timeRange.end);
      if (dragging.current === 'end' && date > timeRange.start) setTimeRange(timeRange.start, date);
    });
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp, getPercent, timeRange, setTimeRange]);

  return (
    <div className="bg-paper-white border border-ink p-3 text-ink">
      {/* Header Info */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <IconCalendar className="w-4 h-4 text-ink/70" />
          <span className="text-ink/80 text-xs font-sans font-medium">
            Rentang Waktu:&nbsp;
            <span className="text-ink font-mono font-bold text-xs bg-paper-kraft/40 px-2 py-0.5 border border-ink/40">
              {format(timeRange.start, 'dd MMM', { locale: localeId })} — {format(timeRange.end, 'dd MMM yyyy', { locale: localeId })}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-ink text-xs font-mono font-medium bg-paper-blue px-2 py-0.5 border border-ink">
            <IconActivity className="w-3.5 h-3.5" />
            <span>{filteredReports.length} Laporan</span>
          </div>
          <button
            type="button"
            onClick={reset}
            className="p-1 text-ink/60 hover:text-ink hover:bg-paper-kraft border border-ink/30 transition-colors"
            title="Reset ke 14 hari terakhir"
          >
            <IconRotateClockwise className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Physical Paper Track Slider */}
      <div
        ref={trackRef}
        className="relative h-2 bg-[#DED6C5] border border-ink cursor-pointer mt-3"
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
        {/* Active Range Highlight */}
        <div
          className="absolute top-0 h-full bg-paper-kraft border-x border-ink"
          style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
        />

        {/* Start Handle */}
        <div
          className="absolute top-1/2 w-3.5 h-5 -translate-y-1/2 -translate-x-1/2 bg-paper-white border border-ink flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
          style={{ left: `${startPct}%` }}
          onMouseDown={() => { dragging.current = 'start'; }}
          onTouchStart={() => { dragging.current = 'start'; }}
        >
          <div className="w-0.5 h-2.5 bg-ink" />
        </div>

        {/* End Handle */}
        <div
          className="absolute top-1/2 w-3.5 h-5 -translate-y-1/2 -translate-x-1/2 bg-paper-white border border-ink flex items-center justify-center cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
          style={{ left: `${endPct}%` }}
          onMouseDown={() => { dragging.current = 'end'; }}
          onTouchStart={() => { dragging.current = 'end'; }}
        >
          <div className="w-0.5 h-2.5 bg-ink" />
        </div>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-1.5 mt-3.5">
        {[
          { label: '7 Hari', days: 7 },
          { label: '14 Hari', days: 14 },
          { label: '30 Hari', days: 30 },
          { label: '90 Hari', days: 90 },
        ].map(({ label, days }) => (
          <button
            key={label}
            type="button"
            onClick={() => setTimeRange(subDays(new Date(), days), new Date())}
            className="px-2.5 py-0.5 text-xs font-sans border border-ink/40 bg-paper-white hover:bg-paper-kraft text-ink transition-colors"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlider;
