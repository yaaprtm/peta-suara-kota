import React, { useState, useCallback, useRef } from 'react';
import {
  IconUpload,
  IconMicrophone,
  IconMicrophoneOff,
  IconMapPin,
  IconLoader2,
  IconCheck,
  IconSend,
  IconTool,
  IconTrash,
  IconShieldExclamation,
  IconDroplet,
  IconFileText,
  IconX,
} from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { ReportCategory, CATEGORY_LABELS } from '../../types';
import { reportsApi } from '../../lib/api';
import { useReportsStore } from '../../stores/reportsStore';
import { useAuthStore } from '../../stores/authStore';

interface ReportFormProps {
  onClose?: () => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  onPickLocation: () => void;
  pickedLocation?: { lat: number; lng: number } | null;
  initialLocation?: { lat: number; lng: number } | null;
}

const CATEGORIES = Object.values(ReportCategory) as ReportCategory[];

const CATEGORY_ICON_MAP: Record<ReportCategory, React.ReactNode> = {
  INFRASTRUKTUR: <IconTool className="w-4 h-4 shrink-0" stroke={1.5} />,
  KEBERSIHAN: <IconTrash className="w-4 h-4 shrink-0" stroke={1.5} />,
  KEAMANAN: <IconShieldExclamation className="w-4 h-4 shrink-0" stroke={1.5} />,
  BANJIR: <IconDroplet className="w-4 h-4 shrink-0" stroke={1.5} />,
  LAINNYA: <IconFileText className="w-4 h-4 shrink-0" stroke={1.5} />,
};

interface ISpeechRecognitionResult {
  readonly 0: { transcript: string };
}

interface ISpeechRecognitionEvent {
  results: ISpeechRecognitionResult[];
}

interface ISpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: ISpeechRecognitionEvent) => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

