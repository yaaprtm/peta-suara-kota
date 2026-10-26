import { create } from 'zustand';
import type { Report, MapFilter } from '../types';
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

  hoveredReportId: string | null;
  setHoveredReportId: (id: string | null) => void;
  fetchReports: () => Promise<void>;
  fetchViewportReports: (bbox: string, zoom: number) => Promise<void>;
  setSelectedReport: (report: Report | null) => void;
  setFilter: (filter: Partial<MapFilter>) => void;
  setTimeRange: (start: Date, end: Date) => void;
  addReport: (report: Report) => void;
  updateReportStatus: (reportId: string, status: Report['status'], note?: string, changedBy?: { id: string; name: string; role: any }) => void;
  resetReports: () => void;
  openPanel: () => void;
  closePanel: () => void;
}

function applyFilters(reports: Report[], filter: MapFilter, timeRange: { start: Date; end: Date }): Report[] {
  return reports.filter(r => {
    const date = parseISO(r.createdAt);
    if (isBefore(date, timeRange.start) || isAfter(date, timeRange.end)) return false;
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(r.category)) return false;
    } else if (filter.category && r.category !== filter.category) {
      return false;
    }
    if (filter.status && r.status !== filter.status) return false;
    if (filter.kecamatan) {
      const reportKec = r.kecamatan || r.kelurahan?.kecamatan;
      if (!reportKec || reportKec.toLowerCase() !== filter.kecamatan.toLowerCase()) return false;
    }
    if (filter.onlyCritical && r.skorUrgensi < 80) return false;
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
  hoveredReportId: null,
  setHoveredReportId: (id) => set({ hoveredReportId: id }),

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

  updateReportStatus: (reportId, status, note, changedBy) => {
    const reports = get().reports.map(r => {
      if (r.id !== reportId) return r;
      const logs = r.statusLogs || [];
      const newLog = {
        id: `log-${Date.now()}`,
        reportId,
        fromStatus: r.status,
        toStatus: status,
        note: note || `Status diperbarui menjadi ${status}`,
        changedAt: new Date().toISOString(),
        changedBy: changedBy || { id: 'petugas-1', name: 'Petugas Pelaksana', role: 'PETUGAS' as const },
      };
      return {
        ...r,
        status,
        statusLogs: [newLog, ...logs],
        updatedAt: new Date().toISOString(),
      };
    });

    const selectedReport = get().selectedReport;
    const updatedSelected = selectedReport?.id === reportId
      ? reports.find(r => r.id === reportId) || selectedReport
      : selectedReport;
    const filtered = applyFilters(reports, get().filter, get().timeRange);
    set({ reports, filteredReports: filtered, selectedReport: updatedSelected });
  },

  resetReports: () => {
    const { filter, timeRange } = get();
    const filtered = applyFilters(DUMMY_REPORTS, filter, timeRange);
    set({ reports: DUMMY_REPORTS, filteredReports: filtered, selectedReport: null });
  },

  openPanel: () => set({ isPanelOpen: true }),
  closePanel: () => set({ isPanelOpen: false, selectedReport: null }),
}));
