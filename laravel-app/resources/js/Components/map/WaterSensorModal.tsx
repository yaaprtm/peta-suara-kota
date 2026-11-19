import React from 'react';
import { X, Droplets, Gauge, Activity, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export interface WaterPumpItem {
    id: string;
    name: string;
    district: string;
    street: string;
    lat: number;
    lng: number;
    type: 'rumah_pompa' | 'pintu_air' | 'bozem';
    status: 'normal' | 'waspada' | 'siaga';
    waterLevelCm: number;
    maxWaterLevelCm: number;
    activePumps: number;
    totalPumps: number;
    dischargeM3s: number;
    lastUpdated: string;
}

interface WaterSensorModalProps {
    pump: WaterPumpItem | null;
    onClose: () => void;
    onViewReports?: (pump: WaterPumpItem) => void;
}

const WaterSensorModal: React.FC<WaterSensorModalProps> = ({ pump, onClose, onViewReports }) => {
    if (!pump) return null;

    const percentage = Math.min(Math.round((pump.waterLevelCm / pump.maxWaterLevelCm) * 100), 100);
    const isNormal = pump.status === 'normal';
    const isWaspada = pump.status === 'waspada';
    const isSiaga = pump.status === 'siaga';

    const statusColor = isSiaga ? '#ff4d4f' : isWaspada ? '#faad14' : '#00d2ff';
    const statusBg = isSiaga ? 'rgba(255, 77, 79, 0.15)' : isWaspada ? 'rgba(250, 173, 20, 0.15)' : 'rgba(0, 210, 255, 0.15)';
    const statusBorder = isSiaga ? 'rgba(255, 77, 79, 0.4)' : isWaspada ? 'rgba(250, 173, 20, 0.4)' : 'rgba(0, 210, 255, 0.4)';

    const typeLabel =
        pump.type === 'pintu_air'
            ? 'PINTU AIR UTAMA'
            : pump.type === 'bozem'
            ? 'BOZEM PENAMPUNGAN'
            : 'RUMAH POMPA AIR';

    return (
        <div
            className="absolute inset-0 z-50 flex items-center justify-center p-4 select-none"
            style={{ background: 'rgba(0, 5, 15, 0.72)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
                style={{
                    background: 'linear-gradient(135deg, #06101e 0%, #0c1a2e 50%, #06101e 100%)',
                    border: '1px solid rgba(0, 210, 255, 0.35)',
                    boxShadow: '0 0 45px rgba(0, 210, 255, 0.18), 0 25px 50px rgba(0,0,0,0.85)',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                }}
            >
                {/* Tactical grid background overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(rgba(0, 210, 255, 0.08) 1px, transparent 1px)',
                        backgroundSize: '16px 16px',
                        zIndex: 0,
                    }}
                />

                {/* Header */}
                <div
                    className="relative flex items-start justify-between p-4"
                    style={{
                        borderBottom: '1px solid rgba(0, 210, 255, 0.2)',
                        background: 'rgba(0, 210, 255, 0.05)',
                    }}
                >
                    <div className="flex items-start gap-3">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                            style={{
                                background: statusBg,
                                border: `1px solid ${statusBorder}`,
                                boxShadow: `0 0 14px ${statusColor}40`,
                            }}
                        >
                            <Droplets size={20} style={{ color: statusColor }} />
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm"
                                    style={{
                                        background: 'rgba(0, 210, 255, 0.15)',
                                        color: '#00d2ff',
                                        border: '1px solid rgba(0, 210, 255, 0.3)',
                                    }}
                                >
                                    {typeLabel}
                                </span>
                                <span
                                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1"
                                    style={{
                                        background: statusBg,
                                        color: statusColor,
                                        border: `1px solid ${statusBorder}`,
                                    }}
                                >
                                    {isSiaga ? <ShieldAlert size={11} /> : isWaspada ? <AlertTriangle size={11} /> : <CheckCircle2 size={11} />}
                                    {pump.status.toUpperCase()}
                                </span>
                                <span className="text-xs font-mono text-cyan-400/50">
                                    {pump.id.toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-base font-bold text-slate-100 leading-snug">
                                {pump.name}
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Kec. {pump.district} • {pump.street}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all hover:bg-white/10"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body Content */}
                <div className="relative p-4 space-y-4">
                    {/* Water Level Gauge (TMA) */}
                    <div
                        className="rounded-xl p-3.5"
                        style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(0, 210, 255, 0.15)',
                        }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold uppercase tracking-wider">
                                <Gauge size={14} />
                                <span>Tinggi Muka Air (TMA)</span>
                            </div>
                            <span className="font-mono text-xs font-bold" style={{ color: statusColor }}>
                                {pump.waterLevelCm} cm / {pump.maxWaterLevelCm} cm ({percentage}%)
                            </span>
                        </div>

                        {/* Progress Bar with markers */}
                        <div className="relative w-full h-4 rounded-full overflow-hidden bg-slate-900 border border-slate-700/60 p-0.5">
                            <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{
                                    width: `${percentage}%`,
                                    background: isSiaga
                                        ? 'linear-gradient(90deg, #ff7875, #ff4d4f)'
                                        : isWaspada
                                        ? 'linear-gradient(90deg, #ffd666, #faad14)'
                                        : 'linear-gradient(90deg, #36cfc9, #00d2ff)',
                                    boxShadow: `0 0 10px ${statusColor}80`,
                                }}
                            />
                        </div>

                        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1.5 px-0.5">
                            <span>0 cm (Surut)</span>
                            <span className="text-yellow-400/80">Waspada ({Math.round(pump.maxWaterLevelCm * 0.65)} cm)</span>
                            <span className="text-red-400/80">Siaga/Limpas ({pump.maxWaterLevelCm} cm)</span>
                        </div>
                    </div>

                    {/* Telemetry Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
                                <Activity size={13} />
                                <span>Pompa Aktif</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold font-mono text-white">
                                    {pump.activePumps}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    / {pump.totalPumps} unit
                                </span>
                            </div>
                            {/* Pump dots visual */}
                            <div className="flex items-center gap-1.5 mt-2">
                                {Array.from({ length: pump.totalPumps }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{
                                            background:
                                                idx < pump.activePumps ? '#00d2ff' : 'rgba(255, 255, 255, 0.15)',
                                            boxShadow:
                                                idx < pump.activePumps ? '0 0 6px #00d2ff' : 'none',
                                        }}
                                        title={`Unit ${idx + 1}: ${idx < pump.activePumps ? 'Running' : 'Standby'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div
                            className="rounded-xl p-3"
                            style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                            }}
                        >
                            <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold mb-1">
                                <Droplets size={13} />
                                <span>Kapasitas Debit</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-xl font-bold font-mono text-white">
                                    {pump.dischargeM3s}
                                </span>
                                <span className="text-xs font-mono text-slate-400">
                                    m³/detik
                                </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-mono">
                                Pembuangan ke muara/laut
                            </p>
                        </div>
                    </div>

                    {/* Sensor Attribution & Coordinates */}
                    <div
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono"
                        style={{
                            background: 'rgba(0, 210, 255, 0.04)',
                            border: '1px solid rgba(0, 210, 255, 0.12)',
                            color: 'rgba(0, 210, 255, 0.7)',
                        }}
                    >
                        <span>DSDABM KOTA SURABAYA</span>
                        <span>{pump.lat.toFixed(5)}, {pump.lng.toFixed(5)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="relative flex items-center justify-between p-4 pt-0 gap-2">
                    <button
                        onClick={() => onViewReports && onViewReports(pump)}
                        className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all duration-200"
                        style={{
                            background: 'rgba(0, 210, 255, 0.15)',
                            color: '#00d2ff',
                            border: '1px solid rgba(0, 210, 255, 0.4)',
                        }}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 210, 255, 0.25)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 210, 255, 0.15)';
                        }}
                    >
                        🌊 Laporan Genangan / Banjir Sekitar
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

export default WaterSensorModal;
