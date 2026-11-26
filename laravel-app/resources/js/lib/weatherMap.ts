/**
 * Helper untuk Peta Sebaran & Prediksi Cuaca 31 Kecamatan Surabaya
 * Menggabungkan batas kecamatan (kecamatan-surabaya.geojson) dengan
 * prakiraan per jam Open-Meteo (multi-koordinat dalam 1 request).
 */

export interface DistrictForecastHourly {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  wind_speed_10m: number[];
  cloud_cover: number[];
}

export interface SpatialWeatherDataset {
  geojson: GeoJSON.FeatureCollection;
  hourlyByDistrictId: Record<string, DistrictForecastHourly>;
  times: string[];
  startIndex: number;
}

export interface WeatherVisualStyle {
  color: string;
  label: string;
  category: 'clear' | 'cloudy' | 'potential' | 'light' | 'moderate' | 'heavy';
}

export function getWeatherVisualStyle(
  precipMm: number,
  precipProb: number,
  weatherCode: number,
  cloudCover: number
): WeatherVisualStyle {
  if (weatherCode >= 95 || precipMm >= 10) {
    return { color: '#EF4444', label: 'Badai Petir / Sangat Lebat', category: 'heavy' };
  }
  if ((weatherCode >= 80 && weatherCode <= 82) || precipMm >= 5) {
    return { color: '#F97316', label: 'Hujan Lebat', category: 'heavy' };
  }
  if ((weatherCode >= 61 && weatherCode <= 67) || precipMm >= 1.5) {
    return { color: '#EAB308', label: 'Hujan Sedang', category: 'moderate' };
  }
  if ((weatherCode >= 51 && weatherCode <= 57) || precipMm >= 0.1) {
    return { color: '#0EA5E9', label: 'Hujan Ringan / Gerimis', category: 'light' };
  }
  if (precipProb >= 45) {
    return { color: '#38BDF8', label: 'Potensi Hujan', category: 'potential' };
  }
  if (cloudCover >= 65 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
    return { color: '#64748B', label: 'Berawan Tebal', category: 'cloudy' };
  }
  if (cloudCover >= 25 || weatherCode >= 1) {
    return { color: '#84CC16', label: 'Cerah Berawan', category: 'clear' };
  }
  return { color: '#22C55E', label: 'Cerah', category: 'clear' };
}

function getFeatureCenter(feature: GeoJSON.Feature): { lat: number; lng: number } {
  const bbox = feature.properties?.bbox as [number, number, number, number] | undefined;
  if (Array.isArray(bbox) && bbox.length === 4) {
    return {
      lng: Number(((bbox[0] + bbox[2]) / 2).toFixed(4)),
      lat: Number(((bbox[1] + bbox[3]) / 2).toFixed(4)),
    };
  }
  // Fallback ke pusat Surabaya
  return { lat: -7.2575, lng: 112.7521 };
}

function findCurrentJakartaHourIndex(times: string[]): number {
  if (times.length === 0) return 0;
  // Format Open-Meteo Asia/Jakarta: "YYYY-MM-DDTHH:00"
  const nowParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const getPart = (type: string) => nowParts.find((p) => p.type === type)?.value || '00';
  const currentIsoHour = `${getPart('year')}-${getPart('month')}-${getPart('day')}T${getPart('hour')}:00`;
  const idx = times.findIndex((t) => t >= currentIsoHour);
  return idx >= 0 ? idx : 0;
}

let cachedDataset: { data: SpatialWeatherDataset; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Mengambil GeoJSON 31 kecamatan Surabaya dan prakiraan cuaca per jam dari Open-Meteo.
 */
export async function fetchSurabayaSpatialWeather(
  forceRefresh = false
): Promise<SpatialWeatherDataset> {
  if (!forceRefresh && cachedDataset && Date.now() - cachedDataset.fetchedAt < CACHE_TTL_MS) {
    return cachedDataset.data;
  }

  const geoRes = await fetch('/data/kecamatan-surabaya.geojson');
  if (!geoRes.ok) {
    throw new Error('Gagal memuat batas kecamatan Surabaya');
  }
  const geojson = (await geoRes.json()) as GeoJSON.FeatureCollection;

  const centers = geojson.features.map((f, idx) => ({
    id: String(f.properties?.id || f.id || idx),
    ...getFeatureCenter(f),
  }));

  const latitudes = centers.map((c) => c.lat).join(',');
  const longitudes = centers.map((c) => c.lng).join(',');

  const meteoUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitudes}&longitude=${longitudes}` +
    `&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m,cloud_cover` +
    `&timezone=Asia%2FJakarta&forecast_days=2`;

  const meteoRes = await fetch(meteoUrl);
  if (!meteoRes.ok) {
    throw new Error(`Open-Meteo HTTP ${meteoRes.status}`);
  }
  const raw = await meteoRes.json();
  const list = Array.isArray(raw) ? raw : [raw];

  const hourlyByDistrictId: Record<string, DistrictForecastHourly> = {};
  let sharedTimes: string[] = [];

  centers.forEach((center, index) => {
    const item = list[index] || list[0];
    if (item?.hourly) {
      hourlyByDistrictId[center.id] = item.hourly as DistrictForecastHourly;
      if (sharedTimes.length === 0 && Array.isArray(item.hourly.time)) {
        sharedTimes = item.hourly.time as string[];
      }
    }
  });

  const startIndex = findCurrentJakartaHourIndex(sharedTimes);

  const dataset: SpatialWeatherDataset = {
    geojson,
    hourlyByDistrictId,
    times: sharedTimes,
    startIndex,
  };

  cachedDataset = { data: dataset, fetchedAt: Date.now() };
  return dataset;
}

/**
 * Membangun GeoJSON yang diperkaya properti visual cuaca untuk offset jam tertentu (0..24).
 */
export function buildWeatherGeoJsonForHour(
  dataset: SpatialWeatherDataset,
  hourOffset: number
): GeoJSON.FeatureCollection {
  const maxOffset = Math.max(0, dataset.times.length - 1 - dataset.startIndex);
  const clampedOffset = Math.min(Math.max(0, hourOffset), maxOffset);
  const idx = dataset.startIndex + clampedOffset;

  const features: GeoJSON.Feature[] = dataset.geojson.features.map((feature, fIdx) => {
    const id = String(feature.properties?.id || feature.id || fIdx);
    const name = String(feature.properties?.name || 'Kecamatan');
    const hourly = dataset.hourlyByDistrictId[id];

    const temp = Math.round(hourly?.temperature_2m?.[idx] ?? 30);
    const precipProb = Math.round(hourly?.precipitation_probability?.[idx] ?? 0);
    const precipMm = Number((hourly?.precipitation?.[idx] ?? 0).toFixed(1));
    const weatherCode = Number(hourly?.weather_code?.[idx] ?? 0);
    const windSpeed = Math.round(hourly?.wind_speed_10m?.[idx] ?? 0);
    const cloudCover = Math.round(hourly?.cloud_cover?.[idx] ?? 0);

    const style = getWeatherVisualStyle(precipMm, precipProb, weatherCode, cloudCover);
    const shortMetric =
      precipMm >= 0.1
        ? `${precipMm}mm (${precipProb}%)`
        : `${temp}°C • ${precipProb}%`;

    return {
      ...feature,
      properties: {
        ...feature.properties,
        weatherColor: style.color,
        weatherLabel: style.label,
        weatherTemp: temp,
        weatherPrecipMm: precipMm,
        weatherPrecipProb: precipProb,
        weatherWind: windSpeed,
        weatherCloud: cloudCover,
        weatherMapLabel: `${name}\n${shortMetric}`,
      },
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}
