import React, { useEffect, useMemo, useState } from 'react';
import {
  IconX,
  IconCloudRain,
  IconSun,
  IconCloud,
  IconWind,
  IconDroplet,
  IconTemperature,
  IconRadar,
  IconRefresh,
  IconExternalLink,
  IconClock,
  IconMapPin,
} from '@tabler/icons-react';

interface WeatherForecastModalProps {
  onClose: () => void;
  isRainRadarActive: boolean;
  onToggleRainRadar: () => void;
}

interface HourlyForecastItem {
  time: string;
  temp: number;
  precipProb: number;
  precipMm: number;
  windSpeed: number;
  weatherCode: number;
}

interface OpenMeteoCurrent {
  temperature_2m: number;
  relative_humidity_2m: number;
  precipitation: number;
  wind_speed_10m: number;
  cloud_cover: number;
  weather_code: number;
}

interface BmkgWeatherEntry {
  local_datetime: string;
  t: number;
  hu: number;
  tp: number;
  tcc: number;
  ws: number;
  wd: string;
  weather_desc: string;
  image: string;
}

const SURABAYA_DISTRICTS: { name: string; adm4: string }[] = [
  { name: 'Gubeng', adm4: '35.78.08.1001' },
  { name: 'Genteng', adm4: '35.78.07.1001' },
  { name: 'Wonokromo', adm4: '35.78.04.1001' },
  { name: 'Sukolilo', adm4: '35.78.09.1001' },
  { name: 'Rungkut', adm4: '35.78.03.1001' },
  { name: 'Tambaksari', adm4: '35.78.10.1001' },
  { name: 'Sawahan', adm4: '35.78.06.1001' },
  { name: 'Krembangan', adm4: '35.78.15.1001' },
  { name: 'Kenjeran', adm4: '35.78.17.1001' },
  { name: 'Gayungan', adm4: '35.78.22.1001' },
  { name: 'Lakarsantri', adm4: '35.78.18.1001' },
  { name: 'Benowo', adm4: '35.78.19.1001' },
];

function getWmoLabel(code: number): { label: string; isRain: boolean } {
  if (code === 0) return { label: 'Cerah', isRain: false };
  if (code <= 3) return { label: 'Cerah Berawan', isRain: false };
  if (code === 45 || code === 48) return { label: 'Berkabut', isRain: false };
  if (code >= 51 && code <= 57) return { label: 'Gerimis', isRain: true };
  if (code >= 61 && code <= 67) return { label: 'Hujan', isRain: true };
  if (code >= 80 && code <= 82) return { label: 'Hujan Lebat', isRain: true };
  if (code >= 95) return { label: 'Badai Petir', isRain: true };
  return { label: 'Berawan', isRain: false };
}