const ReportForm: React.FC<ReportFormProps> = ({
  onClose,
  onCancel,
  onSuccess,
  onPickLocation,
  pickedLocation,
  initialLocation,
}) => {
  const activeLocation = pickedLocation || initialLocation || null;
  const { addReport } = useReportsStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('INFRASTRUKTUR');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleClose = () => {
    if (onClose) onClose();
    if (onCancel) onCancel();
  };

  const onDrop = useCallback((accepted: File[]) => {
    setPhotos((prev) => {
      const combined = [...prev, ...accepted];
      return combined.slice(0, 4);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxFiles: 4,
    multiple: true,
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();

      const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (e: ISpeechRecognitionEvent) => {
          const current = Array.from(e.results)
            .map((r) => r[0].transcript)
            .join(' ');
          setAudioTranscript(current);
          setDescription((prev) => (prev ? `${prev} ${current}` : current));
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      setIsRecording(true);
      toast.success('Perekaman suara aktif. Silakan berbicara...');
    } catch {
      toast.error('Tidak dapat mengakses mikrofon');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast.success('Perekaman audio selesai');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul perihal wajib diisi');
      return;
    }
    if (!description.trim()) {
      toast.error('Deskripsi kronologi wajib diisi');
      return;
    }
    if (!activeLocation) {
      toast.error('Pilih titik lokasi pada peta');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('latitude', String(activeLocation.lat));
      formData.append('longitude', String(activeLocation.lng));
      if (address) formData.append('address', address.trim());
      if (audioTranscript) formData.append('audioTranscript', audioTranscript);

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.webm');
      }

      const res = (await reportsApi.create(formData)) as any;
      addReport(res.report);
      setStep('success');
      toast.success('Laporan berhasil didaftarkan ke berkas pengaduan!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengirim laporan';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-paper-white p-6 border border-ink flex flex-col items-center text-center space-y-4 font-body text-ink">
        <div className="border-2 border-dashed border-ink p-4 w-full flex flex-col items-center gap-2 bg-paper-kraft/40">
          <div className="official-stamp text-xs">
            <span>TERVERIFIKASI</span>
            <span className="text-[9px]">KOTA SURABAYA</span>
          </div>
          <h3 className="font-body font-bold text-base text-ink tracking-tight uppercase mt-1">
            BERKAS PENGADUAN DITERIMA
          </h3>
          <p className="font-mono text-xs text-ink/70 max-w-sm">
            Laporan Anda telah tercatat dalam arsip pengaduan kelurahan dan sistem pemantauan urgensi kota.
          </p>
        </div>
        <button
          onClick={() => {
            if (onSuccess) onSuccess();
            handleClose();
          }}
          className="btn-paper-primary w-full py-2.5 text-xs font-mono font-bold"
        >
          KEMBALI KE PETA
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-paper-white p-4 sm:p-5 border border-ink space-y-4 text-xs font-body text-ink">
      {/* Header Form Dokumen */}
      <div className="border-b border-ink/40 pb-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink/60">
            KOTAMADYA SURABAYA · DOKUMEN PENGADUAN
          </span>
          <span className="font-mono text-[10px] text-ink/60">BLANGKO RESMI</span>
        </div>
        <h2 className="font-body font-bold text-sm text-ink tracking-tight mt-0.5 uppercase">
          FORMULIR LAPORAN ASPIRASI & GANGGUAN WARGA
        </h2>
      </div>

      {/* 01: Kategori Masalah */}
      <div>
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1.5">
          [01] KATEGORI GANGGUAN
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={clsx(
                  'px-2.5 py-2 border text-left flex items-center gap-2 transition-all font-body text-xs',
                  isSelected
                    ? 'bg-paper-kraft border-ink font-bold shadow-none'
                    : 'bg-paper-white border-ink/30 text-ink/70 hover:border-ink hover:text-ink'
                )}
              >
                {CATEGORY_ICON_MAP[cat]}
                <span className="truncate">{CATEGORY_LABELS[cat]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 02: Judul Laporan */}
      <div>
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1">
          [02] PERIHAL / JUDUL SINGKAT
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Aspal Amblas Depan Kantor Kelurahan..."
          className="input-paper text-xs"
        />
      </div>

      {/* 03: Lokasi */}
      <div>
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1">
          [03] KOORDINAT TITIK LAPORAN
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-paper-blue/40 border border-ink px-3 py-2 font-mono text-xs flex items-center justify-between">
            {activeLocation ? (
              <span className="font-bold text-ink">
                LON: {activeLocation.lng.toFixed(5)} · LAT: {activeLocation.lat.toFixed(5)}
              </span>
            ) : (
              <span className="text-ink/50 italic">Titik belum ditentukan pada peta</span>
            )}
            <IconMapPin className="w-4 h-4 text-ink shrink-0" stroke={1.5} />
          </div>
          <button
            type="button"
            onClick={onPickLocation}
            className="btn-paper-secondary shrink-0 font-mono font-bold text-[11px]"
          >
            TENTUKAN DI PETA
          </button>
        </div>
      </div>

      {/* 04: Deskripsi & Audio Voice */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80">
            [04] KRONOLOGI & DETAIL MASALAH
          </label>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={clsx(
              'px-2 py-0.5 border text-[10px] font-mono flex items-center gap-1 transition-all',
              isRecording
                ? 'bg-stamp-red text-paper-white border-ink animate-pulse font-bold'
                : 'bg-paper-white border-ink/40 text-ink hover:bg-paper-kraft'
            )}
          >
            {isRecording ? (
              <IconMicrophoneOff className="w-3 h-3" stroke={1.5} />
            ) : (
              <IconMicrophone className="w-3 h-3" stroke={1.5} />
            )}
            <span>{isRecording ? 'HENTIKAN REKAM' : 'REKAM SUARA'}</span>
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Tuliskan uraian jelas mengenai kejadian atau kondisi lapangan..."
          rows={3}
          className="input-paper text-xs resize-none"
        />
      </div>

      {/* 05: Alamat / Patokan */}
      <div>
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1">
          [05] ALAMAT / PATOKAN (OPSIONAL)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Contoh: Jl. Embong Malang No. 10, RT 02 / RW 01..."
          className="input-paper text-xs"
        />
      </div>

      {/* 06: Lampiran Foto */}
      <div>
        <label className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink/80 block mb-1">
          [06] LAMPIRAN FOTO BUKTI (MAKS. 4 BERKAS)
        </label>
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed p-3 text-center cursor-pointer transition-all',
            isDragActive
              ? 'border-ink bg-paper-kraft'
              : 'border-ink/40 hover:border-ink bg-paper-white'
          )}
        >
          <input {...getInputProps()} />
          <IconUpload className="w-4 h-4 mx-auto text-ink/60 mb-1" stroke={1.5} />
          <p className="text-ink/70 text-[11px]">
            {isDragActive ? 'Lepaskan berkas foto di sini' : 'Klik atau seret foto bukti laporan ke area ini'}
          </p>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square border border-ink overflow-hidden bg-paper-kraft">
                <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-0.5 right-0.5 bg-stamp-red text-paper-white w-4 h-4 text-[10px] flex items-center justify-center border border-ink"
                  title="Hapus foto"
                >
                  <IconX className="w-3 h-3" stroke={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="pt-2 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-paper-primary flex-1 py-2 text-xs font-mono font-bold flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="w-4 h-4 animate-spin" stroke={1.5} />
              <span>MENDAFTARKAN BERKAS...</span>
            </>
          ) : (
            <>
              <IconSend className="w-4 h-4" stroke={1.5} />
              <span>KIRIMKAN LAPORAN RESMI</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="btn-paper-secondary px-4 text-xs font-mono"
        >
          BATAL
        </button>
      </div>
    </form>
  );
};

export default ReportForm;
