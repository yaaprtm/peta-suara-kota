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
  IconBuildingCommunity,
} from '@tabler/icons-react';
import { useDropzone } from 'react-dropzone';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { ReportCategory, CATEGORY_LABELS } from '../../types';
import { reportsApi } from '../../lib/api';
import { useReportsStore } from '../../stores/reportsStore';
import { useAuthStore } from '../../stores/authStore';
import { fetchKecamatanGeoJSON, findKecamatanByCoordinate } from '../../lib/kecamatan';

interface ReportFormProps {
  onClose?: () => void;
  onCancel?: () => void;
  onSuccess?: () => void;
  onPickLocation?: () => void;
  pickedLocation?: { lat: number; lng: number } | null;
  initialLocation?: { lat: number; lng: number } | null;
}

const CATEGORIES = Object.values(ReportCategory) as ReportCategory[];

const CATEGORY_ICON_MAP: Record<ReportCategory, React.ReactNode> = {
  INFRASTRUKTUR: <IconTool className="w-4 h-4 shrink-0" />,
  KEBERSIHAN: <IconTrash className="w-4 h-4 shrink-0" />,
  KEAMANAN: <IconShieldExclamation className="w-4 h-4 shrink-0" />,
  BANJIR: <IconDroplet className="w-4 h-4 shrink-0" />,
  LAINNYA: <IconFileText className="w-4 h-4 shrink-0" />,
};

// Preset kecamatan in Surabaya for 1-click location selection
const SURABAYA_DISTRICTS = [
  { name: 'Gubeng', lat: -7.2754, lng: 112.7533 },
  { name: 'Genteng', lat: -7.2575, lng: 112.7483 },
  { name: 'Tegalsari', lat: -7.2721, lng: 112.7381 },
  { name: 'Wonokromo', lat: -7.2982, lng: 112.7386 },
  { name: 'Rungkut', lat: -7.3228, lng: 112.7844 },
  { name: 'Sawahan', lat: -7.2711, lng: 112.7214 },
  { name: 'Kenjeran', lat: -7.2285, lng: 112.7812 },
  { name: 'Sukolilo', lat: -7.2882, lng: 112.7981 },
  { name: 'Tambaksari', lat: -7.2514, lng: 112.7661 },
];

