import React, { useState, useEffect } from 'react';
import { ShieldCheck, Video, Droplets, Bell, Anchor, ChevronUp, ChevronDown } from 'lucide-react';
import { Report } from '../../types';

interface TacticalCommandBarProps {
    reports: Report[];
    cctvCount?: number;
    pumpCount?: number;
    shipCount?: number;
    onSelectReport?: (report: Report) => void;
}

const TacticalCommandBar: React.FC<TacticalCommandBarProps> = ({
    reports,
    cctvCount = 40,
    pumpCount = 20,
    shipCount = 15,
    onSelectReport,
}) => {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [activeTickerIdx, setActiveTickerIdx] = useState(0);

    // Live clock in WIB (UTC+7)
    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('id-ID', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
            setCurrentTime(`${timeStr} WIB`);
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Rotate ticker items
    useEffect(() => {
        if (reports.length <= 1) return;
        const interval = setInterval(() => {
            setActiveTickerIdx((prev) => (prev + 1) % reports.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [reports.length]);

    const activeReport = reports.length > 0 ? reports[activeTickerIdx] : null;

    if (isCollapsed) {
        return (
            <div className="absolute top-2 right-14 z-[15]">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-mono font-bold tracking-wider shadow-md transition-all select-none"
                    style={{
                        background: '#0a101a',
                        border: '1px solid rgba(0, 255, 136, 0.4)',
                        color: '#00ff88',
                    }}
                    title="Buka Command Center Status Bar"
                >
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-pulse" />
                    <span>COMMAND CENTER HUD</span>
                    <ChevronDown size={12} />
                </button>
            </div>
        );
    }

    return (
        <div
            className="absolute top-2 left-2 right-14 z-[15] hidden sm:flex items-center justify-between px-3 py-1.5 rounded-lg select-none backdrop-blur-md shadow-lg"
            style={{
                background: 'rgba(6, 16, 30, 0.92)',
                border: '1px solid rgba(0, 210, 255, 0.25)',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(0, 210, 255, 0.08)',
            }}
        >
            {/* Left: Agency & Time */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
                    <span
                        className="text-[11px] font-mono font-bold tracking-wider text-slate-100 flex items-center gap-1"
                        style={{ textShadow: '0 0 8px rgba(0,255,136,0.5)' }}
                    >
                        SURABAYA TACTICAL HUD
                    </span>
                </div>

                <div
                    className="h-3.5 w-px bg-slate-700"
                />

                <span className="text-[11px] font-mono font-semibold text-cyan-300">
                    {currentTime || '00:00:00 WIB'}
                </span>
            </div>

            {/* Center: Live incident ticker */}
            <div className="flex-1 mx-3 overflow-hidden text-center">
                {activeReport ? (
                    <div
                        onClick={() => onSelectReport && onSelectReport(activeReport)}
                        className="inline-flex items-center gap-2 cursor-pointer transition-opacity duration-300 hover:opacity-80"
                    >
                        <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                            SIGNAL
                        </span>
                        <span className="text-xs text-slate-200 font-sans truncate max-w-[280px] lg:max-w-[420px]">
                            {activeReport.title}
                        </span>
                        <span className="text-[10px] text-cyan-400/70 font-mono">
                            ({activeReport.category})
                        </span>
                    </div>
                ) : (
                    <div className="text-[11px] font-mono text-slate-400 flex items-center justify-center gap-1.5">
                        <ShieldCheck size={13} className="text-[#00ff88]" />
                        <span>WILAYAH SURABAYA DALAM STATUS KONDUSIF</span>
                    </div>
                )}
            </div>

            {/* Right: Telemetry counters & Collapse */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                        background: 'rgba(0, 255, 136, 0.1)',
                        border: '1px solid rgba(0, 255, 136, 0.3)',
                        color: '#00ff88',
                    }}
                    title="CCTV Persimpangan Surabaya Online"
                >
                    <Video size={11} />
                    <span>{cctvCount} CCTV</span>
                </div>

                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                        background: 'rgba(0, 210, 255, 0.1)',
                        border: '1px solid rgba(0, 210, 255, 0.3)',
                        color: '#00d2ff',
                    }}
                    title="Sensor Rumah Pompa & Pintu Air Aktif"
                >
                    <Droplets size={11} />
                    <span>{pumpCount} POMPA</span>
                </div>

                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                        background: 'rgba(0, 255, 170, 0.1)',
                        border: '1px solid rgba(0, 255, 170, 0.3)',
                        color: '#00ffaa',
                    }}
                    title="Radar Transponder AIS Kapal Selat Madura & Tanjung Perak"
                >
                    <Anchor size={11} />
                    <span>{shipCount} KAPAL</span>
                </div>

                <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                    style={{
                        background: 'rgba(255, 170, 0, 0.1)',
                        border: '1px solid rgba(255, 170, 0, 0.3)',
                        color: '#ffaa00',
                    }}
                    title="Laporan Masuk Dari Warga"
                >
                    <Bell size={11} />
                    <span>{reports.length} LAPORAN</span>
                </div>

                <button
                    onClick={() => setIsCollapsed(true)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Sembunyikan Status Bar"
                >
                    <ChevronUp size={13} />
                </button>
            </div>
        </div>
    );
};

export default TacticalCommandBar;