function getRainRiskBadge(precipMm: number, prob: number) {
  if (precipMm >= 7 || prob >= 80) {
    return { text: 'SIAGA HUJAN LEBAT', cls: 'bg-red-500/20 text-red-300 border-red-500/40' };
  }
  if (precipMm >= 1 || prob >= 50) {
    return { text: 'POTENSI HUJAN', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  return { text: 'CUACA KONDUSIF', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
}

const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({
  onClose,
  isRainRadarActive,
  onToggleRainRadar,
}) => {
  const [activeTab, setActiveTab] = useState<'forecast' | 'bmkg'>('forecast');
  const [selectedAdm4, setSelectedAdm4] = useState<string>(SURABAYA_DISTRICTS[0].adm4);

  const [currentWeather, setCurrentWeather] = useState<OpenMeteoCurrent | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecastItem[]>([]);
  const [forecastLoading, setForecastLoading] = useState<boolean>(true);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const [bmkgList, setBmkgList] = useState<BmkgWeatherEntry[]>([]);
  const [bmkgLoading, setBmkgLoading] = useState<boolean>(true);
  const [bmkgError, setBmkgError] = useState<string | null>(null);

  const fetchOpenMeteo = async () => {
    setForecastLoading(true);
    setForecastError(null);
    try {
      const url =
        'https://api.open-meteo.com/v1/forecast?latitude=-7.2575&longitude=112.7521&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,cloud_cover,weather_code&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FJakarta&forecast_days=2';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.current) {
        setCurrentWeather(json.current as OpenMeteoCurrent);
      }

      if (json.hourly?.time) {
        const nowHour = new Date().getHours();
        const todayStr = new Date().toISOString().slice(0, 10);
        const items: HourlyForecastItem[] = [];
        for (let i = 0; i < json.hourly.time.length; i++) {
          const tStr: string = json.hourly.time[i];
          const itemDate = tStr.slice(0, 10);
          const itemHour = Number(tStr.slice(11, 13));
          if (itemDate === todayStr && itemHour < nowHour) continue;
          items.push({
            time: tStr,
            temp: json.hourly.temperature_2m[i],
            precipProb: json.hourly.precipitation_probability[i] ?? 0,
            precipMm: json.hourly.precipitation[i] ?? 0,
            windSpeed: json.hourly.wind_speed_10m[i] ?? 0,
            weatherCode: json.hourly.weather_code[i] ?? 0,
          });
          if (items.length >= 24) break;
        }
        setHourlyForecast(items);
      }
    } catch {
      setForecastError('Gagal memuat data forecast cuaca real-time.');
    } finally {
      setForecastLoading(false);
    }
  };

  const fetchBmkg = async (adm4: string) => {
    setBmkgLoading(true);
    setBmkgError(null);
    try {
      const res = await fetch(`https://api.bmkg.go.id/publik/prakiraan-cuaca?adm4=${encodeURIComponent(adm4)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const days: BmkgWeatherEntry[][] = json?.data?.[0]?.cuaca || [];
      const flattened = days.flat().slice(0, 12);
      setBmkgList(flattened);
    } catch {
      setBmkgError('Gagal memuat prakiraan resmi BMKG untuk wilayah ini.');
    } finally {
      setBmkgLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenMeteo();
  }, []);

  useEffect(() => {
    fetchBmkg(selectedAdm4);
  }, [selectedAdm4]);

  const maxPrecip = useMemo(() => {
    const m = Math.max(...hourlyForecast.map((h) => h.precipMm), 1);
    return m;
  }, [hourlyForecast]);

  const currentWmo = currentWeather ? getWmoLabel(currentWeather.weather_code) : null;
  const currentRisk = useMemo(() => {
    const nextProb = hourlyForecast[0]?.precipProb ?? 0;
    return getRainRiskBadge(currentWeather?.precipitation ?? 0, nextProb);
  }, [currentWeather, hourlyForecast]);

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none"
      style={{ background: 'rgba(2, 8, 18, 0.84)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: 'linear-gradient(145deg, #091322 0%, #0f1d32 55%, #091322 100%)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          boxShadow: '0 0 50px rgba(56, 189, 248, 0.16), 0 25px 60px rgba(0,0,0,0.9)',
          maxHeight: '92vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-4"
          style={{
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            background: 'rgba(56, 189, 248, 0.05)',
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-500/15 border border-sky-400/40 text-sky-300 shrink-0">
              <IconCloudRain size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${currentRisk.cls}`}>
                  {currentRisk.text}
                </span>
                <span className="text-[11px] font-mono text-sky-300/70">SURABAYA METEOROLOGY</span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                Forecast & Prediksi Cuaca Kota Surabaya
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-500/20 border border-white/10 transition-colors"
            title="Tutup"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Tab Switcher + Radar Toggle */}
        <div className="px-4 pt-3 pb-2 flex flex-wrap items-center justify-between gap-2 border-b border-white/10">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-black/50 border border-slate-700/60 text-xs">
            <button
              onClick={() => setActiveTab('forecast')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'forecast'
                  ? 'bg-sky-500/25 text-sky-300 border border-sky-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconClock size={14} />
              <span>Forecast 24 Jam</span>
            </button>
            <button
              onClick={() => setActiveTab('bmkg')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === 'bmkg'
                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconMapPin size={14} />
              <span>Prediksi Resmi BMKG</span>
            </button>
          </div>

          <button
            onClick={onToggleRainRadar}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
              isRainRadarActive
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.45)]'
                : 'bg-slate-800/80 text-cyan-300 border-cyan-500/40 hover:bg-cyan-950/60'
            }`}
          >
            <IconRadar size={14} />
            <span>{isRainRadarActive ? 'Radar Hujan Aktif di Peta' : 'Tampilkan Peta Hujan'}</span>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {activeTab === 'forecast' && (
            <>
              {/* Current Weather Summary Cards */}
              {forecastLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-pulse">
                  {[1, 2, 3, 4].map((k) => (
                    <div key={k} className="h-20 rounded-xl bg-white/5 border border-white/10" />
                  ))}
                </div>
              ) : forecastError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center justify-between">
                  <span>{forecastError}</span>
                  <button
                    onClick={fetchOpenMeteo}
                    className="px-2.5 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-white flex items-center gap-1"
                  >
                    <IconRefresh size={12} />
                    <span>Coba Lagi</span>
                  </button>
                </div>
              ) : (
                currentWeather && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-semibold uppercase">
                        <IconTemperature size={13} />
                        <span>Suhu Saat Ini</span>
                      </div>
                      <p className="text-xl font-extrabold text-white mt-1">{currentWeather.temperature_2m}°C</p>
                      <p className="text-[11px] text-slate-400">{currentWmo?.label}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-sky-300 text-[10px] font-semibold uppercase">
                        <IconCloudRain size={13} />
                        <span>Curah Hujan</span>
                      </div>
                      <p className="text-xl font-extrabold text-white mt-1">{currentWeather.precipitation} mm</p>
                      <p className="text-[11px] text-slate-400">Awan {currentWeather.cloud_cover}%</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-cyan-300 text-[10px] font-semibold uppercase">
                        <IconDroplet size={13} />
                        <span>Kelembapan</span>
                      </div>
                      <p className="text-xl font-extrabold text-white mt-1">{currentWeather.relative_humidity_2m}%</p>
                      <p className="text-[11px] text-slate-400">Udara Surabaya</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex items-center gap-1.5 text-emerald-300 text-[10px] font-semibold uppercase">
                        <IconWind size={13} />
                        <span>Angin</span>
                      </div>
                      <p className="text-xl font-extrabold text-white mt-1">{currentWeather.wind_speed_10m} km/j</p>
                      <p className="text-[11px] text-slate-400">Kecepatan permukaan</p>
                    </div>
                  </div>
                )
              )}

              {/* Hourly Rain & Weather Forecast Timeline */}
              {!forecastLoading && hourlyForecast.length > 0 && (
                <div className="rounded-xl bg-black/35 border border-white/10 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                        Timeline Prediksi Hujan & Suhu (24 Jam)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Intensitas curah hujan (mm/jam) & probabilitas hujan wilayah Surabaya
                      </p>
                    </div>
                    <button
                      onClick={fetchOpenMeteo}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
                      title="Muat ulang forecast"
                    >
                      <IconRefresh size={13} />
                    </button>
                  </div>

                  {/* Mini Bar Chart + Hourly Strip */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {hourlyForecast.map((item) => {
                      const hourLabel = item.time.slice(11, 16);
                      const wmo = getWmoLabel(item.weatherCode);
                      const barHeight = Math.max(8, Math.round((item.precipMm / maxPrecip) * 44));
                      const isHeavy = item.precipMm >= 4 || item.precipProb >= 75;
                      return (
                        <div
                          key={item.time}
                          className="min-w-[66px] rounded-xl p-2 bg-white/[0.04] border border-white/10 flex flex-col items-center justify-between gap-1.5 text-center shrink-0"
                        >
                          <span className="text-[10px] font-mono text-slate-400">{hourLabel}</span>
                          {wmo.isRain ? (
                            <IconCloudRain size={16} className={isHeavy ? 'text-amber-400' : 'text-sky-400'} />
                          ) : item.weatherCode === 0 ? (
                            <IconSun size={16} className="text-amber-300" />
                          ) : (
                            <IconCloud size={16} className="text-slate-300" />
                          )}
                          <span className="text-xs font-bold text-white">{Math.round(item.temp)}°C</span>

                          {/* Bar intensitas hujan */}
                          <div className="w-full h-11 flex items-end justify-center">
                            <div
                              className={`w-3 rounded-t transition-all ${
                                isHeavy
                                  ? 'bg-amber-400'
                                  : item.precipMm > 0
                                  ? 'bg-sky-400'
                                  : 'bg-slate-700/60'
                              }`}
                              style={{ height: `${item.precipMm > 0 ? barHeight : 4}px` }}
                              title={`${item.precipMm} mm/jam`}
                            />
                          </div>

                          <div className="leading-tight">
                            <span className="block text-[10px] font-mono text-sky-300 font-bold">
                              {item.precipProb}%
                            </span>
                            <span className="block text-[9px] font-mono text-slate-400">
                              {item.precipMm.toFixed(1)}mm
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'bmkg' && (
            <div className="space-y-3">
              {/* District selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                <div>
                  <span className="text-[10px] font-mono uppercase text-emerald-300 block">
                    DATA RESMI BMKG PUBLIK (PER 3 JAM)
                  </span>
                  <span className="text-xs text-slate-300">Pilih Kecamatan Kota Surabaya</span>
                </div>
                <select
                  value={selectedAdm4}
                  onChange={(e) => setSelectedAdm4(e.target.value)}
                  className="bg-slate-900 border border-emerald-500/40 text-slate-100 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                >
                  {SURABAYA_DISTRICTS.map((d) => (
                    <option key={d.adm4} value={d.adm4}>
                      Kec. {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {bmkgLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-pulse">
                  {[1, 2, 3, 4, 5, 6].map((k) => (
                    <div key={k} className="h-24 rounded-xl bg-white/5 border border-white/10" />
                  ))}
                </div>
              ) : bmkgError ? (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                  {bmkgError}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {bmkgList.map((entry, idx) => (
                    <div
                      key={`${entry.local_datetime}-${idx}`}
                      className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-3"
                    >
                      {entry.image ? (
                        <img src={entry.image} alt={entry.weather_desc} className="w-10 h-10 shrink-0" />
                      ) : (
                        <IconCloud size={28} className="text-slate-300 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-mono text-emerald-300 font-bold">
                            {entry.local_datetime.slice(5, 16)} WIB
                          </span>
                          <span className="text-xs font-extrabold text-white">{entry.t}°C</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-100 truncate mt-0.5">{entry.weather_desc}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Hujan {entry.tp}mm · Lembap {entry.hu}% · {entry.ws}km/j
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Reference Links */}
        <div className="px-4 py-3 border-t border-white/10 bg-black/30 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <span>Sumber: BMKG Publik API, Open-Meteo & RainViewer Radar</span>
          <div className="flex items-center gap-3">
            <a
              href="https://stamet-juanda.bmkg.go.id/radar/nowcastnet/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-300 hover:text-sky-200 flex items-center gap-1 font-mono"
            >
              <span>NowcastNet Juanda</span>
              <IconExternalLink size={12} />
            </a>
            <a
              href="https://stamet-juanda.bmkg.go.id/radar/peta-hujan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-300 hover:text-emerald-200 flex items-center gap-1 font-mono"
            >
              <span>Peta Hujan Juanda</span>
              <IconExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecastModal;
