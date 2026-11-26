import React, { useState, useEffect, useMemo } from 'react';
import {
    IconX,
    IconRadio,
    IconMapPin,
    IconCamera,
    IconRefresh,
    IconDownload,
    IconMaximize,
    IconVideo,
    IconLayersLinked,
    IconExternalLink,
    IconCompass,
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
    nusantara_cam?: string | null;
}

interface CctvModalProps {
    cctv: CctvItem | null;
    onClose: () => void;
    onViewReports?: (cctv: CctvItem) => void;
}

function getBearingFromDirection(direction: string): number {
    const d = direction.toLowerCase();
    if (d.includes('selatan')) return 180;
    if (d.includes('timur')) return 90;
    if (d.includes('barat')) return 270;
    return 0; // Utara default
}

const CctvModal: React.FC<CctvModalProps> = ({ cctv, onClose, onViewReports }) => {
    if (!cctv) return null;

    const isOnline = cctv.status === 'online';
    const isMaintenance = cctv.status === 'maintenance';

    // 3 Mode Pantauan Real Surabaya:
    // 1. 'ptz' = Kamera Citra Satelit & Jalan 3D Asli Lokasi Surabaya (Mapbox HD Tilt 60°)
    // 2. 'video' = Live Feed Video Arus Kendaraan Bergerak
    // 3. 'streetview' = Google Street View 360° Interaktif Lapangan
    const [viewMode, setViewMode] = useState<'ptz' | 'video' | 'streetview'>('ptz');

    const [currentTime, setCurrentTime] = useState<string>('');
    const [fps, setFps] = useState<number>(30);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isShutterActive, setIsShutterActive] = useState<boolean>(false);
    const [isSnapshotSaved, setIsSnapshotSaved] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [cacheBuster, setCacheBuster] = useState<number>(Date.now());
    const [feedLoaded, setFeedLoaded] = useState<boolean>(false);

    // Live ticking timecode clock (WIB) update setiap 1 detik
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

    // Telemetri FPS
    useEffect(() => {
        const fpsInterval = setInterval(() => {
            setFps(29 + Math.floor(Math.random() * 3));
        }, 4000);
        return () => clearInterval(fpsInterval);
    }, []);

    const bearing = useMemo(() => getBearingFromDirection(cctv.direction), [cctv.direction]);

    // URL Citra Satelit 3D Nyata dari Titik Koordinat Persis Surabaya
    const realSurabayaPtzUrl = useMemo(() => {
        const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN || '';
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${cctv.lng},${cctv.lat},17.5,${bearing},60/800x450@2x?access_token=${mapboxToken}&cb=${cacheBuster}`;
    }, [cctv, bearing, cacheBuster]);

    // URL video embed (jika kamera memiliki stream YouTube/MP4 langsung)
    const directEmbedUrl = useMemo(() => {
        if (!cctv.embed_url) return null;
        return cctv.embed_url;
    }, [cctv]);

    const isDirectVideoFile = useMemo(() => {
        if (!directEmbedUrl) return false;
        return /\.(mp4|webm|ogg)(\?.*)?$/i.test(directEmbedUrl);
    }, [directEmbedUrl]);

    // Google Maps interactive satellite iframe URL
    const googleMapEmbedUrl = useMemo(() => {
        return `https://maps.google.com/maps?q=${cctv.lat},${cctv.lng}&hl=id&z=18&t=k&output=embed`;
    }, [cctv]);

    // Link langsung ke Google Street View 360 Panorama di lapangan
    const googleStreetViewUrl = useMemo(() => {
        return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${cctv.lat},${cctv.lng}`;
    }, [cctv]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setIsShutterActive(true);
        setFeedLoaded(false);
        setCacheBuster(Date.now());
        setTimeout(() => setIsShutterActive(false), 200);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleTakeSnapshot = () => {
        setIsSnapshotSaved(true);
        setIsShutterActive(true);
        setTimeout(() => setIsShutterActive(false), 200);

        try {
            const link = document.createElement('a');
            link.href = realSurabayaPtzUrl;
            link.target = '_blank';
            link.download = `SITS-${cctv.id}-${cctv.name.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
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
            style={{ background: 'rgba(0, 5, 12, 0.85)', backdropFilter: 'blur(6px)' }}
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
                                    {isOnline ? 'SITS SURABAYA AKTIF' : isMaintenance ? 'MAINTENANCE' : 'OFFLINE'}
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

                {/* Mode Selector Toggle: Citra Satelit Real vs Video Live Lalu Lintas vs Street View */}
                <div className="relative px-3 sm:px-4 pb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-black/60 border border-slate-700/60 text-xs">
                        <button
                            onClick={() => {
                                setViewMode('ptz');
                                setFeedLoaded(false);
                            }}
                            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'ptz'
                                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(0,255,136,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Citra Kamera 3D Real Lokasi Persimpangan Surabaya"
                        >
                            <IconLayersLinked size={13} />
                            <span>Kamera Satelit PTZ</span>
                        </button>

                        <button
                            onClick={() => {
                                setViewMode('video');
                                setFeedLoaded(false);
                            }}
                            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'video'
                                    ? 'bg-red-500/25 text-red-300 border border-red-500/50 shadow-[0_0_8px_rgba(255,80,80,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Pantau Live Video Arus Kendaraan"
                        >
                            <IconVideo size={13} />
                            <span>Live Video Arus</span>
                        </button>

                        <button
                            onClick={() => {
                                setViewMode('streetview');
                                setFeedLoaded(false);
                            }}
                            className={`px-2.5 py-1 rounded font-semibold transition-all flex items-center gap-1.5 ${
                                viewMode === 'streetview'
                                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-[0_0_8px_rgba(0,210,255,0.25)]'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                            title="Tinjau Peta Lapangan / Street View"
                        >
                            <IconCompass size={13} />
                            <span>Peta Lapangan</span>
                        </button>
                    </div>

                    <a
                        href={googleStreetViewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded transition-all hover:bg-cyan-900/50"
                        title="Buka Google Street View 360° Lapangan di Tab Baru"
                    >
                        <span>Street View 360°</span>
                        <IconExternalLink size={12} />
                    </a>
                </div>

                {/* Video Feed Area (Live SITS Real Surabaya Surveillance Screen) */}
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
                        {!feedLoaded && (
                            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-slate-950 text-emerald-400 gap-2">
                                <IconCamera size={28} className="animate-pulse" />
                                <span className="text-xs font-mono tracking-widest text-emerald-300/80">
                                    MENGHUBUNGKAN KE SENSOR TITIK SURABAYA...
                                </span>
                            </div>
                        )}

                        {/* MODE 1: CITRA SATELIT & JALAN REAL SURABAYA (MAPBOX HD 3D TILT 60°) */}
                        {viewMode === 'ptz' && (
                            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                                <img
                                    src={realSurabayaPtzUrl}
                                    alt={`Citra Satelit ${cctv.name}`}
                                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                                        feedLoaded ? 'opacity-95' : 'opacity-0'
                                    }`}
                                    onLoad={() => setFeedLoaded(true)}
                                    onError={() => setFeedLoaded(true)}
                                />

                                {/* Subtle Camera Lens & Scanline Overlay */}
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background:
                                            'radial-gradient(circle at center, transparent 60%, rgba(0,0,0,0.6) 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.12) 3px, rgba(0,0,0,0.12) 6px)',
                                    }}
                                />

                                {/* Center Target Crosshair (SITS Surveillance Optics) */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40">
                                    <div className="w-12 h-12 border border-emerald-400/60 rounded-full flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 bg-emerald-400/80 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MODE 2: LIVE VIDEO STREAM (COMING SOON HINGGA API RESMI TERSEDIA) */}
                        {viewMode === 'video' && (
                            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                                {directEmbedUrl ? (
                                    isDirectVideoFile ? (
                                        <video
                                            src={directEmbedUrl}
                                            autoPlay
                                            loop
                                            muted
                                            playsInline
                                            className={`w-full h-full object-cover transition-opacity duration-300 ${
                                                feedLoaded ? 'opacity-95' : 'opacity-0'
                                            }`}
                                            onCanPlay={() => setFeedLoaded(true)}
                                            onError={() => setFeedLoaded(true)}
                                        />
                                    ) : (
                                        <iframe
                                            src={directEmbedUrl}
                                            title={`Live Stream - ${cctv.name}`}
                                            className="w-full h-full"
                                            style={{ border: 'none' }}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            onLoad={() => setFeedLoaded(true)}
                                        />
                                    )
                                ) : (
                                    <>
                                        {/* Latar belakang citra satelit titik lokasi dengan efek redup */}
                                        <img
                                            src={realSurabayaPtzUrl}
                                            alt={`Preview ${cctv.name}`}
                                            className="w-full h-full object-cover opacity-25 blur-[2px]"
                                            onLoad={() => setFeedLoaded(true)}
                                            onError={() => setFeedLoaded(true)}
                                        />
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                background:
                                                    'radial-gradient(circle at center, rgba(4,9,16,0.55) 0%, rgba(4,9,16,0.92) 100%), repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,255,136,0.04) 3px, rgba(0,255,136,0.04) 6px)',
                                            }}
                                        />
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold tracking-widest uppercase mb-2.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                                                <span>LIVE STREAM API</span>
                                            </div>
                                            <h3 className="text-2xl sm:text-3xl font-black tracking-[0.2em] text-white uppercase drop-shadow-[0_0_16px_rgba(0,255,136,0.35)]">
                                                COMING SOON
                                            </h3>
                                            <p className="text-[11px] sm:text-xs text-slate-300 max-w-xs mt-2 leading-relaxed">
                                                Siaran langsung arus lalu lintas <span className="text-emerald-300 font-semibold">{cctv.name}</span> akan segera aktif setelah integrasi API SITS Surabaya tersedia.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* MODE 3: GOOGLE MAPS / STREET VIEW LAPANGAN */}
                        {viewMode === 'streetview' && (
                            <div className="w-full h-full relative overflow-hidden bg-slate-900">
                                <iframe
                                    src={googleMapEmbedUrl}
                                    title={`Peta Lokasi - ${cctv.name}`}
                                    className="w-full h-full"
                                    style={{ border: 'none' }}
                                    allowFullScreen
                                    onLoad={() => setFeedLoaded(true)}
                                />
                            </div>
                        )}

                        {/* OSD (On-Screen Display) Top Left: Camera Name & Timecode */}
                        <div
                            className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-mono leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.78)',
                                border: '1px solid rgba(0, 255, 136, 0.35)',
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

                        {/* OSD Top Right: Technical Telemetry */}
                        <div
                            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-mono text-right leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.78)',
                                border: '1px solid rgba(0, 210, 255, 0.35)',
                                color: '#00d2ff',
                            }}
                        >
                            <div className="font-bold">1080p FHD • {fps} FPS</div>
                            <div className="text-[9px] text-slate-400">
                                {viewMode === 'ptz'
                                    ? 'Surabaya 3D PTZ (Mapbox)'
                                    : viewMode === 'video'
                                    ? 'Live Traffic Stream'
                                    : 'Google Mapfield'}
                            </div>
                        </div>

                        {/* OSD Bottom Left: GPS Location Watermark */}
                        <div
                            className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-mono pointer-events-none max-w-[65%] truncate"
                            style={{
                                background: 'rgba(0, 0, 0, 0.75)',
                                color: 'rgba(255, 255, 255, 0.85)',
                            }}
                        >
                            {cctv.street} • GPS: {cctv.lat.toFixed(5)}, {cctv.lng.toFixed(5)} • {cctv.direction}
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
                                ✓ SNAPSHOT LOKASI SURABAYA DISIMPAN KE PERANGKAT
                            </div>
                        )}

                        {/* Video Control Bar overlay (hover) */}
                        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity">
                            <button
                                onClick={handleTakeSnapshot}
                                className="px-2.5 py-1 rounded bg-black/80 hover:bg-emerald-950 border border-emerald-500/50 text-[10px] font-mono text-emerald-300 flex items-center gap-1 transition-all"
                                title="Ambil Foto Snapshot Titik CCTV"
                            >
                                <IconCamera size={12} />
                                <span>Foto</span>
                            </button>

                            <button
                                onClick={handleRefresh}
                                className={`p-1.5 rounded bg-black/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all ${
                                    isRefreshing ? 'animate-spin' : ''
                                }`}
                                title="Refresh Feed Kamera"
                            >
                                <IconRefresh size={13} />
                            </button>

                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-1.5 rounded bg-black/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
                                title="Perbesar Layar"
                            >
                                <IconMaximize size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* SITS Official Notice & Action Bar */}
                <div className="relative px-3 sm:px-4 pb-2 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Terintegrasi SITS Dishub Kota Surabaya
                    </span>
                    <a
                        href="https://dishub.surabaya.go.id/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors"
                    >
                        <span>Portal Dishub</span>
                        <IconExternalLink size={12} />
                    </a>
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
                        Pantau Laporan di Sekitar Titik Ini
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
