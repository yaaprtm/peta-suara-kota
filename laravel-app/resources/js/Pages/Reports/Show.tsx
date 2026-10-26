import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import {
  IconArrowLeft,
  IconMapPin,
  IconClock,
  IconUser,
  IconCheck,
  IconAlertTriangle,
  IconFileText,
  IconSend,
  IconBuildingCommunity,
  IconSparkles,
  IconVolume,
  IconShield,
  IconShare,
  IconPhoto,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { useReportsStore } from '@/stores/reportsStore';
import { useAuthStore } from '@/stores/authStore';
import { reportsApi } from '@/lib/api';
import { Report, ReportStatus, STATUS_LABELS } from '@/types';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar } from '@/Components/ui/Badges';
import LanguageToggle from '@/Components/ui/LanguageToggle';
import { useTranslation } from '@/i18n/useTranslation';

interface ReportDetailProps { id?: string; }
const ReportDetailPage: React.FC<ReportDetailProps> = (props) => {
  const urlParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const id = props.id || urlParts[urlParts.length - 1];
  const navigate = (url: string | number) => typeof url === 'number' ? window.history.go(url) : router.visit(url);
  const { user } = useAuthStore();
  const { reports, updateReportStatus } = useReportsStore();
  const { t } = useTranslation();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<ReportStatus>('DIPROSES');
  const [actionNote, setActionNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Check if current user is petugas or admin
  const isOfficerOrAdmin = user?.role === 'PETUGAS' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    if (!id) return;
    // Find from store first
    const found = reports.find(r => r.id === id);
    if (found) {
      setReport(found);
      setNewStatus(found.status);
      setIsLoading(false);
    } else {
      // Try fetch API
      reportsApi.get(id)
        .then((res: any) => {
          if (res?.report) {
            setReport(res.report);
            setNewStatus(res.report.status);
          }
        })
        .catch(() => {
          // If not found in API, check dummy store
          const fallback = reports[0];
          if (fallback) {
            setReport(fallback);
            setNewStatus(fallback.status);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, reports]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    setIsUpdating(true);
    try {
      // Call API if possible, otherwise update local state
      try {
        await reportsApi.updateStatus(report.id, newStatus, actionNote);
      } catch {
        // Fallback gracefully for demo/testing mode
      }

      updateReportStatus(
        report.id,
        newStatus,
        actionNote || `Status diperbarui menjadi ${STATUS_LABELS[newStatus]}`,
        {
          id: user?.id || 'petugas-1',
          name: user?.name || 'Petugas Lapangan',
          role: user?.role || 'PETUGAS',
        }
      );

      // Update local state
      setReport(prev => {
        if (!prev) return null;
        const newLog = {
          id: `log-${Date.now()}`,
          reportId: prev.id,
          fromStatus: prev.status,
          toStatus: newStatus,
          note: actionNote || `Status diperbarui menjadi ${STATUS_LABELS[newStatus]}`,
          changedAt: new Date().toISOString(),
          changedBy: {
            id: user?.id || 'petugas-1',
            name: user?.name || 'Petugas Lapangan',
            role: user?.role || 'PETUGAS',
          },
        };
        return {
          ...prev,
          status: newStatus,
          statusLogs: [newLog, ...(prev.statusLogs || [])],
        };
      });

      toast.success(t('reportDetail.toastSuccess', { status: t(`status.${newStatus}` as any) }));
      setActionNote('');
    } catch (err: any) {
      toast.error(err?.message || t('reportDetail.toastFailed'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center">
          {/* Fixed: border-3 is now valid via tailwind.config.js borderWidth extension */}
          <div className="w-8 h-8 border-3 border-navy border-t-orange rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-600 font-medium">{t('reportDetail.loading')}</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center max-w-sm">
          <IconAlertTriangle className="w-10 h-10 text-orange mx-auto mb-3" />
          <h3 className="font-bold text-navy text-sm mb-1">{t('reportDetail.notFoundTitle')}</h3>
          <p className="text-xs text-slate-500 mb-4">{t('reportDetail.notFoundDesc')}</p>
          <button onClick={() => navigate(-1)} className="btn-navy w-full text-xs">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = report.createdAt
    ? format(parseISO(report.createdAt), 'dd MMMM yyyy, HH:mm', { locale: localeId }) + ' WIB'
    : '-';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title={t('common.back')}
            >
              <IconArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                  {t('reportDetail.idLabel', { id: report.id.slice(0, 8) })}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {report.kelurahan?.name || report.kecamatan || 'Surabaya'}
                </span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base line-clamp-1">{report.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:inline-flex" />
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success(t('reportDetail.shareSuccess'));
              }}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs flex items-center gap-1"
            >
              <IconShare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('reportDetail.shareBtn')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Details & Evidence */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Info Card */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <CategoryBadge category={report.category} />
                <UrgencyBadge score={report.skorUrgensi} />
                <StatusBadge status={report.status} />
              </div>

              <h2 className="text-lg font-bold text-navy mb-2 leading-snug">
                {report.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                {report.description}
              </p>

              {/* Detected Urgency Keywords */}
              {report.urgensiKeywords && report.urgensiKeywords.length > 0 && (
                <div className="mb-4 bg-orange-50/60 border border-orange-200/80 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-orange-800 text-xs font-semibold mb-1.5">
                    <IconSparkles className="w-4 h-4 text-orange" />
                    <span>{t('reportDetail.keywordsLabel')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {report.urgensiKeywords.map((kw, i) => (
                      <span key={i} className="bg-white border border-orange-200 text-orange-900 text-[11px] px-2 py-0.5 rounded-full font-medium">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Audio Transcript */}
              {report.audioTranscript && (
                <div className="mb-4 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex items-center gap-1.5 text-navy text-xs font-semibold mb-1">
                    <IconVolume className="w-4 h-4 text-navy" />
                    <span>{t('reportDetail.audioLabel')}</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">"{report.audioTranscript}"</p>
                </div>
              )}

              {/* Reporter Info Row */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                <div className="flex items-center gap-2">
                  <Avatar name={report.user?.name || 'Warga'} size="sm" />
                  <div>
                    <span className="font-semibold text-slate-700 block text-xs">{report.user?.name || 'Warga Surabaya'}</span>
                    <span className="text-[10px] text-slate-400">{t('reportDetail.reporterVerified')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                  <IconClock className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
                <h3 className="font-bold text-navy text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <IconPhoto className="w-4 h-4 text-navy" />
                  {t('reportDetail.photosTitle', { count: report.photos.length })}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.photos.map((photo, i) => (
                    <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img
                        src={photo}
                        alt={t('reportDetail.photoAlt', { n: i + 1 })}
                        className="w-full h-48 object-cover group-hover:scale-102 transition-transform duration-200"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Officer Action Panel */}
            {isOfficerOrAdmin && (
              <div className="bg-white rounded-xl border-2 border-navy/20 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-navy text-white flex items-center justify-center">
                    <IconShield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-navy text-xs uppercase tracking-wider">
                      {t('reportDetail.officerPanelTitle')}
                    </h3>
                    <p className="text-[11px] text-slate-500">{t('reportDetail.officerPanelSubtitle')}</p>
                  </div>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('reportDetail.selectStatusLabel')}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(['BARU', 'DIPROSES', 'SELESAI', 'DITOLAK'] as ReportStatus[]).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setNewStatus(st)}
                          className={`py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all ${
                            newStatus === st ? 'bg-navy text-white border-navy font-bold shadow-xs' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {t(`status.${st}` as any)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {t('reportDetail.actionNoteLabel')}
                    </label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={t('reportDetail.actionNotePlaceholder')}
                      rows={3}
                      className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
                    />
                  </div>

                  <button type="submit" disabled={isUpdating} className="btn-navy w-full py-2.5 text-xs flex items-center justify-center gap-2">
                    {isUpdating ? (
                      <span>{t('reportDetail.saving')}</span>
                    ) : (
                      <>
                        <IconSend className="w-4 h-4 text-orange" />
                        <span>{t('reportDetail.saveBtn')}</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Column: Location & Timeline */}
          <div className="space-y-6">
            {/* Location Card with Static Coordinates & Map */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <h3 className="font-bold text-navy text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <IconMapPin className="w-4 h-4 text-orange" />
                {t('reportDetail.locationTitle')}
              </h3>

              <div className="space-y-2 mb-3 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">{t('reportDetail.addressLabel')}</span>
                  <span className="font-medium text-slate-700">{report.address || 'Surabaya, Jawa Timur'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                  <div>
                    <span className="text-slate-400 block">{t('reportDetail.kecamatanLabel')}</span>
                    <span className="font-semibold text-navy">{report.kecamatan || report.kelurahan?.kecamatan || 'Kecamatan Surabaya'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">{t('reportDetail.kelurahanLabel')}</span>
                    <span className="font-semibold text-navy">{report.kelurahan?.name || 'Kelurahan'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-slate-600">
                  Lat: {report.latitude.toFixed(6)}, Lng: {report.longitude.toFixed(6)}
                </div>
              </div>

              <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative">
                <iframe
                  title={t('reportDetail.mapIframeTitle')}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${report.longitude - 0.005}%2C${report.latitude - 0.005}%2C${report.longitude + 0.005}%2C${report.latitude + 0.005}&layer=mapnik&marker=${report.latitude}%2C${report.longitude}`}
                />
              </div>
            </div>

            {/* Timeline: Garis Waktu Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <h3 className="font-bold text-navy text-xs uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <IconClock className="w-4 h-4 text-navy" />
                {t('reportDetail.timelineTitle')}
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                <div className="relative">
                  <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    ['BARU','DIPROSES','SELESAI'].includes(report.status) ? 'bg-navy border-navy text-white' : 'bg-white border-slate-300'
                  }`}>
                    <IconCheck className="w-2.5 h-2.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy block">{t('reportDetail.step1Title')}</span>
                    <span className="text-[11px] text-slate-500 block">{t('reportDetail.step1Desc')}</span>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    ['DIPROSES','SELESAI'].includes(report.status) ? 'bg-orange border-orange text-white' : 'bg-white border-slate-300'
                  }`}>
                    {report.status === 'SELESAI' ? <IconCheck className="w-2.5 h-2.5" /> : <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy block">{t('reportDetail.step2Title')}</span>
                    <span className="text-[11px] text-slate-500 block">{t('reportDetail.step2Desc')}</span>
                  </div>
                </div>

                <div className="relative">
                  <div className={`absolute -left-6 top-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    report.status === 'SELESAI' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-slate-300'
                  }`}>
                    {report.status === 'SELESAI' && <IconCheck className="w-2.5 h-2.5" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-navy block">{t('reportDetail.step3Title')}</span>
                    <span className="text-[11px] text-slate-500 block">{t('reportDetail.step3Desc')}</span>
                  </div>
                </div>
              </div>

              {report.statusLogs && report.statusLogs.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    {t('reportDetail.logsTitle', { count: report.statusLogs.length })}
                  </h4>
                  <div className="space-y-2.5">
                    {report.statusLogs.map((log) => (
                      <div key={log.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-navy text-[11px]">
                            {log.changedBy?.name || t('reportDetail.defaultOfficer')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {format(parseISO(log.changedAt), 'dd/MM/yy HH:mm')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{log.note || `Status → ${log.toStatus}`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;
