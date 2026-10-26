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
  IconThumbUp,
  IconPrinter,
  IconCircleCheck,
  IconCamera,
  IconCertificate,
  IconPhone,
  IconExclamationMark,
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

const SAMPLE_COMPLETION_PHOTOS = [
  'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?auto=format&fit=crop&w=800&q=80',
];

const ReportDetailPage: React.FC<ReportDetailProps> = (props) => {
  const urlParts = typeof window !== 'undefined' ? window.location.pathname.split('/') : [];
  const id = props.id || urlParts[urlParts.length - 1];
  const navigate = (url: string | number) => typeof url === 'number' ? window.history.go(url) : router.visit(url);
  const { user } = useAuthStore();
  const { reports, updateReportStatus, upvoteReport } = useReportsStore();
  const { t } = useTranslation();

  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<ReportStatus>('DIPROSES');
  const [actionNote, setActionNote] = useState('');
  const [completionPhoto, setCompletionPhoto] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);

  // Check if current user is petugas or admin
  const isOfficerOrAdmin = user?.role === 'PETUGAS' || user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  useEffect(() => {
    if (!id) return;

    if (typeof window !== 'undefined') {
      const upvoted = localStorage.getItem(`psk_upvoted_${id}`);
      if (upvoted) setHasUpvoted(true);
    }

    // Find from store first
    const found = reports.find(r => r.id === id || r.trackingCode === id);
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

  const handleUpvote = async () => {
    if (!report || hasUpvoted || isUpvoting) return;

    setIsUpvoting(true);
    try {
      await reportsApi.upvote(report.id);
      upvoteReport(report.id);
      setReport(prev => prev ? { ...prev, upvotesCount: (prev.upvotesCount || 0) + 1 } : null);
      setHasUpvoted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`psk_upvoted_${report.id}`, 'true');
      }
      toast.success('Dukungan dicatat! Suara warga mempercepat penanganan di lapangan.');
    } catch {
      // Offline fallback
      upvoteReport(report.id);
      setReport(prev => prev ? { ...prev, upvotesCount: (prev.upvotesCount || 0) + 1 } : null);
      setHasUpvoted(true);
      toast.success('Dukungan dicatat!');
    } finally {
      setIsUpvoting(false);
    }
  };

  const handlePrintDisposisi = () => {
    window.print();
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report) return;

    setIsUpdating(true);
    try {
      const completionPhotos = completionPhoto ? [completionPhoto] : [];

      try {
        await reportsApi.updateStatus(report.id, newStatus, actionNote, {
          completionNote: actionNote,
          completionPhotos: completionPhotos.length > 0 ? completionPhotos : undefined,
        });
      } catch {
        // Fallback gracefully for demo/testing mode
      }

      updateReportStatus(
        report.id,
        newStatus,
        actionNote || `Status diperbarui menjadi ${STATUS_LABELS[newStatus]}`,
        {
          id: user?.id || 'petugas-1',
          name: user?.name || 'Petugas Satgas Pemkot',
          role: user?.role || 'PETUGAS',
        },
        {
          completionNote: actionNote,
          completionPhotos: completionPhotos.length > 0 ? completionPhotos : report.completionPhotos,
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
            name: user?.name || 'Petugas Satgas Pemkot',
            role: user?.role || 'PETUGAS',
          },
        };
        return {
          ...prev,
          status: newStatus,
          statusLogs: [newLog, ...(prev.statusLogs || [])],
          ...(newStatus === 'SELESAI' ? {
            completionNote: actionNote || prev.completionNote,
            completionPhotos: completionPhotos.length > 0 ? completionPhotos : prev.completionPhotos,
            resolvedAt: new Date().toISOString(),
          } : {}),
        };
      });

      toast.success(t('reportDetail.toastSuccess', { status: t(`status.${newStatus}` as any) }));
      setActionNote('');
      setCompletionPhoto('');
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

  const formattedResolvedDate = report.resolvedAt
    ? format(parseISO(report.resolvedAt), 'dd MMMM yyyy, HH:mm', { locale: localeId }) + ' WIB'
    : null;

  const trackingCode = report.trackingCode || `PSK-SBY-${report.id.slice(0, 6).toUpperCase()}`;

  // Estimasi target SLA berdasarkan skor urgensi
  const slaTargetHours = report.skorUrgensi >= 80 ? 6 : report.skorUrgensi >= 60 ? 24 : 48;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20 print:bg-white print:p-0 print:pb-0">
      {/* ─── KOP SURAT RESMI (Hanya Muncul Saat Print / Cetak Berita Acara) ─── */}
      <div className="hidden print:block p-6 border-b-2 border-black mb-6">
        <div className="flex items-center justify-between pb-3 border-b border-black">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 border-2 border-black flex items-center justify-center font-bold text-lg">
              SBY
            </div>
            <div>
              <h2 className="text-base font-bold uppercase tracking-wider leading-tight">Pemerintah Kota Surabaya</h2>
              <h3 className="text-sm font-semibold uppercase leading-tight">Dinas Komunikasi dan Informatika</h3>
              <p className="text-[11px] text-gray-700">Unit Reaksi Cepat Command Center 112 • Sistem Peta Suara Kota</p>
            </div>
          </div>
          <div className="text-right text-xs">
            <p className="font-mono font-bold text-sm">{trackingCode}</p>
            <p className="text-[10px] text-gray-600">Dokumen Disposisi Elektronik</p>
            <p className="text-[10px]">{format(new Date(), 'dd/MM/yyyy HH:mm')} WIB</p>
          </div>
        </div>
        <div className="text-center pt-3">
          <h1 className="text-sm font-bold uppercase underline">LEMBAR BERITA ACARA PENGADUAN WARGA BERBASIS GEOSPASIAL</h1>
        </div>
      </div>

      {/* ─── Top Navigation Bar ─── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs print:hidden">
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
                <span className="text-[11px] font-mono font-bold text-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {trackingCode}
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                  {report.kelurahan?.name || report.kecamatan || 'Surabaya'}
                </span>
              </div>
              <h1 className="font-bold text-navy text-sm sm:text-base line-clamp-1 mt-0.5">{report.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrintDisposisi}
              className="px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs flex items-center gap-1.5 font-medium transition-colors"
              title="Cetak Berita Acara Disposisi Resmi"
            >
              <IconPrinter className="w-3.5 h-3.5 text-navy" />
              <span className="hidden sm:inline">Cetak Disposisi</span>
            </button>

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
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CategoryBadge category={report.category} />
                  <UrgencyBadge score={report.skorUrgensi} />
                  <StatusBadge status={report.status} />
                </div>

                {/* Dukungan Warga (Upvote Button) */}
                <button
                  type="button"
                  onClick={handleUpvote}
                  disabled={hasUpvoted || isUpvoting}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    hasUpvoted
                      ? 'bg-orange/10 border-orange/40 text-orange cursor-default'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-97'
                  }`}
                  title={hasUpvoted ? 'Anda sudah mendukung laporan ini' : 'Dukung laporan ini agar diprioritaskan'}
                >
                  <IconThumbUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'text-orange fill-orange' : 'text-slate-500'}`} />
                  <span>{report.upvotesCount || 0} Dukungan Warga</span>
                </button>
              </div>

              <h2 className="text-lg font-bold text-navy mb-2 leading-snug">
                {report.title}
              </h2>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                {report.description}
              </p>

              {/* ─── Parameter Analisis Urgensi NLP & Target SLA ─── */}
              <div className="mb-4 bg-slate-50/80 border border-slate-200 rounded-lg p-3.5">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 text-navy text-xs font-bold">
                    <IconSparkles className="w-4 h-4 text-orange" />
                    <span>Parameter Analisis Urgensi Sistem & Target SLA</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    SLA Max: {slaTargetHours} Jam
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs mb-2">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Skor Otomatis NLP</span>
                    <span className="font-bold text-navy font-mono text-sm">{report.skorUrgensi} / 100</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Tingkat Risiko</span>
                    <span className="font-bold text-navy uppercase text-xs">
                      {report.skorUrgensi >= 80 ? 'Kritis (Darurat)' : report.skorUrgensi >= 60 ? 'Tinggi' : 'Sedang'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Dinas Terkait (OPD)</span>
                    <span className="font-bold text-navy text-xs">
                      {report.category === 'INFRASTRUKTUR' ? 'DPUBMP Surabaya' :
                       report.category === 'BANJIR' ? 'Dinas SDA & Pematusan' :
                       report.category === 'KEBERSIHAN' ? 'DKRTH Surabaya' :
                       report.category === 'KEAMANAN' ? 'Satpol PP & BPBD' : 'Command Center 112'}
                    </span>
                  </div>
                </div>

                {report.urgensiKeywords && report.urgensiKeywords.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Kata Kunci Pemicu Risiko yang Terdeteksi:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.urgensiKeywords.map((kw, i) => (
                        <span key={i} className="bg-orange/10 border border-orange/30 text-orange-950 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

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
                  <span>Dibuat: {formattedDate}</span>
                </div>
              </div>
            </div>

            {/* ─── HASIL PENANGANAN LAPANGAN (SEBELUM VS SESUDAH) ─── */}
            {report.status === 'SELESAI' && (
              <div className="bg-white rounded-xl border-2 border-emerald-500/30 p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                      <IconCircleCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-navy text-sm uppercase tracking-wide">
                        Bukti Penanganan Lapangan (Selesai Dikerjakan)
                      </h3>
                      <p className="text-[11px] text-emerald-700 font-medium">
                        Telah diverifikasi oleh Satgas Command Center Kota Surabaya
                      </p>
                    </div>
                  </div>
                  {formattedResolvedDate && (
                    <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      Selesai: {formattedResolvedDate}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Kondisi Awal */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        1. Kondisi Awal (Laporan Warga)
                      </span>
                      <span className="text-[10px] bg-red-100 text-red-700 font-semibold px-1.5 py-0.5 rounded">
                        Sebelum
                      </span>
                    </div>
                    {report.photos && report.photos.length > 0 ? (
                      <div className="rounded-md overflow-hidden border border-slate-200 bg-white h-44">
                        <img
                          src={report.photos[0]}
                          alt="Kondisi awal"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="h-44 rounded-md border border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 bg-white">
                        Tidak ada foto awal
                      </div>
                    )}
                  </div>

                  {/* Kondisi Selesai */}
                  <div className="border border-emerald-200 rounded-lg p-3 bg-emerald-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                        2. Kondisi Selesai (Verifikasi Satgas)
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-semibold px-1.5 py-0.5 rounded">
                        Sesudah
                      </span>
                    </div>
                    {report.completionPhotos && report.completionPhotos.length > 0 ? (
                      <div className="rounded-md overflow-hidden border border-emerald-300 bg-white h-44">
                        <img
                          src={report.completionPhotos[0]}
                          alt="Bukti selesai perbaikan"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <div className="h-44 rounded-md border border-dashed border-emerald-300 flex items-center justify-center text-xs text-emerald-700 bg-white">
                        Perbaikan telah tuntas di lapangan
                      </div>
                    )}
                  </div>
                </div>

                {report.completionNote && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-950">
                    <span className="font-bold block mb-0.5 text-emerald-900">Catatan Berita Acara Petugas:</span>
                    <p className="leading-relaxed">{report.completionNote}</p>
                  </div>
                )}
              </div>
            )}

            {/* Photos (Laporan Awal) */}
            {report.photos && report.photos.length > 0 && report.status !== 'SELESAI' && (
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
              <div className="bg-white rounded-xl border-2 border-navy/20 p-5 shadow-sm print:hidden">
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

                  {newStatus === 'SELESAI' && (
                    <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-lg space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                        <IconCamera className="w-4 h-4 text-emerald-700" />
                        <span>Foto Bukti Penyelesaian Lapangan (After)</span>
                      </div>
                      <p className="text-[11px] text-emerald-800">
                        Pilih contoh foto dokumentasi perbaikan atau tempel URL foto bukti perbaikan:
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {SAMPLE_COMPLETION_PHOTOS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setCompletionPhoto(url)}
                            className={`h-16 rounded overflow-hidden border-2 transition-all ${
                              completionPhoto === url ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Bukti ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={completionPhoto}
                        onChange={(e) => setCompletionPhoto(e.target.value)}
                        placeholder="Atau masukkan URL foto bukti penanganan..."
                        className="w-full text-xs p-2 rounded border border-emerald-200 bg-white"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {newStatus === 'SELESAI' ? 'Catatan Berita Acara Penyelesaian:' : t('reportDetail.actionNoteLabel')}
                    </label>
                    <textarea
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      placeholder={
                        newStatus === 'SELESAI'
                          ? 'Contoh: Pekerjaan tambal jalan selesai pukul 14:00 WIB oleh Satgas DPUBMP. Kondisi jalan sudah aman.'
                          : t('reportDetail.actionNotePlaceholder')
                      }
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

              <div className="h-44 w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative print:hidden">
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

            {/* Lembar Tanda Tangan Verifikator (Hanya Muncul Saat Cetak Disposisi) */}
            <div className="hidden print:block border border-black p-4 mt-8">
              <div className="grid grid-cols-2 text-center text-xs">
                <div>
                  <p className="mb-14">Petugas Verifikasi Lapangan,</p>
                  <p className="font-bold underline">( ............................................ )</p>
                  <p className="text-[10px]">NIP. ......................................</p>
                </div>
                <div>
                  <p className="mb-14">Mengetahui, Kasatgas Command Center,</p>
                  <p className="font-bold underline">( Ir. Agus Wahyudi )</p>
                  <p className="text-[10px]">NIP. 19780412 200312 1 004</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReportDetailPage;