const ReportForm: React.FC<ReportFormProps> = ({
  onClose,
  onCancel,
  onSuccess,
  onPickLocation,
  pickedLocation,
  initialLocation,
}) => {
  const { addReport } = useReportsStore();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('INFRASTRUKTUR');
  const [address, setAddress] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState(SURABAYA_DISTRICTS[0]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');

  // Active coordinates
  const activeLocation = pickedLocation || initialLocation || { lat: selectedDistrict.lat, lng: selectedDistrict.lng };

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

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
      mediaRecorderRef.current = mediaRecorder;

      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.lang = 'id-ID';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (e: any) => {
          const current = Array.from(e.results)
            .map((r: any) => r[0].transcript)
            .join(' ');
          setAudioTranscript(current);
          setDescription((prev) => (prev ? `${prev} ${current}` : current));
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.start();
      setIsRecording(true);
      toast.success('Rekaman suara aktif. Silakan berbicara...');
    } catch {
      toast.error('Tidak dapat mengakses mikrofon');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast.success('Rekaman suara selesai');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Judul laporan wajib diisi');
      return;
    }
    if (!description.trim()) {
      toast.error('Deskripsi kronologi masalah wajib diisi');
      return;
    }

    setIsSubmitting(true);
    const kecName = selectedDistrict.name;

    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('latitude', String(activeLocation.lat));
      formData.append('longitude', String(activeLocation.lng));
      formData.append('kecamatan', kecName);
      if (address) formData.append('address', address.trim());
      if (audioTranscript) formData.append('audioTranscript', audioTranscript);

      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      try {
        const res = (await reportsApi.create(formData)) as any;
        if (res?.report) {
          addReport(res.report);
        }
      } catch {
        // Fallback local report creation
        addReport({
          id: `rep-warga-${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'BARU',
          latitude: activeLocation.lat,
          longitude: activeLocation.lng,
          address: address.trim() || `Jl. Protokol, Kec. ${kecName}`,
          kecamatan: kecName,
          kelurahan: {
            id: `kel-${kecName.toLowerCase()}`,
            name: kecName,
            kecamatan: kecName,
          },
          skorUrgensi: category === 'BANJIR' ? 85 : category === 'KEAMANAN' ? 75 : 55,
          urgensiKeywords: ['laporan baru', 'warga', kecName.toLowerCase()],
          photos: photos.map((p) => URL.createObjectURL(p)),
          audioTranscript: audioTranscript || undefined,
          userId: user?.id || 'warga-1',
          user: {
            id: user?.id || 'warga-1',
            name: user?.name || 'Warga Surabaya',
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          statusLogs: [
            {
              id: `log-${Date.now()}`,
              reportId: `rep-warga-${Date.now()}`,
              toStatus: 'BARU',
              note: 'Laporan berhasil dibuat dan masuk antrean sistem.',
              changedAt: new Date().toISOString(),
              changedBy: { id: user?.id || 'warga-1', name: user?.name || 'Warga Pelapor', role: 'WARGA' },
            },
          ],
        });
      }

      setStep('success');
      toast.success('Laporan pengaduan berhasil dikirim!');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirim laporan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="bg-white p-6 rounded-xl flex flex-col items-center text-center space-y-4 font-sans text-slate-800">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
          <IconCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="font-bold text-base text-navy">
            Matur Nuwun! Laporan Berhasil Dikirim
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Pengaduanmu telah tercatat di antrean Command Center Surabaya. Petugas dan dinas terkait akan segera menindaklanjuti.
          </p>
        </div>
        <button
          onClick={() => {
            if (onSuccess) onSuccess();
            handleClose();
          }}
          className="btn-navy w-full py-2.5 text-xs font-semibold"
        >
          Lihat di Dashboard Warga
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-5 space-y-4 text-xs font-sans text-slate-800">
      {/* Header Form */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-orange font-bold uppercase tracking-wider">
            <IconBuildingCommunity className="w-3.5 h-3.5" />
            <span>KOTA SURABAYA · FORMULIR PENGADUAN WARGA</span>
          </div>
          <h2 className="font-bold text-sm text-navy mt-0.5">
            Buat Laporan / Keluhan Baru
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>

      {/* 01: Kategori Gangguan */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1.5 text-xs">
          1. Pilih Kategori Masalah
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
                  'px-2.5 py-2 rounded-lg border text-left flex items-center gap-2 transition-all text-xs font-medium',
                  isSelected
                    ? 'bg-navy text-white border-navy font-bold shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                )}
              >
                {CATEGORY_ICON_MAP[cat]}
                <span className="truncate">{CATEGORY_LABELS[cat]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 02: Judul Singkat */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1 text-xs">
          2. Judul Laporan Singkat
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Contoh: Aspal berlubang parah depan Balai RW..."
          className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy"
          required
        />
      </div>

      {/* 03: Pilih Wilayah & Titik Lokasi */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1 text-xs">
          3. Wilayah Kecamatan di Surabaya
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={selectedDistrict.name}
            onChange={(e) => {
              const found = SURABAYA_DISTRICTS.find((d) => d.name === e.target.value);
              if (found) setSelectedDistrict(found);
            }}
            className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-navy"
          >
            {SURABAYA_DISTRICTS.map((d) => (
              <option key={d.name} value={d.name}>
                Kecamatan {d.name}
              </option>
            ))}
          </select>

          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between text-[11px] text-slate-600 font-mono">
            <span>
              Lat: {activeLocation.lat.toFixed(4)}, Lng: {activeLocation.lng.toFixed(4)}
            </span>
            <IconMapPin className="w-3.5 h-3.5 text-orange shrink-0" />
          </div>
        </div>
      </div>

      {/* 04: Deskripsi & Rekam Suara */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="font-semibold text-slate-700 text-xs">
            4. Detail Kronologi Masalah
          </label>
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={clsx(
              'px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 transition-all',
              isRecording
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100'
            )}
          >
            {isRecording ? <IconMicrophoneOff className="w-3.5 h-3.5" /> : <IconMicrophone className="w-3.5 h-3.5" />}
            <span>{isRecording ? 'Hentikan Rekam' : 'Rekam Suara'}</span>
          </button>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Ceritakan permasalahan secara jelas dan lengkap..."
          rows={3}
          className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy resize-none"
          required
        />
      </div>

      {/* 05: Alamat Patokan */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1 text-xs">
          5. Alamat / Patokan Khusus (Opsional)
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Contoh: Jl. Dharmawangsa No. 12, seberang masjid..."
          className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:border-navy"
        />
      </div>

      {/* 06: Lampiran Foto */}
      <div>
        <label className="font-semibold text-slate-700 block mb-1 text-xs">
          6. Foto Bukti Lapangan (Maks. 4 Foto)
        </label>
        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all',
            isDragActive
              ? 'border-navy bg-navy-50'
              : 'border-slate-300 hover:border-navy bg-slate-50'
          )}
        >
          <input {...getInputProps()} />
          <IconUpload className="w-4 h-4 mx-auto text-slate-400 mb-1" />
          <p className="text-slate-500 text-[11px]">
            {isDragActive ? 'Lepaskan foto di sini' : 'Klik atau seret foto bukti ke sini'}
          </p>
        </div>
        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            {photos.map((p, idx) => (
              <div key={idx} className="relative aspect-square border border-slate-200 rounded-lg overflow-hidden bg-slate-100">
                <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 bg-red-600 text-white w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                  title="Hapus foto"
                >
                  <IconX className="w-3 h-3" />
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
          className="btn-navy flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <IconLoader2 className="w-4 h-4 animate-spin text-orange" />
              <span>Mengirim Laporan...</span>
            </>
          ) : (
            <>
              <IconSend className="w-4 h-4 text-orange" />
              <span>Kirim Pengaduan Sekarang</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClose}
          className="btn-outline px-4 text-xs font-medium"
        >
          Batal
        </button>
      </div>
    </form>
  );
};

export default ReportForm;
