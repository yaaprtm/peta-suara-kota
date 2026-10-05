import React, { useCallback, useState, useRef } from 'react';
import {
  IconX,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconCalendar,
  IconFileText,
  IconAlertTriangle,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { UrgencyBadge, StatusBadge, CategoryBadge, Avatar, OfficialVerificationStamp } from '../ui/Badges';
import { useReportsStore } from '../../stores/reportsStore';
import { useAuthStore } from '../../stores/authStore';
import { reportsApi } from '../../lib/api';
import { Report } from '../../types';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const STATUS_TRANSITIONS: Record<Report['status'], Report['status'][]> = {
  BARU: ['DIPROSES', 'DITOLAK'],
  DIPROSES: ['SELESAI', 'DITOLAK'],
  SELESAI: [],
  DITOLAK: [],
};

// ─── ReportDetailPanel (Physical Municipal Incident Dossier) ───────────────────

const ReportDetailPanel: React.FC = () => {
  const { selectedReport, isPanelOpen, closePanel, updateReportStatus } = useReportsStore();
  const { user } = useAuthStore();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<Report['status'] | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const isPetugas = user?.role === 'PETUGAS' || user?.role === 'ADMIN';

  const handleStatusUpdate = useCallback(
    async (status: Report['status']) => {
      if (!selectedReport) return;
      setIsUpdatingStatus(true);
      try {
        await reportsApi.updateStatus(selectedReport.id, status, noteInput || undefined);
        updateReportStatus(selectedReport.id, status);
        toast.success(`Status berhasil diperbarui: ${status}`, {
          style: { background: '#FAF6EE', color: '#2B2822', border: '1px solid #2B2822' },
        });
        setShowStatusForm(false);
        setNoteInput('');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memperbarui status';
        toast.error(msg);
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [selectedReport, noteInput, updateReportStatus]
  );

  if (!isPanelOpen || !selectedReport) return null;

  const report = selectedReport;
  const photoUrls = report.photos.map((p) => (p.startsWith('http') ? p : `/uploads/${p}`));
  const transitions = STATUS_TRANSITIONS[report.status];
  const createdDate = parseISO(report.createdAt);

  return (
    <div
      ref={panelRef}
      className={clsx(
        'absolute top-0 right-0 h-full w-full sm:w-[440px] z-[900]',
        'bg-paper-white flex flex-col overflow-hidden animate-slide-in-right',
        'border-l border-ink shadow-2xl text-ink'
      )}
    >
      {/* ─── Dossier Header */}
      <div className="p-4 border-b border-ink bg-paper-kraft flex-shrink-0 relative">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <IconBuildingCommunity className="w-4 h-4 text-ink/80" />
            <span className="font-mono text-xs font-bold text-ink tracking-wider">
              BERKAS // #{report.id.slice(0, 8).toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={closePanel}
            className="p-1 text-ink hover:bg-paper-white border border-ink/40 transition-colors cursor-pointer"
            aria-label="Tutup panel"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <UrgencyBadge score={report.skorUrgensi} />
          <StatusBadge status={report.status} />
          <CategoryBadge category={report.category} />
        </div>

        <h2 className="font-sans font-bold text-ink text-base leading-snug">
          {report.title}
        </h2>
      </div>

      {/* ─── Content (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans">
        {/* Verification Stamp Banner (When Completed/Verified) */}
        {report.status === 'SELESAI' && (
          <div className="p-3 bg-paper-kraft/40 border border-ink flex items-center justify-between">
            <div>
              <div className="font-sans font-bold text-xs text-ink">Laporan Selesai & Terkonfirmasi</div>
              <div className="font-mono text-[11px] text-ink/70">Petugas telah menindaklanjuti laporan ini.</div>
            </div>
            <OfficialVerificationStamp label="SELESAI" sublabel="PEMKOT SBY" />
          </div>
        )}

        {/* Photo gallery */}
        {photoUrls.length > 0 && (
          <div className="relative bg-paper-kraft/20 border border-ink overflow-hidden">
            <img
              src={photoUrls[photoIdx]}
              alt={`Foto laporan ${photoIdx + 1}`}
              className="w-full h-48 object-cover"
            />
            {photoUrls.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setPhotoIdx((i) => (i - 1 + photoUrls.length) % photoUrls.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-paper-white/90 border border-ink p-1 text-ink hover:bg-paper-white"
                >
                  <IconChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoIdx((i) => (i + 1) % photoUrls.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-paper-white/90 border border-ink p-1 text-ink hover:bg-paper-white"
                >
                  <IconChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 right-2 bg-paper-white font-mono text-[10px] px-2 py-0.5 border border-ink text-ink font-bold">
                  {photoIdx + 1} / {photoUrls.length}
                </div>
              </>
            )}
          </div>
        )}

        {/* Coordinates Box */}
        <div className="p-3 bg-paper-white border border-ink font-mono text-xs space-y-1.5">
          <div className="flex items-center justify-between text-ink/70">
            <span className="flex items-center gap-1.5">
              <IconMapPin className="w-3.5 h-3.5 text-ink" />
              <span>GEOLOKASI:</span>
            </span>
            <span className="text-ink font-bold">
              [{report.longitude.toFixed(5)}, {report.latitude.toFixed(5)}]
            </span>
          </div>
          {report.address && (
            <div className="text-ink font-sans text-xs pt-1 border-t border-ink/20">
              {report.address}
            </div>
          )}
          {report.kelurahan && (
            <div className="text-ink/80 text-[11px] font-sans">
              Kelurahan: <span className="text-ink font-semibold">{report.kelurahan.name}</span>, Kec.{' '}
              <span className="text-ink font-semibold">{report.kelurahan.kecamatan}</span>
            </div>
          )}
        </div>

        {/* Incident Narrative / Description */}
        <div className="p-3 bg-paper-kraft/30 border border-ink space-y-1.5">
          <div className="flex items-center gap-1.5 text-ink font-sans font-bold text-xs uppercase tracking-wider">
            <IconFileText className="w-3.5 h-3.5" />
            <span>Deskripsi Laporan:</span>
          </div>
          <p className="text-ink text-xs leading-relaxed whitespace-pre-wrap font-sans">
            {report.description}
          </p>
        </div>

        {/* Urgency Keywords Detected */}
        {report.urgensiKeywords && report.urgensiKeywords.length > 0 && (
          <div className="p-3 bg-paper-white border border-ink space-y-1.5">
            <span className="text-ink/80 font-sans font-semibold text-xs">
              Kata Kunci Urgensi Terdeteksi:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {report.urgensiKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-stamp-red/10 border border-stamp-red/40 text-stamp-red font-mono text-[10px]"
                >
                  #{kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Reporter Info & Timestamp */}
        <div className="flex items-center justify-between p-3 bg-paper-white border border-ink">
          <div className="flex items-center gap-2">
            <Avatar name={report.user?.name || 'Warga'} size="sm" />
            <div>
              <div className="text-ink font-semibold text-xs">{report.user?.name || 'Warga Anonim'}</div>
              <div className="text-ink/60 text-[10px] font-mono">PELAPOR TERDAFTAR</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-ink/80 flex items-center gap-1 text-[11px]">
              <IconCalendar className="w-3 h-3 text-ink/70" />
              <span>{format(createdDate, 'dd/MM/yyyy', { locale: localeId })}</span>
            </div>
            <div className="text-ink/60 font-mono text-[10px]">
              {format(createdDate, 'HH:mm:ss', { locale: localeId })} WIB
            </div>
          </div>
        </div>

        {/* Petugas Action Section */}
        {isPetugas && transitions.length > 0 && (
          <div className="p-3 bg-paper-kraft border border-ink space-y-2 mt-4">
            <div className="flex items-center gap-1.5 text-ink font-sans font-bold text-xs uppercase tracking-wider">
              <IconAlertTriangle className="w-3.5 h-3.5" />
              <span>Tindakan Petugas:</span>
            </div>

            {!showStatusForm ? (
              <div className="flex gap-2">
                {transitions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setPendingStatus(status);
                      setShowStatusForm(true);
                    }}
                    className={clsx(
                      'flex-1 py-1.5 font-sans font-medium text-xs border border-ink transition-colors cursor-pointer',
                      status === 'SELESAI'
                        ? 'bg-[#4A7A6E] text-paper-white hover:opacity-90'
                        : status === 'DIPROSES'
                        ? 'bg-mustard text-paper-white hover:opacity-90'
                        : 'bg-stamp-red text-paper-white hover:opacity-90'
                    )}
                  >
                    Ubah ke {status}
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Catatan penanganan petugas (opsional)..."
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  className="input-paper text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => pendingStatus && handleStatusUpdate(pendingStatus)}
                    disabled={isUpdatingStatus}
                    className="btn-paper-primary flex-1 text-xs py-1.5"
                  >
                    {isUpdatingStatus ? 'Menyimpan...' : `Konfirmasi ${pendingStatus}`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStatusForm(false)}
                    className="btn-paper-secondary text-xs py-1.5 px-3"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDetailPanel;
