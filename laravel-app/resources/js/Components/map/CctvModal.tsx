import React from 'react';
import { X, Radio, MapPin, Camera, AlertCircle } from 'lucide-react';

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

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #0d1117 0%, #161b22 50%, #0d1117 100%)',
                    border: '1px solid rgba(0, 255, 136, 0.25)',
                    boxShadow: '0 0 40px rgba(0, 255, 136, 0.15), 0 25px 50px rgba(0,0,0,0.8)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                {/* Header scanline effect */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,136,0.015) 2px, rgba(0,255,136,0.015) 4px)',
                        zIndex: 0,
                    }}
                />

                {/* Header */}
                <div
                    className="relative flex items-start justify-between p-4"
                    style={{
                        borderBottom: '1px solid rgba(0, 255, 136, 0.2)',
                        background: 'rgba(0, 255, 136, 0.05)',
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
                                    border: `1px solid ${isOnline ? 'rgba(0,255,136,0.5)' : isMaintenance ? 'rgba(255,165,0,0.5)' : 'rgba(255,80,80,0.5)'}`,
                                }}
                            >
                                <Camera
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
                                    className="text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                                    style={{
                                        background: isOnline
                                            ? 'rgba(0,255,136,0.2)'
                                            : isMaintenance
                                            ? 'rgba(255,165,0,0.2)'
                                            : 'rgba(255,80,80,0.2)',
                                        color: isOnline ? '#00ff88' : isMaintenance ? '#ffa500' : '#ff5050',
                                        border: `1px solid ${isOnline ? 'rgba(0,255,136,0.4)' : isMaintenance ? 'rgba(255,165,0,0.4)' : 'rgba(255,80,80,0.4)'}`,
                                    }}
                                >
                                    {isOnline ? '● LIVE' : isMaintenance ? '◐ MAINTENANCE' : '○ OFFLINE'}
                                </span>
                                <span
                                    className="text-xs font-mono"
                                    style={{ color: 'rgba(0,255,136,0.5)' }}
                                >
                                    {cctv.id.toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-base font-bold" style={{ color: '#e6edf3', lineHeight: 1.3 }}>
                                {cctv.name}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-red-500/20"
                        style={{ color: 'rgba(230,237,243,0.5)', border: '1px solid rgba(230,237,243,0.1)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Info Grid */}
                <div className="relative p-4 grid grid-cols-2 gap-3">
                    <InfoCard
                        icon={<MapPin size={14} />}
                        label="Lokasi Jalan"
                        value={cctv.street}
                        color="rgba(0,255,136,0.7)"
                    />
                    <InfoCard
                        icon={<MapPin size={14} />}
                        label="Kecamatan"
                        value={cctv.district}
                        color="rgba(0,200,255,0.7)"
                    />
                    <InfoCard
                        icon={<Radio size={14} />}
                        label="Arah Pantau"
                        value={cctv.direction}
                        color="rgba(255,200,0,0.7)"
                        colSpan
                    />
                </div>

                {/* Video Feed Area */}
                <div className="relative px-4 pb-4">
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{
                            border: '1px solid rgba(0,255,136,0.2)',
                            background: '#000',
                            aspectRatio: '16/9',
                            position: 'relative',
                        }}
                    >
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
                            /* Static Noise Placeholder */
                            <div
                                className="w-full h-full flex flex-col items-center justify-center gap-3"
                                style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)' }}
                            >
                                {/* CRT Static Effect */}
                                <div className="relative">
                                    <div
                                        className="w-16 h-16 rounded-full flex items-center justify-center"
                                        style={{
                                            background: 'rgba(0,255,136,0.08)',
                                            border: '2px solid rgba(0,255,136,0.2)',
                                        }}
                                    >
                                        <Camera size={28} style={{ color: 'rgba(0,255,136,0.4)' }} />
                                    </div>
                                    <div
                                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                                        style={{ background: 'rgba(255,80,80,0.2)', border: '1px solid rgba(255,80,80,0.4)' }}
                                    >
                                        <AlertCircle size={12} style={{ color: '#ff5050' }} />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(0,255,136,0.6)' }}>
                                        FEED TIDAK TERSEDIA
                                    </p>
                                    <p className="text-xs" style={{ color: 'rgba(230,237,243,0.3)', maxWidth: '240px', lineHeight: 1.5 }}>
                                        Stream kamera ini bersifat intranet Pemkot Surabaya dan tidak tersedia untuk akses publik
                                    </p>
                                </div>
                                {/* Coordinate display */}
                                <div
                                    className="font-mono text-xs px-3 py-1.5 rounded"
                                    style={{
                                        background: 'rgba(0,255,136,0.08)',
                                        color: 'rgba(0,255,136,0.5)',
                                        border: '1px solid rgba(0,255,136,0.15)',
                                    }}
                                >
                                    {cctv.lat.toFixed(6)}, {cctv.lng.toFixed(6)}
                                </div>
                            </div>
                        )}

                        {/* Live indicator overlay (top-left) */}
                        {isOnline && cctv.embed_url && (
                            <div
                                className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-bold"
                                style={{
                                    background: 'rgba(0,0,0,0.75)',
                                    color: '#ff4444',
                                    border: '1px solid rgba(255,68,68,0.4)',
                                    backdropFilter: 'blur(4px)',
                                }}
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: '#ff4444', boxShadow: '0 0 6px #ff4444', animation: 'pulse 1s infinite' }}
                                />
                                LIVE
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div
                    className="relative flex items-center justify-between px-4 pb-4 gap-2"
                >
                    <button
                        onClick={() => onViewReports && onViewReports(cctv)}
                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
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
                        className="py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200"
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
        className={`rounded-xl p-3 ${colSpan ? 'col-span-2' : ''}`}
        style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
        }}
    >
        <div className="flex items-center gap-1.5 mb-1" style={{ color }}>
            {icon}
            <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <p className="text-sm font-medium" style={{ color: '#e6edf3' }}>
            {value}
        </p>
    </div>
);

export default CctvModal;
