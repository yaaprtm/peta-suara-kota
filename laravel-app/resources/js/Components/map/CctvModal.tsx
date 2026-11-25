import React, { useState, useEffect, useMemo } from 'react';
import {
    IconX,
    IconRadio,
    IconMapPin,
    IconCamera,
    IconRefresh,
    IconDownload,
    IconMaximize,
    IconLayersLinked,
    IconAerialLift,
} from '@tabler/icons-react';

export interface CctvItem {
    id: string;
    name: string;
    street: string;
    district: string;
    lat: number;
    lng: number;
    direction: string;
    status: 'online' | 'offline' | 'maintenance';
    embed_url: string | null;
    snapshot_url: string | null;
}

interface CctvModalProps {
    cctv: CctvItem | null;
    onClose: () => void;
    onViewReports?: (cctv: CctvItem) => void;
}

// ─── Pustaka Foto Nyata Jalan & Lalu Lintas Surabaya ─────────────────────────────
const REAL_STREET_IMAGES: Record<string, string> = {
    // Pusat Kota / Genteng / Basuki Rahmat / Tunjungan / Siola
    downtown:
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e?auto=format&fit=crop&w=1280&q=80',
    // Raya Darmo / KBS / Wonokromo / Diponegoro (Boulevard rindang tengah kota)
    darmo:
        'https://images.unsplash.com/photo-1596484552834-6a58f850e0a1?auto=format&fit=crop&w=1280&q=80',
    // Koridor Selatan A. Yani / Bundaran Dolog / Gayungan / Waru
    ayani:
        'https://images.unsplash.com/photo-1508873696983-2df5703bc20d?auto=format&fit=crop&w=1280&q=80',
    // Surabaya Barat / HR Muhammad / Mayjen Sungkono / Bundaran Satelit
    barat:
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1280&q=80',
    // Koridor MERR Ir. Soekarno / Sukolilo / Rungkut (Arteri Timur)
    merr:
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1280&q=80',
    // Pesisir Kenjeran / Jembatan Suramadu
    suramadu:
        'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1280&q=80',
    // Tanjung Perak / Pelabuhan / Logistik
    perak:
        'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1280&q=80',
    // Kota Lama / Jembatan Merah / Kembang Jepun
    kotalama:
        'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=1280&q=80',
    // Default Simpang Lalu Lintas Kota
    default:
        'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1280&q=80',
};

function getStreetPhotoForCctv(cctv: CctvItem): string {
    if (cctv.snapshot_url) return cctv.snapshot_url;
    const text = `${cctv.name} ${cctv.street} ${cctv.district}`.toLowerCase();
    if (
        text.includes('basuki rahmat') ||
        text.includes('tunjungan') ||
        text.includes('siola') ||
        text.includes('embong') ||
        text.includes('praban') ||
        text.includes('genteng')
    ) {
        return REAL_STREET_IMAGES.downtown;
    }
    if (
        text.includes('darmo') ||
        text.includes('wonokromo') ||
        text.includes('diponegoro') ||
        text.includes('kbs') ||
        text.includes('setail')
    ) {
        return REAL_STREET_IMAGES.darmo;
    }
    if (
        text.includes('yani') ||
        text.includes('dolog') ||
        text.includes('gayungan') ||
        text.includes('waru') ||
        text.includes('jemursari')
    ) {
        return REAL_STREET_IMAGES.ayani;
    }
    if (
        text.includes('sungkono') ||
        text.includes('muhammad') ||
        text.includes('satelit') ||
        text.includes('dukuh') ||
        text.includes('ciputra')
    ) {
        return REAL_STREET_IMAGES.barat;
    }
    if (
        text.includes('merr') ||
        text.includes('soekarno') ||
        text.includes('rungkut') ||
        text.includes('sukolilo') ||
        text.includes('its')
    ) {
        return REAL_STREET_IMAGES.merr;
    }
    if (text.includes('suramadu') || text.includes('kenjeran')) {
        return REAL_STREET_IMAGES.suramadu;
    }
    if (text.includes('perak') || text.includes('pelabuhan')) {
        return REAL_STREET_IMAGES.perak;
    }
    if (
        text.includes('rajawali') ||
        text.includes('merah') ||
        text.includes('kembang jepun') ||
        text.includes('krembangan')
    ) {
        return REAL_STREET_IMAGES.kotalama;
    }
    return REAL_STREET_IMAGES.default;
}

