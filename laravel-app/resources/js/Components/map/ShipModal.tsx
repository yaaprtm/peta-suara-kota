import React from 'react';
import {
    IconX,
    IconNavigation,
    IconCompass,
    IconAnchor,
    IconGauge,
    IconFlag,
    IconRadio,
} from '@tabler/icons-react';

export interface ShipItem {
    id: string;
    name: string;
    callsign: string;
    mmsi: string;
    type: 'ferry' | 'container' | 'passenger' | 'tugboat' | 'patrol' | 'naval' | 'tanker';
    status: 'underway' | 'moored' | 'anchored';
    speedKnots: number;
    courseDeg: number;
    lat: number;
    lng: number;
    destination: string;
    flag: string;
    dwtTons: number;
    lengthM: number;
    terminal: string;
    lastAisPing: string;
}

interface ShipModalProps {
    ship: ShipItem | null;
    onClose: () => void;
    onFocusShip?: (ship: ShipItem) => void;
}

const ShipModal: React.FC<ShipModalProps> = ({ ship, onClose, onFocusShip }) => {
    if (!ship) return null;

    const isUnderway = ship.status === 'underway';
    const isMoored = ship.status === 'moored';

    const statusLabel = isUnderway ? 'BERLAYAR (UNDERWAY)' : isMoored ? 'SANDAR (MOORED)' : 'LABUH JANGKAR (ANCHORED)';
    const statusColor = isUnderway ? '#00ffaa' : isMoored ? '#38bdf8' : '#f59e0b';
    const speedKmh = (ship.speedKnots * 1.852).toFixed(1);

    const typeLabel =
        ship.type === 'ferry'
            ? 'KAPAL FERRY RO-RO'
            : ship.type === 'container'
            ? 'KAPAL PETIKEMAS'
            : ship.type === 'passenger'
            ? 'KAPAL PENUMPANG PELNI'
            : ship.type === 'naval'
            ? 'KAPAL PERANG TNI AL'
            : ship.type === 'patrol'
            ? 'KAPAL PATROLI POLAIRUD / KPLP'
            : ship.type === 'tugboat'
            ? 'KAPAL TUNDA (TUGBOAT)'
            : 'KAPAL TANKER MINYAK';

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 select-none"
            style={{ background: 'rgba(2, 10, 18, 0.75)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #05141c 0%, #0a222e 50%, #05141c 100%)',
                    border: '1px solid rgba(0, 255, 170, 0.35)',
                    boxShadow: '0 0 45px rgba(0, 255, 170, 0.16), 0 25px 50px rgba(0,0,0,0.85)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                {/* Radar circular grid sweep background */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at center, rgba(0, 255, 170, 0.05) 0, rgba(0, 255, 170, 0.05) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        zIndex: 0,
                    }}
                />

                {/* Header */}
                <div
                    className="relative flex items-start justify-between p-4"
                    style={{
                        borderBottom: '1px solid rgba(0, 255, 170, 0.2)',
                        background: 'rgba(0, 255, 170, 0.05)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                                background: 'rgba(0, 255, 170, 0.15)',
                                border: '1px solid rgba(0, 255, 170, 0.4)',
                                boxShadow: '0 0 14px rgba(0, 255, 170, 0.25)',
                            }}
                        >
                            <IconNavigation
                                size={20}
                                style={{
                                    color: '#00ffaa',
                                    transform: `rotate(${ship.courseDeg}deg)`,
                                    transition: 'transform 0.4s ease',
                                }}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm"
                                    style={{
                                        background: 'rgba(0, 255, 170, 0.15)',
                                        color: '#00ffaa',
                                        border: '1px solid rgba(0, 255, 170, 0.3)',
                                    }}
                                >
                                    {typeLabel}
                                </span>
                                <span
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider"
                                    style={{
                                        background: `${statusColor}20`,
                                        color: statusColor,
                                        border: `1px solid ${statusColor}50`,
                                    }}
                                >
                                    {statusLabel}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-slate-100 leading-snug">
                                {ship.name}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {ship.terminal}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <IconX size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="relative p-4 space-y-3.5">
                    {/* Destination Banner */}
                    <div
                        className="rounded-xl p-3 flex items-center justify-between"
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(0, 255, 170, 0.2)',
                        }}
                    >
                        <div>
                            <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                <IconFlag size={12} />
                                <span>Tujuan / Rute Pelayaran</span>
                            </div>
                            <p className="text-sm font-bold text-slate-100">
                                {ship.destination}
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-mono text-slate-400 block">AIS Ping</span>
                            <span className="text-xs font-mono font-bold text-emerald-300">
                                {ship.lastAisPing}
                            </span>
                        </div>
                    </div>

                    {/* Navigation Telemetry (Speed & Heading) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                                <IconGauge size={13} />
                                <span>Kecepatan (SOG)</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-white">
                                    {ship.speedKnots}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    knot ({speedKmh} km/h)
                                </span>
                            </div>
                        </div>

                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                                <IconCompass size={13} />
                                <span>Arah / Haluan (COG)</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-2xl font-bold font-mono text-white">
                                    {ship.courseDeg}°
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    derajat busur
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vessel Specifications */}
                    <div
                        className="grid grid-cols-3 gap-2 p-3 rounded-xl text-center"
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                    >
                        <div>
                            <span className="text-[10px] text-slate-400 block font-mono">CALLSIGN</span>
                            <span className="text-xs font-mono font-bold text-slate-200">{ship.callsign}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 block font-mono">MMSI</span>
                            <span className="text-xs font-mono font-bold text-slate-200">{ship.mmsi}</span>
                        </div>
                        <div>
                            <span className="text-[10px] text-slate-400 block font-mono">PANJANG / DWT</span>
                            <span className="text-xs font-mono font-bold text-slate-200">
                                {ship.lengthM}m / {ship.dwtTons}T
                            </span>
                        </div>
                    </div>

                    {/* AIS Class & Coordinates */}
                    <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
                        style={{
                            background: 'rgba(0, 255, 170, 0.05)',
                            border: '1px solid rgba(0, 255, 170, 0.15)',
                            color: 'rgba(0, 255, 170, 0.75)',
                        }}
                    >
                        <div className="flex items-center gap-1.5">
                            <IconRadio size={12} className="animate-pulse" />
                            <span>AIS CLASS-A TRANSCEIVER</span>
                        </div>
                        <span>{ship.lat.toFixed(5)}, {ship.lng.toFixed(5)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative flex items-center justify-between p-4 pt-0 gap-2">
                    <button
                        onClick={() => onFocusShip && onFocusShip(ship)}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200"
                        style={{
                            background: 'rgba(0, 255, 170, 0.15)',
                            color: '#00ffaa',
                            border: '1px solid rgba(0, 255, 170, 0.4)',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 255, 170, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 255, 170, 0.15)';
                        }}
                    >
                        ⚓ Fokus Posisi Kapal di Selat Madura
                    </button>
                    <button
                        onClick={onClose}
                        className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all"
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                        }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShipModal;
