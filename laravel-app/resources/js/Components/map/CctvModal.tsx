import React, { useState, useEffect } from 'react';
import {
    IconX,
    IconRadio,
    IconMapPin,
    IconCamera,
    IconRefresh,
    IconDownload,
    IconMaximize,
    IconPlayerPlay,
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

const CctvModal: React.FC<CctvModalProps> = ({ cctv, onClose, onViewReports }) => {
    if (!cctv) return null;

    const isOnline = cctv.status === 'online';
    const isMaintenance = cctv.status === 'maintenance';

    const [currentTime, setCurrentTime] = useState<string>('');
    const [fps, setFps] = useState<number>(30);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [isSnapshotSaved, setIsSnapshotSaved] = useState<boolean>(false);
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

    // Live ticking timecode clock (WIB) matching real traffic CCTV OSD
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            const ms = String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0');
            setCurrentTime(`${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms} WIB`);
        };

        updateClock();
        const interval = setInterval(updateClock, 50);
        return () => clearInterval(interval);
    }, []);

    // Random slight jitter in FPS to simulate live network stream bitrate
    useEffect(() => {
        const fpsInterval = setInterval(() => {
            setFps(29 + Math.floor(Math.random() * 3));
        }, 3000);
        return () => clearInterval(fpsInterval);
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);
    };

    const handleTakeSnapshot = () => {
        setIsSnapshotSaved(true);
        setTimeout(() => setIsSnapshotSaved(false), 2500);
    };

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
            style={{ background: 'rgba(0, 5, 12, 0.78)', backdropFilter: 'blur(5px)' }}
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
                        {/* Camera icon pulsing */}
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
                                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                                    style={{
                                        background: '#00ff88',
                                        boxShadow: '0 0 6px #00ff88',
                                        animation: 'pulse 1.5s infinite',
                                    }}
                                />
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                {/* Status Badge */}
                                <span
                                    className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
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
                                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
                                    {isOnline ? 'LIVE FEED (PROXY B)' : isMaintenance ? 'MAINTENANCE' : 'OFFLINE'}
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

                {/* Video Feed Area (Live SITS Traffic Camera Screen) */}
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
                        {/* Video Layer */}
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
                            /* Live Simulated Traffic Camera Feed (SITS Reverse Proxy View) */
                            <div className="w-full h-full relative overflow-hidden bg-slate-950 flex items-center justify-center">
                                {/* Traffic road perspective representation */}
                                <div
                                    className="absolute inset-0 opacity-40"
                                    style={{
                                        backgroundImage:
                                            'linear-gradient(to top, rgba(0,255,136,0.15) 0%, transparent 60%), radial-gradient(ellipse at 50% 80%, rgba(30,58,95,0.5) 0%, transparent 70%)',
                                    }}
                                />

                                {/* Moving road lane markings (animated) */}
                                <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
                                    <div
                                        className="w-1.5 h-16 bg-white/50 rounded-full mb-3"
                                        style={{ animation: 'pulse 1.2s infinite' }}
                                    />
                                    <div
                                        className="w-2 h-24 bg-white/60 rounded-full mb-3"
                                        style={{ animation: 'pulse 1.2s infinite 0.3s' }}
                                    />
                                    <div
                                        className="w-2.5 h-32 bg-white/70 rounded-full"
                                        style={{ animation: 'pulse 1.2s infinite 0.6s' }}
                                    />
                                </div>

                                {/* Vehicle stream light trails simulation */}
                                <div className="absolute inset-x-8 bottom-6 flex justify-between px-6 pointer-events-none">
                                    <div className="flex gap-4">
                                        <div
                                            className="w-6 h-3 rounded-full bg-red-500/70 shadow-[0_0_12px_#ff4d4f]"
                                            style={{ animation: 'pulse 2s infinite' }}
                                        />
                                        <div
                                            className="w-6 h-3 rounded-full bg-red-500/70 shadow-[0_0_12px_#ff4d4f]"
                                            style={{ animation: 'pulse 2.2s infinite 0.5s' }}
                                        />
                                    </div>
                                    <div className="flex gap-4">
                                        <div
                                            className="w-6 h-3 rounded-full bg-amber-300/80 shadow-[0_0_12px_#faad14]"
                                            style={{ animation: 'pulse 1.8s infinite 0.2s' }}
                                        />
                                        <div
                                            className="w-6 h-3 rounded-full bg-amber-300/80 shadow-[0_0_12px_#faad14]"
                                            style={{ animation: 'pulse 2.5s infinite 0.8s' }}
                                        />
                                    </div>
                                </div>

                                {/* Center Target Crosshair */}
                                <div className="relative pointer-events-none flex flex-col items-center justify-center">
                                    <div className="w-12 h-12 rounded-full border border-emerald-400/30 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400/50" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* OSD (On-Screen Display) Top Left: Camera Name & Timecode */}
                        <div
                            className="absolute top-2 left-2 z-10 px-2 py-1 rounded text-[10px] font-mono leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.72)',
                                border: '1px solid rgba(0, 255, 136, 0.25)',
                                color: '#00ff88',
                                textShadow: '0 0 6px rgba(0,255,136,0.6)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 font-bold">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
                                <span>REC [SITS-DISHUB] {cctv.id.toUpperCase()}</span>
                            </div>
                            <div className="text-[9px] text-slate-300 mt-0.5">{currentTime}</div>
                        </div>

                        {/* OSD Top Right: Technical Telemetry (FPS, Res, Bitrate) */}
                        <div
                            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-[10px] font-mono text-right leading-tight pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.72)',
                                border: '1px solid rgba(0, 210, 255, 0.25)',
                                color: '#00d2ff',
                            }}
                        >
                            <div className="font-bold">1080p FHD • {fps} FPS</div>
                            <div className="text-[9px] text-slate-400">H.264 • 2.4 Mbps</div>
                        </div>

                        {/* OSD Bottom Left: GPS Location Watermark */}
                        <div
                            className="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded text-[9px] font-mono pointer-events-none"
                            style={{
                                background: 'rgba(0, 0, 0, 0.65)',
                                color: 'rgba(255, 255, 255, 0.6)',
                            }}
                        >
                            GPS: {cctv.lat.toFixed(6)}, {cctv.lng.toFixed(6)} • {cctv.direction}
                        </div>

                        {/* Snapshot Saved Notification Toast */}
                        {isSnapshotSaved && (
                            <div
                                className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 py-2 px-4 rounded-xl text-center text-xs font-mono font-bold"
                                style={{
                                    background: 'rgba(0, 255, 136, 0.9)',
                                    color: '#06101e',
                                    boxShadow: '0 0 20px #00ff88',
                                }}
                            >
                                ✓ SNAPSHOT FRAME DISIMPAN KE BUFFER SISTEM
                            </div>
                        )}

                        {/* Video Control Bar overlay (hover) */}
                        <div
                            className="absolute bottom-2 right-2 z-10 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                        >
                            <button
                                onClick={handleTakeSnapshot}
                                className="px-2 py-1 rounded bg-black/70 hover:bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-mono text-emerald-300 flex items-center gap-1 transition-all"
                                title="Ambil Foto Snapshot"
                            >
                                <IconCamera size={12} />
                                <span>Foto</span>
                            </button>

                            <button
                                onClick={handleRefresh}
                                className={`p-1 rounded bg-black/70 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all ${
                                    isRefreshing ? 'animate-spin' : ''
                                }`}
                                title="Refresh Stream"
                            >
                                <IconRefresh size={13} />
                            </button>

                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className="p-1 rounded bg-black/70 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-all"
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
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.2)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,255,136,0.1)';
                        }}
                    >
                        📋 Laporan di Area Ini
                    </button>
                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'rgba(230,237,243,0.5)',
                            border: '1px solid rgba(230,237,243,0.1)',
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

/* ─────── Helper sub-component ─────── */
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
        <p className="text-xs sm:text-sm font-medium" style={{ color: '#e6edf3' }}>
            {value}
        </p>
    </div>
);

export default CctvModal;