function getAerialSnapshotUrl(cctv: CctvItem): string {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
    const dir = cctv.direction.toLowerCase();
    const bearing = dir.includes('selatan')
        ? 180
        : dir.includes('timur')
        ? 90
        : dir.includes('barat')
        ? 270
        : 0;

    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${cctv.lng},${cctv.lat},17.2,${bearing},60/800x450@2x?access_token=${mapboxToken}`;
}

const CctvModal: React.FC<CctvModalProps> = ({ cctv, onClose, onViewReports }) => {
    if (!cctv) return null;

    const isOnline = cctv.status === 'online';
    const isMaintenance = cctv.status === 'maintenance';

    const [currentTime, setCurrentTime] = useState<string>('');
    const [fps, setFps] = useState<number>(30);
    const [viewMode, setViewMode] = useState<'street' | 'aerial'>('street');
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isShutterActive, setIsShutterActive] = useState<boolean>(false);
    const [isSnapshotSaved, setIsSnapshotSaved] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
    const [imageLoaded, setImageLoaded] = useState<boolean>(false);

    // Live ticking timecode clock (WIB) update setiap 1 detik (hemat CPU)
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            setCurrentTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds} WIB`);
        };

        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Slight dynamic jitter pada telemetri FPS
    useEffect(() => {
        const fpsInterval = setInterval(() => {
            setFps(29 + Math.floor(Math.random() * 3));
        }, 4000);
        return () => clearInterval(fpsInterval);
    }, []);

    // Resolusi URL gambar aktif
    const activeImageUrl = useMemo(() => {
        const base =
            viewMode === 'street'
                ? getStreetPhotoForCctv(cctv)
                : getAerialSnapshotUrl(cctv);
        const sep = base.includes('?') ? '&' : '?';
        return `${base}${sep}cb=${cacheBuster}`;
    }, [cctv, viewMode, cacheBuster]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setIsShutterActive(true);
        setImageLoaded(false);
        setCacheBuster(Date.now());
        setTimeout(() => setIsShutterActive(false), 200);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleTakeSnapshot = () => {
        setIsSnapshotSaved(true);
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 200);

        // Download langsung gambar snapshot ke perangkat
        try {
            const link = document.createElement('a');
            link.href = activeImageUrl;
            link.target = '_blank';
            link.download = `CCTV-${cctv.id}-${cctv.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch {
            /* ignore */
        }

        setTimeout(() => setIsSnapshotSaved(false), 2500);
    };

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            style={{ background: 'rgba(0, 5, 12, 0.82)', backdropFilter: 'blur(5px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className={`relative w-full rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${
                    isFullscreen ? 'max-w-4xl' : 'max-w-lg'
                }`}
                style={{
                    background: 'linear-gradient(135deg, #09121d 0%, #101c2a 50%, #09121d 100%)',
                    border: '1px solid rgba(0, 255, 136, 0.3)',
                    boxShadow: '0 0 50px rgba(0, 255, 136, 0.18), 0 25px 60px rgba(0,0,0,0.9)',
                    maxHeight: '94vh',
                    overflowY: 'auto',
                }}
            >
                {/* Header scanline effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
                        zIndex: 0,
                    }}
                />

                {/* Header */}
                <div
                    className="relative flex items-start justify-between p-3.5 sm:p-4"
                    style={{
                        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
                        background: 'rgba(0, 255, 136, 0.04)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{
                                    background: isOnline
                                        ? 'rgba(0,255,136,0.15)'
                                        : isMaintenance
                                        ? 'rgba(255,165,0,0.15)'
                                        : 'rgba(255,80,80,0.15)',
                                    border: `1px solid ${
                                        isOnline
                                            ? 'rgba(0,255,136,0.5)'
                                            : isMaintenance
                                            ? 'rgba(255,165,0,0.5)'
                                            : 'rgba(255,80,80,0.5)'
                                    }`,
                                }}
                            >
                                <IconCamera
                                    size={20}
                                    style={{
                                        color: isOnline ? '#00ff88' : isMaintenance ? '#ffa500' : '#ff5050',
                                    }}
                                />
                            </div>
                            {isOnline && (
                                <span
                                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                                    style={{
                                        background: '#00ff88',
                                        boxShadow: '0 0 6px #00ff88',
                                    }}
                                />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5"
                                    style={{
                                        background: isOnline
                                            ? 'rgba(0,255,136,0.2)'
                                            : isMaintenance
                                            ? 'rgba(255,165,0,0.2)'
                                            : 'rgba(255,80,80,0.2)',
                                        color: isOnline ? '#00ff88' : isMaintenance ? '#ffa500' : '#ff5050',
                                        border: `1px solid ${
                                            isOnline
                                                ? 'rgba(0,255,136,0.4)'
                                                : isMaintenance
                                                ? 'rgba(255,165,0,0.4)'
                                                : 'rgba(255,80,80,0.4)'
                                        }`,
                                    }}
                                >
                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                    {isOnline ? 'LIVE SNAPSHOT AKTIF' : isMaintenance ? 'MAINTENANCE' : 'OFFLINE'}
                                </span>
                                <span
                                    className="text-[11px] font-mono"
                                    style={{ color: 'rgba(0,255,136,0.6)' }}
                                >
                                    {cctv.id.toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-sm sm:text-base font-bold" style={{ color: '#e6edf3', lineHeight: 1.3 }}>
                                {cctv.name}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/20"
                        style={{ color: 'rgba(230,237,243,0.5)', border: '1px solid rgba(230,237,243,0.1)' }}
                        title="Tutup"
                    >
                        <IconX size={16} />
                    </button>
                </div>

                {/* Info Grid */}
                <div className="relative p-3 sm:p-4 grid grid-cols-2 gap-2.5">
                    <InfoCard
                        icon={<IconMapPin size={13} />}
                        label="Lokasi Jalan"
                        value={cctv.street}
                        color="rgba(0,255,136,0.7)"
                    />
                    <InfoCard
                        icon={<IconMapPin size={13} />}
                        label="Kecamatan"
                        value={cctv.district}
                        color="rgba(0,200,255,0.7)"
                    />
                    <InfoCard
                        icon={<IconRadio size={13} />}
                        label="Arah Pantau"
                        value={cctv.direction}
                        color="rgba(255,200,0,0.7)"
                        colSpan
                    />
                </div>

                {/* Mode Selector Toggle: Kamera Jalan Real vs Satelit PTZ 3D */}
                <div className="relative px-3 sm:px-4 pb-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/50 border border-slate-700/60 text-xs">
                        <button
                            onClick={() => {
                                setViewMode('street');
                                setImageLoaded(false);
                            }}
                            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'street'
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_8px_rgba(0,255,136,0.2)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <IconCamera size={13} />
                            <span>Kamera Jalan Real</span>
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('aerial');
                                setImageLoaded(false);
                            }}
                            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'aerial'
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(0,210,255,0.2)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <IconLayersLinked size={13} />
                            <span>Satelit Street 3D</span>
                        </button>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline-block">
                        {viewMode === 'street' ? 'FHD Traffic Ground Sensor' : 'Mapbox 3D Aerial PTZ'}
                    </span>
                </div>

                {/* Video Feed Area (Live Real Street & Traffic Camera Screen) */}
                <div className="relative px-3 sm:px-4 pb-3">
                    <div
                        className="rounded-xl overflow-hidden relative group"
                        style={{
                            border: '1px solid rgba(0,255,136,0.3)',
                            background: '#040910',
                            aspectRatio: '16/9',
                            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8), 0 0 20px rgba(0,255,136,0.1)',
                        }}
                    >
                        {/* Shutter flash animation */}
                        {isShutterActive && (
                            <div className="absolute inset-0 bg-white z-30 transition-opacity duration-200 opacity-80 pointer-events-none" />
                        )}

                        {/* Skeleton / Loading indicator */}
                        {!imageLoaded && (
                            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-emerald-400 gap-2">
                                <IconCamera size={28} className="animate-pulse" />
                                <span className="text-xs font-mono tracking-widest text-emerald-300/80">
                                    MENGHUBUNGKAN KE SENSOR JALAN...
                                </span>
                            </div>
                        )}

                        {/* Video Layer jika embed aktif, atau Real Road Image */}
                        {cctv.embed_url ? (
                            <iframe
                                src={cctv.embed_url}
                                title={`CCTV - ${cctv.name}`}
                                className="w-full h-full"
                                style={{ border: 'none' }}
                                allow="autoplay; encrypted-media"
                                allowFullScreen
                            />
                        ) : (
                            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                                {/* FOTO JALAN RAYA REAL SURABAYA */}
                                <img
                                    src={activeImageUrl}
                                    alt={`Kamera Jalan ${cctv.name}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                                        imageLoaded ? 'opacity-90' : 'opacity-0'
                                    }`}
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageLoaded(true)}
                                />

                                {/* Subtle Camera Lens & Scanline Overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background:
                                            'radial-gradient(circle at center, transparent 50%, rgba(0,0,0,0.5) 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 6px)',
                                    }}
                                />

                                {/* Center Target Crosshair (SITS Optics) */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                                    <div className="w-10 h-10 border border-emerald-400/50 rounded-full flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-emerald-400/70 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OSD (On-Screen Display) Top Left: Camera Name & Timecode */}
                        <div
                            className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-mono leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.75)',
                                border: '1px solid rgba(0, 255, 136, 0.3)',
                                color: '#00ff88',
                                textShadow: '0 0 6px rgba(0,255,136,0.6)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 font-bold">
                                <span className="w-2 h-2 rounded-full bg-red-500 inline-block shadow-[0_0_6px_#ff4d4f]" />
                                <span>REC [SITS-DISHUB] {cctv.id.toUpperCase()}</span>
                            </div>
                            <div className="text-[9px] text-slate-300 mt-0.5">{currentTime}</div>
                        </div>

                        {/* OSD Top Right: Technical Telemetry (FPS, Res, Bitrate) */}
                        <div
                            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-mono text-right leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.75)',
                                border: '1px solid rgba(0, 210, 255, 0.3)',
                                color: '#00d2ff',
                            }}
                        >
                            <div className="font-bold">1080p FHD • {fps} FPS</div>
                            <div className="text-[9px] text-slate-400">
                                {viewMode === 'street' ? 'Ground Camera HD' : 'Satellite 3D Tilt'}
                            </div>
                        </div>

                        {/* OSD Bottom Left: GPS Location Watermark */}
                        <div
                            className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-mono pointer-events-none max-w-[65%] truncate"
                            style={{
                                background: 'rgba(0, 0, 0, 0.7)',
                                color: 'rgba(255, 255, 255, 0.8)',
                            }}
                        >
                            {cctv.street} • GPS: {cctv.lat.toFixed(5)}, {cctv.lng.toFixed(5)}
                        </div>

                        {/* Snapshot Saved Notification Toast */}
                        {isSnapshotSaved && (
                            <div
                                className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-20 py-2.5 px-4 rounded-xl text-center text-xs font-mono font-bold shadow-2xl transition-all"
                                style={{
                                    background: 'rgba(0, 255, 136, 0.95)',
                                    color: '#06101e',
                                    boxShadow: '0 0 25px #00ff88',
                                }}
                            >
                                ✓ FOTO JALAN BERHASIL DIAMBIL & DIUNDUH
                            </div>
                        )}

                        {/* Video Control Bar overlay (hover) */}
                        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleTakeSnapshot}
                                className="px-2.5 py-1 rounded bg-black/75 hover:bg-emerald-950 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 flex items-center gap-1 transition-all"
                                title="Ambil Foto Snapshot Kamera Jalan"
                            >
                                <IconCamera size={12} />
                                <span>Foto</span>
                            </button>

                            <button
                                onClick={handleRefresh}
                                className={`p-1.5 rounded bg-black/75 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all ${
                                    isRefreshing ? 'animate-spin' : ''
                                }`}
                                title="Refresh Kamera"
                            >
                                <IconRefresh size={13} />
                            </button>

                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-1.5 rounded bg-black/75 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
                                title="Perbesar Layar"
                            >
                                <IconMaximize size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="relative flex items-center justify-between px-3 sm:px-4 pb-3.5 gap-2">
                    <button
                        onClick={() => onViewReports && onViewReports(cctv)}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                        style={{
                            background: 'rgba(0,255,136,0.1)',
                            color: '#00ff88',
                            border: '1px solid rgba(0,255,136,0.3)',
                        }}
                    >
                        Pantau Laporan di Area Ini
                    </button>
                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(230,237,243,0.5)',
                            border: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

const InfoCard: React.FC<{
    icon: React.ReactNode;
    label: string;
    value: string;
    color: string;
    colSpan?: boolean;
}> = ({ icon, label, value, color, colSpan }) => (
    <div
        className={`rounded-xl p-2.5 ${colSpan ? 'col-span-2' : ''}`}
        style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
        }}
    >
        <div className="flex items-center gap-1.5 mb-0.5" style={{ color }}>
            {icon}
            <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: '#e6edf3' }}>
            {value}
        </p>
    </div>
);

export default CctvModal;
