import { create } from 'zustand';
import { Report, MapFilter } from '../types';
import { reportsApi } from '../lib/api';
import { subDays, isAfter, isBefore, parseISO } from 'date-fns';
import { DUMMY_REPORTS } from '../data/dummyReports';

interface ReportsState {
  reports: Report[];
  filteredReports: Report[];
  selectedReport: Report | null;
  isLoading: boolean;
  error: string | null;
  filter: MapFilter;
  timeRange: { start: Date; end: Date };
  isPanelOpen: boolean;
  currentBbox: string | null;
  currentZoom: number;

  fetchReports: () => Promise<void>;
  fetchViewportReports: (bbox: string, zoom: number) => Promise<void>;
  setSelectedReport: (report: Report | null) => void;
  setFilter: (filter: Partial<MapFilter>) => void;
  setTimeRange: (start: Date, end: Date) => void;
  addReport: (report: Report) => void;
  updateReportStatus: (reportId: string, status: Report['status']) => void;
  openPanel: () => void;
  closePanel: () => void;
}

function applyFilters(reports: Report[], filter: MapFilter, timeRange: { start: Date; end: Date }): Report[] {
  return reports.filter(r => {
    const date = parseISO(r.createdAt);
    if (isBefore(date, timeRange.start) || isAfter(date, timeRange.end)) return false;
    if (filter.category && r.category !== filter.category) return false;
    if (filter.status && r.status !== filter.status) return false;
    if (filter.kecamatan && r.kelurahan?.kecamatan !== filter.kecamatan) return false;
    if (filter.minScore !== undefined && r.skorUrgensi < filter.minScore) return false;
    if (filter.maxScore !== undefined && r.skorUrgensi > filter.maxScore) return false;
    return true;
  });
}

const initialTimeRange = {
  start: subDays(new Date(), 90),
  end: new Date(),
};

export const useReportsStore = create<ReportsState>((set, get) => ({
  reports: DUMMY_REPORTS,
  filteredReports: applyFilters(DUMMY_REPORTS, {}, initialTimeRange),
  selectedReport: null,
  isLoading: false,
  error: null,
  filter: {},
  timeRange: initialTimeRange,
  isPanelOpen: false,
  currentBbox: null,
  currentZoom: 12.5,

  fetchReports: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await reportsApi.list({ limit: '200' }) as {
        reports: Report[];
        pagination: unknown;
      };
      const reports = (data?.reports && data.reports.length > 0) ? data.reports : DUMMY_REPORTS;
      const { filter, timeRange } = get();
      const filtered = applyFilters(reports, filter, timeRange);
      set({ reports, filteredReports: filtered, isLoading: false });
    } catch {
      // Fallback seamlessly to dummy reports
      const { filter, timeRange } = get();
      const reports = get().reports.length > 0 ? get().reports : DUMMY_REPORTS;
      const filtered = applyFilters(reports, filter, timeRange);
      set({ reports, filteredReports: filtered, isLoading: false });
    }
  },

  fetchViewportReports: async (bbox: string, zoom: number) => {
    set({ currentBbox: bbox, currentZoom: zoom, isLoading: true, error: null });
    try {
      const { filter, timeRange } = get();
      const data = await reportsApi.viewport({
        bbox,
        zoom,
        limit: 300,
        category: filter.category,
        status: filter.status,
        kecamatan: filter.kecamatan,
        startDate: timeRange.start.toISOString(),
        endDate: timeRange.end.toISOString(),
      }) as {
        reports: Report[];
        count: number;
      };

      const reports = (data?.reports && data.reports.length > 0) ? data.reports : DUMMY_REPORTS;
      const filtered = applyFilters(reports, filter, timeRange);
      set({ reports, filteredReports: filtered, isLoading: false });
    } catch {
      const { filter, timeRange } = get();
      const reports = get().reports.length > 0 ? get().reports : DUMMY_REPORTS;
      const filtered = applyFilters(reports, filter, timeRange);
      set({ reports, filteredReports: filtered, isLoading: false });
    }
  },

  setSelectedReport: (report) => {
    set({ selectedReport: report, isPanelOpen: report !== null });
  },

  setFilter: (newFilter) => {
    const filter = { ...get().filter, ...newFilter };
    // Remove undefined keys
    Object.keys(filter).forEach(k => {
      if ((filter as Record<string, unknown>)[k] === undefined) {
        delete (filter as Record<string, unknown>)[k];
      }
    });
    const filtered = applyFilters(get().reports, filter, get().timeRange);
    set({ filter, filteredReports: filtered });
  },

  setTimeRange: (start, end) => {
    const timeRange = { start, end };
    const filtered = applyFilters(get().reports, get().filter, timeRange);
    set({ timeRange, filteredReports: filtered });
  },

  addReport: (report) => {
    const reports = [report, ...get().reports];
    const filtered = applyFilters(reports, get().filter, get().timeRange);
    set({ reports, filteredReports: filtered });
  },

  updateReportStatus: (reportId, status) => {
    const reports = get().reports.map(r =>
      r.id === reportId ? { ...r, status } : r
    );
    const selectedReport = get().selectedReport;
    const updatedSelected = selectedReport?.id === reportId
      ? { ...selectedReport, status }
      : selectedReport;
    const filtered = applyFilters(reports, get().filter, get().timeRange);
    set({ reports, filteredReports: filtered, selectedReport: updatedSelected });
  },

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false, selectedReport: null }),
}));
