import React, { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  IconAlertTriangle,
  IconKey,
  IconMap2,
  IconSatellite,
  IconFlame,
  IconChartBar,
  IconCircleDot,
  IconX,
  Icon3dCubeSphere,
  IconDeviceCctv,
  IconDroplet,
  IconShip,
  IconCloudRain,
  IconRadar,
  IconPlayerPlay,
  IconPlayerPause,
} from '@tabler/icons-react';
import { Report } from '../../types';
import { useReportsStore } from '../../stores/reportsStore';
import { createPinElement, PIN_STYLE } from './markers/createPin';
import { fetchKecamatanGeoJSON, getKecamatanBounds } from '../../lib/kecamatan';
import { statsApi } from '../../lib/api';
import CctvModal, { CctvItem } from './CctvModal';
import WaterSensorModal, { WaterPumpItem } from './WaterSensorModal';
import ShipModal, { ShipItem } from './ShipModal';
import WeatherForecastModal from './WeatherForecastModal';
import TacticalCommandBar from './TacticalCommandBar';

// ─── Mapbox Access Token Setup & Validation ───────────────────────────────────
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// ─── Style Peta ──────────────────────────────────────────────────────────────
export type MapStyleMode = 'peta' | 'satelit';

const MAP_STYLES: Record<MapStyleMode, string> = {
  peta: 'mapbox://styles/mapbox/light-v11',
  satelit: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// ─── Default View & Bounds Surabaya ──────────────────────────────────────────
const SURABAYA_CENTER: [number, number] = [112.7521, -7.2575];
const DEFAULT_ZOOM = 12.5;
const MIN_ZOOM = 10.5;
const MAX_ZOOM = 18;
const SURABAYA_BOUNDS: [[number, number], [number, number]] = [
  [112.55, -7.38],
  [112.92, -7.15],
];

// ─── Tipe Data Density Kecamatan ─────────────────────────────────────────────
interface KecamatanDensityItem {
  kecamatan: string;
  total: number;
  avgUrgensi: number;
}

// ─── Helper: Reports → GeoJSON ───────────────────────────────────────────────
function reportsToGeoJSON(reports: Report[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: reports
      .filter((r) => !isNaN(r.latitude) && !isNaN(r.longitude))
      .map((r) => {
        let pinType = 'pin-rendah';
        if (r.skorUrgensi >= 80) pinType = 'pin-kritis';
        else if (r.skorUrgensi >= 60) pinType = 'pin-tinggi';
        else if (r.skorUrgensi >= 40) pinType = 'pin-sedang';

        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
          properties: {
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            status: r.status,
            skorUrgensi: r.skorUrgensi,
            pinType,
            address: r.address || '',
            photos: JSON.stringify(r.photos || []),
            urgensiKeywords: JSON.stringify(r.urgensiKeywords || []),
            userId: r.userId || '',
            createdAt: r.createdAt,
            updatedAt: r.updatedAt || r.createdAt,
            user: JSON.stringify(r.user),
            kelurahan: JSON.stringify(r.kelurahan),
          },
        };
      }),
  };
}

// ─── Helper: Haversine distance (km) — digunakan oleh radius circle ──────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Helper: Buat GeoJSON lingkaran dari titik pusat + radius km ──────────────
function makeCircleGeoJSON(
  centerLng: number,
  centerLat: number,
  radiusKm: number,
  points = 64
): GeoJSON.FeatureCollection {
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = (radiusKm / 111.32) / Math.cos((centerLat * Math.PI) / 180);
    const dy = radiusKm / 111.32;
    coords.push([centerLng + dx * Math.cos(angle), centerLat + dy * Math.sin(angle)]);
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [coords] },
        properties: {},
      },
    ],
  };
}

// ─── Helper: Debounce ─────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

// ─── Helper: Buat elemen pin CCTV dengan performa optimal ───────────────────────
function createCctvPinElement(cctv: CctvItem, onClick: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'cctv-pin-marker cursor-pointer select-none';
  el.title = `${cctv.name} (${cctv.district}) - Klik untuk pantau CCTV`;

  el.innerHTML = `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; will-change: transform; transform: translate3d(0,0,0);">
      <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #0d1117; border: 2px solid #00ff88; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px rgba(0, 255, 136, 0.45); transition: transform 0.15s ease;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00ff88" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M1 10h18a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z"/>
          <path d="m20 13 3-2v6l-3-2"/>
          <circle cx="7" cy="14" r="1.5"/>
        </svg>
      </div>
      <div style="position: absolute; top: 0; right: 0; width: 7px; height: 7px; border-radius: 9999px; background: #00ff88; border: 1.5px solid #0d1117;"></div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return el;
}

// ─── Helper: Buat elemen pin Rumah Pompa / Sensor Air ─────────────────────────
function createWaterPumpPinElement(pump: WaterPumpItem, onClick: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'water-pump-pin-marker cursor-pointer select-none';
  el.title = `${pump.name} (TMA: ${pump.waterLevelCm}cm) - Klik untuk telemetri pompa`;

  const isWaspada = pump.status === 'waspada';
  const isSiaga = pump.status === 'siaga';
  const color = isSiaga ? '#ff4d4f' : isWaspada ? '#faad14' : '#00d2ff';

  el.innerHTML = `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; will-change: transform; transform: translate3d(0,0,0);">
      <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #06101e; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}60; transition: transform 0.15s ease;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
        </svg>
      </div>
      <div style="position: absolute; top: 0; right: 0; width: 7px; height: 7px; border-radius: 9999px; background: ${color}; border: 1.5px solid #06101e;"></div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return el;
}

// ─── Helper: Buat elemen pin Kapal / Radar Maritim AIS ─────────────────────────
function createShipPinElement(ship: ShipItem, onClick: () => void): HTMLElement {
  const el = document.createElement('div');
  el.className = 'ship-pin-marker cursor-pointer select-none';
  el.title = `${ship.name} (${ship.type.toUpperCase()}) - Haluan: ${ship.courseDeg}° - SOG: ${ship.speedKnots}kt`;

  const isUnderway = ship.status === 'underway';
  const color = isUnderway ? '#00ffaa' : '#38bdf8';

  el.innerHTML = `
    <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; will-change: transform; transform: translate3d(0,0,0);">
      <div style="position: relative; width: 26px; height: 26px; border-radius: 9999px; background: #05141c; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 8px ${color}60; transition: transform 0.15s ease;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="${color}" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${ship.courseDeg}deg);">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      </div>
      <div style="position: absolute; top: 0; right: 0; width: 7px; height: 7px; border-radius: 9999px; background: ${color}; border: 1.5px solid #05141c;"></div>
    </div>
  `;

  el.addEventListener('click', (e) => {
    e.stopPropagation();
    onClick();
  });

  return el;
}

// ─── MapView Props ─────────────────────────────────────────────────────────────
interface MapViewProps {
  onSelectReport: (report: Report) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  isPickingLocation: boolean;
  /** Jika diisi, tampilkan lingkaran radius di koordinat ini (untuk form laporan) */
  pickedLocation?: { lat: number; lng: number } | null;
}

// ─── Komponen Utama ──────────────────────────────────────────────────────────
const MapView: React.FC<MapViewProps> = ({
  onSelectReport,
  onMapClick,
  isPickingLocation,
  pickedLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // ── GIS state ──
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('peta');
  const mapStyleRef = useRef<MapStyleMode>(mapStyle);
  mapStyleRef.current = mapStyle;

  const [isHeatmapMode, setIsHeatmapMode] = useState(false);
  const isHeatmapModeRef = useRef(false);

  const [isChoroplethMode, setIsChoroplethMode] = useState(false);
  const isChoroplethModeRef = useRef(false);

  const [is3DMode, setIs3DMode] = useState(false);
  const is3DModeRef = useRef(false);

  const [isCctvMode, setIsCctvMode] = useState(false);
  const isCctvModeRef = useRef(false);
  const [cctvData, setCctvData] = useState<CctvItem[]>([]);
  const [selectedCctv, setSelectedCctv] = useState<CctvItem | null>(null);
  const cctvMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [isPumpMode, setIsPumpMode] = useState(false);
  const isPumpModeRef = useRef(false);
  const [pumpData, setPumpData] = useState<WaterPumpItem[]>([]);
  const [selectedPump, setSelectedPump] = useState<WaterPumpItem | null>(null);
  const pumpMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [isShipMode, setIsShipMode] = useState(false);
  const isShipModeRef = useRef(false);
  const [shipData, setShipData] = useState<ShipItem[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipItem | null>(null);
  const shipMarkersRef = useRef<mapboxgl.Marker[]>([]);

  const [isRainRadarMode, setIsRainRadarMode] = useState(false);
  const [rainFrames, setRainFrames] = useState<{ time: number; path: string }[]>([]);
  const [rainFrameIndex, setRainFrameIndex] = useState(0);
  const [isRainPlaying, setIsRainPlaying] = useState(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);

  const [densityData, setDensityData] = useState<KecamatanDensityItem[]>([]);
  const [maxDensity, setMaxDensity] = useState(1);
  const densityLoadedRef = useRef(false);

  // ── store ──
  const { filteredReports, selectedReport, filter, hoveredReportId, fetchViewportReports } =
    useReportsStore();

  const filterRef = useRef(filter);
  filterRef.current = filter;
  const filteredReportsRef = useRef(filteredReports);
  filteredReportsRef.current = filteredReports;
  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;
  const isInitialLoadRef = useRef(true);
  const markersOnScreenRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  // ─── Hover pulse effect ──────────────────────────────────────────────────
  useEffect(() => {
    document.querySelectorAll('.pin-pulse-active').forEach((el) =>
      el.classList.remove('pin-pulse-active')
    );
    if (!hoveredReportId) return;
    const pinEl = document.getElementById(`map-pin-${hoveredReportId}`);
    pinEl?.querySelector('.psk-pin-inner')?.classList.add('pin-pulse-active');
  }, [hoveredReportId]);

  // ─── No token fallback ───────────────────────────────────────────────────
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#241F1B] p-6 text-ink">
        <div className="max-w-md w-full bg-paper-white p-6 border border-ink text-center">
          <div className="w-12 h-12 mx-auto mb-3 border border-ink bg-paper-kraft flex items-center justify-center">
            <IconKey className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold font-sans text-ink mb-2">
            Mapbox Token Belum Dikonfigurasi
          </h3>
          <p className="text-xs text-ink/70 mb-4 font-sans">
            Isi <code className="bg-paper-kraft px-1 border border-ink font-mono text-xs">VITE_MAPBOX_TOKEN</code> pada file{' '}
            <code className="bg-paper-kraft px-1 border border-ink font-mono text-xs">.env</code>.
          </p>
          <div className="flex items-center justify-center gap-1.5 text-xs text-ink/70 font-sans">
            <IconAlertTriangle className="w-4 h-4 text-mustard shrink-0" />
            <span>Restart dev server setelah token diisi.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Debounced viewport fetch ────────────────────────────────────────────
  const debouncedFetchReports = useRef(
    debounce((map: mapboxgl.Map) => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const zoom = map.getZoom();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      fetchViewportReports(bbox, zoom);
    }, 300)
  ).current;

  // ─── Update custom markers ───────────────────────────────────────────────
  const updateCustomMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer('unclustered-point')) return;
    if (isHeatmapModeRef.current) {
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
      return;
    }
    const reportMap = new Map<string, Report>(
      filteredReportsRef.current.map((r) => [r.id, r])
    );
    let features: mapboxgl.MapboxGeoJSONFeature[] = [];
    try {
      features = map.queryRenderedFeatures({ layers: ['unclustered-point'] });
    } catch {
      return;
    }
    const currentMarkers = markersOnScreenRef.current;
    const newVisibleIds = new Set<string>();
    for (const f of features) {
      const id = f.properties?.id;
      if (!id || newVisibleIds.has(id)) continue;
      newVisibleIds.add(id);
      if (!currentMarkers.has(id)) {
        const report = reportMap.get(id);
        if (report) {
          const { element, anchor } = createPinElement(report, PIN_STYLE);
          element.addEventListener('click', (e) => {
            e.stopPropagation();
            onSelectReportRef.current(report);
          });
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onSelectReportRef.current(report);
            }
          });
          currentMarkers.set(
            id,
            new mapboxgl.Marker({ element, anchor })
              .setLngLat([report.longitude, report.latitude])
              .addTo(map)
          );
        }
      }
      if (newVisibleIds.size >= 300) break;
    }
    for (const [id, marker] of currentMarkers.entries()) {
      if (!newVisibleIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }
  }, []);

  // ─── Event handlers ───────────────────────────────────────────────────────
  const handleClusterClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
    if (!features.length) return;
    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('reports-source') as mapboxgl.GeoJSONSource | undefined;
    source?.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || zoom == null) return;
      const coords = (features[0].geometry as GeoJSON.Point).coordinates;
      map.easeTo({ center: [coords[0], coords[1]], zoom, duration: 600 });
    });
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = 'pointer';
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mapRef.current) mapRef.current.getCanvas().style.cursor = '';
  }, []);

  // ─── Realistic Water Styling (Deep Marine Blue for Surabaya Rivers, Canals & Coast) ──
  const applyRealisticWaterStyle = useCallback((map: mapboxgl.Map, mode: MapStyleMode) => {
    if (!map || !map.isStyleLoaded()) return;
    const isSat = mode === 'satelit';

    const layers = map.getStyle().layers || [];

    for (const layer of layers) {
      const id = layer.id.toLowerCase();
      const sourceLayer = (layer['source-layer'] || '').toLowerCase();

      // Sembunyikan bayangan air default yang berwarna abu-abu kusam
      if (id.includes('water-shadow') || id.includes('waterway-shadow')) {
        try {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
        } catch {
          /* ignore */
        }
        continue;
      }

      // Layer air poligon (danau, sungai, waduk, laut, bozem, kanal)
      if (layer.type === 'fill' && (id === 'water' || id.includes('water') || sourceLayer === 'water')) {
        try {
          // Warna air laut / sungai realistis:
          // Di mode vektor: Deep Vibrant Tropical Blue (#1A659E)
          // Di mode satelit: Semi-translucent Deep Ocean Blue (#145A86) agar menyatu dengan foto satelit dan tidak putih polos
          map.setPaintProperty(
            layer.id,
            'fill-color',
            isSat ? '#145A86' : '#1A659E'
          );
          map.setPaintProperty(
            layer.id,
            'fill-opacity',
            isSat ? 0.75 : 0.98
          );
        } catch {
          /* ignore */
        }
      }

      // Layer garis sungai / aliran air
      if (layer.type === 'line' && (id === 'waterway' || id.includes('waterway') || sourceLayer === 'waterway')) {
        try {
          map.setPaintProperty(
            layer.id,
            'line-color',
            isSat ? '#1C6D9E' : '#1D72A8'
          );
          map.setPaintProperty(
            layer.id,
            'line-opacity',
            isSat ? 0.85 : 0.98
          );
          map.setPaintProperty(layer.id, 'line-width', [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 1.5,
            13, 3.0,
            16, 5.5,
            18, 9.0,
          ]);
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  // ─── Ultra-HD Real Satellite Layer (Retina / 2x High-DPI Tiles) ─────────────
  const addSatelliteLayer = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('satellite-source')) {
      map.addSource('satellite-source', {
        type: 'raster',
        tiles: [
          'https://mt0.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&scale=2',
          'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&scale=2',
          'https://mt2.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&scale=2',
          'https://mt3.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&scale=2',
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: 'Google Satellite',
      });
    }

    if (!map.getLayer('satellite-layer')) {
      const layers = map.getStyle().layers || [];
      let beforeId: string | undefined;
      for (const l of layers) {
        if (l.type === 'line' || l.type === 'symbol' || l.id === 'kecamatan-fill') {
          beforeId = l.id;
          break;
        }
      }

      map.addLayer(
        {
          id: 'satellite-layer',
          type: 'raster',
          source: 'satellite-source',
          layout: {
            visibility: mapStyleRef.current === 'satelit' ? 'visible' : 'none',
          },
          paint: {
            'raster-opacity': 1.0,
            'raster-resampling': 'linear',
            'raster-fade-duration': 200,
          },
        },
        beforeId
      );
    }
  }, []);

  // ─── 3D Extruded Buildings Layer (Realistic Indonesian Architectural Colors) ──
  const add3DBuildingsLayer = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('composite')) return;
    if (map.getLayer('3d-buildings')) return;

    const layers = map.getStyle().layers || [];
    let labelLayerId: string | undefined;
    for (const layer of layers) {
      if (layer.type === 'symbol' && layer.layout && (layer.layout as any)['text-field']) {
        labelLayerId = layer.id;
        break;
      }
    }

    const isSat = mapStyleRef.current === 'satelit';

    map.addLayer(
      {
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['any', ['==', 'extrude', 'true'], ['has', 'height'], ['has', 'levels'], ['has', 'building:levels']],
        type: 'fill-extrusion',
        minzoom: 12,
        layout: {
          visibility: is3DModeRef.current ? 'visible' : 'none',
        },
        paint: {
          'fill-extrusion-color': [
            'case',
            // 1. Kategori tipe spesifik bangunan OpenStreetMap jika ada
            ['in', ['get', 'type'], ['literal', ['residential', 'house', 'apartments', 'detached', 'terrace', 'home']]],
            '#C86146', // Genteng merah bata khas perumahan Surabaya
            ['in', ['get', 'type'], ['literal', ['commercial', 'office']]],
            [
              'case',
              ['>=', ['coalesce', ['get', 'height'], 0], 35],
              '#3B7EA1', // Menara perkantoran modern kaca biru
              '#D4C4B5', // Ruko / kantor sedang warm sandstone
            ],
            ['in', ['get', 'type'], ['literal', ['retail', 'supermarket', 'mall']]],
            '#788A9C', // Mall & pusat perbelanjaan metal stone
            ['in', ['get', 'type'], ['literal', ['hospital', 'clinic']]],
            '#3FA796', // Rumah sakit / fasilitas medis teal clean
            ['in', ['get', 'type'], ['literal', ['school', 'university', 'kindergarten', 'college']]],
            '#D97C38', // Sekolah / kampus batu bata oranye hangat
            ['in', ['get', 'type'], ['literal', ['industrial', 'warehouse']]],
            '#8E9DAE', // Pabrik / pergudangan plat baja perak
            ['in', ['get', 'type'], ['literal', ['mosque', 'place_of_worship']]],
            '#2E7D32', // Tempat ibadah kubah hijau

            // 2. Fallback cerdas berdasarkan ketinggian bangunan di Surabaya:
            [
              'interpolate',
              ['linear'],
              ['coalesce', ['get', 'height'], ['*', ['get', 'building:levels'], 3.2], ['*', ['get', 'levels'], 3.2], 8],
              0,   '#C86146', // < 12m: Rumah warga genteng merah bata terracotta
              12,  '#B8553C', // 12m (3-4 lantai): Ruko & perumahan padat genteng bata
              20,  '#D4C2AF', // 20m (5-7 lantai): Gedung sedang krem sandstone
              35,  '#5B8CB5', // 35m (10+ lantai): Menara kaca biru
              65,  '#356D9B', // 65m (20 lantai): Pencakar langit biru laut
              120, '#1E4C75', // 120m+ (Skyscraper): Deep Navy Blue Glass (seperti TP / Pakuwon)
            ],
          ] as any,
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            13.5,
            ['coalesce', ['get', 'height'], ['*', ['get', 'building:levels'], 3.2], ['*', ['get', 'levels'], 3.2], 8],
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            12,
            0,
            13.5,
            ['coalesce', ['get', 'min_height'], 0],
          ],
          'fill-extrusion-opacity': isSat ? 0.38 : 0.92,
          'fill-extrusion-vertical-gradient': true,
        },
      },
      labelLayerId
    );
  }, []);

  // ─── 3D Atmospheric Fog ────────────────────────────────────────────────────
  const setAtmosphereFog = useCallback((map: mapboxgl.Map, active: boolean) => {
    try {
      if (active) {
        map.setFog({
          range: [-1, 2],
          color: 'rgba(255, 255, 255, 0.65)',
          'horizon-blend': 0.15,
          'high-color': '#7097c2',
          'space-color': '#0f172a',
          'star-intensity': 0.25,
        });
      } else {
        map.setFog(null as any);
      }
    } catch {
      /* gracefully ignore if fog is unsupported */
    }
  }, []);

  // ─── Kecamatan layers ─────────────────────────────────────────────────────
  const addKecamatanLayers = useCallback((map: mapboxgl.Map) => {
    const isSat = mapStyleRef.current === 'satelit';
    const currentKec = (filterRef.current?.kecamatan || '').toLowerCase();

    if (!map.getSource('kecamatan-source')) {
      map.addSource('kecamatan-source', {
        type: 'geojson',
        data: '/data/kecamatan-surabaya.geojson',
      });
    }

    if (!map.getLayer('kecamatan-fill')) {
      map.addLayer({
        id: 'kecamatan-fill',
        type: 'fill',
        source: 'kecamatan-source',
        paint: {
          'fill-color': '#D4C9B2',
          'fill-opacity': [
            'case',
            ['==', ['downcase', ['get', 'name']], currentKec],
            0.32,
            0,
          ],
        },
      });
    }

    if (!map.getLayer('kecamatan-border')) {
      map.addLayer({
        id: 'kecamatan-border',
        type: 'line',
        source: 'kecamatan-source',
        paint: {
          'line-color': isSat ? '#FAF6EE' : '#B8AC94',
          'line-width': [
            'case',
            ['==', ['downcase', ['get', 'name']], currentKec],
            2,
            1,
          ],
          'line-opacity': 0.75,
        },
      });
    }

    // ── Choropleth label (nama kecamatan + jumlah laporan, muncul di mode choropleth) ──
    if (!map.getLayer('kecamatan-label')) {
      map.addLayer({
        id: 'kecamatan-label',
        type: 'symbol',
        source: 'kecamatan-source',
        layout: {
          visibility: 'none',
          'text-field': ['get', 'name'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
          'text-size': 11,
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#1E1B16',
          'text-halo-color': '#FAF6EE',
          'text-halo-width': 1.5,
          'text-opacity': 0.9,
        },
      });
    }
  }, []);

  // ─── Report layers ────────────────────────────────────────────────────────
  const addReportLayers = useCallback(
    (map: mapboxgl.Map) => {
      const isSat = mapStyleRef.current === 'satelit';

      if (!map.getSource('reports-source')) {
        map.addSource('reports-source', {
          type: 'geojson',
          data: reportsToGeoJSON(filteredReportsRef.current),
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 40,
          clusterProperties: {
            has_critical: ['any', ['>=', ['get', 'skorUrgensi'], 80]],
            inf_count: ['+', ['case', ['==', ['get', 'category'], 'INFRASTRUKTUR'], 1, 0]],
            keb_count: ['+', ['case', ['==', ['get', 'category'], 'KEBERSIHAN'], 1, 0]],
            kea_count: ['+', ['case', ['==', ['get', 'category'], 'KEAMANAN'], 1, 0]],
            ban_count: ['+', ['case', ['==', ['get', 'category'], 'BANJIR'], 1, 0]],
            lai_count: ['+', ['case', ['==', ['get', 'category'], 'LAINNYA'], 1, 0]],
          },
        });
      } else {
        (map.getSource('reports-source') as mapboxgl.GeoJSONSource).setData(
          reportsToGeoJSON(filteredReportsRef.current)
        );
      }

      // Heatmap layer
      if (!map.getLayer('reports-heatmap')) {
        map.addLayer({
          id: 'reports-heatmap',
          type: 'heatmap',
          source: 'reports-source',
          maxzoom: 16,
          layout: { visibility: isHeatmapModeRef.current ? 'visible' : 'none' },
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'skorUrgensi'], 0, 0.25, 100, 1.3],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 1.1, 15, 3.2],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0,    'rgba(0,0,0,0)',
              0.15, 'rgba(42,127,134,0.65)',
              0.35, 'rgba(94,124,74,0.8)',
              0.60, 'rgba(230,126,34,0.9)',
              0.85, 'rgba(192,57,43,0.95)',
              1,    'rgba(120,20,15,1)',
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 22, 13, 38, 16, 55],
            'heatmap-opacity': 0.85,
          },
        });
      }

      // Clusters
      if (!map.getLayer('clusters')) {
        map.addLayer({
          id: 'clusters',
          type: 'circle',
          source: 'reports-source',
          filter: ['has', 'point_count'],
          layout: { visibility: isHeatmapModeRef.current ? 'none' : 'visible' },
          paint: {
            'circle-color': [
              'case',
              ['>=', ['get', 'ban_count'], ['max', ['get', 'inf_count'], ['get', 'keb_count'], ['get', 'kea_count'], ['get', 'lai_count']]],
              '#2A7F86',
              ['>=', ['get', 'inf_count'], ['max', ['get', 'keb_count'], ['get', 'kea_count'], ['get', 'lai_count']]],
              '#3E5C76',
              ['>=', ['get', 'keb_count'], ['max', ['get', 'kea_count'], ['get', 'lai_count']]],
              '#5E7C4A',
              ['>=', ['get', 'kea_count'], ['get', 'lai_count']],
              '#5B3F6E',
              '#8A7F70',
            ],
            'circle-radius': ['step', ['get', 'point_count'], 15, 10, 20, 30, 25, 60, 30],
            'circle-stroke-width': ['case', ['get', 'has_critical'], 3, 1.8],
            'circle-stroke-color': ['case', ['get', 'has_critical'], '#C0392B', isSat ? '#FAF6EE' : '#1E1B16'],
            'circle-opacity': 0.94,
          },
        });
      }

      if (!map.getLayer('cluster-count')) {
        map.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'reports-source',
          filter: ['has', 'point_count'],
          layout: {
            visibility: isHeatmapModeRef.current ? 'none' : 'visible',
            'text-field': ['get', 'point_count_abbreviated'],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#FAF6EE' },
        });
      }

      if (!map.getLayer('unclustered-point')) {
        map.addLayer({
          id: 'unclustered-point',
          type: 'circle',
          source: 'reports-source',
          filter: ['!', ['has', 'point_count']],
          paint: { 'circle-radius': 1, 'circle-opacity': 0 },
        });
      }

      // ── Radius circle source & layers (untuk location picking) ──────────
      if (!map.getSource('radius-circle-source')) {
        map.addSource('radius-circle-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
        map.addLayer({
          id: 'radius-circle-fill',
          type: 'fill',
          source: 'radius-circle-source',
          paint: { 'fill-color': '#1E3A5F', 'fill-opacity': 0.08 },
        });
        map.addLayer({
          id: 'radius-circle-border',
          type: 'line',
          source: 'radius-circle-source',
          paint: {
            'line-color': '#1E3A5F',
            'line-width': 1.5,
            'line-opacity': 0.5,
            'line-dasharray': [4, 3],
          },
        });
      }

      map.off('click', 'clusters', handleClusterClick);
      map.on('click', 'clusters', handleClusterClick);
      map.off('mouseenter', 'clusters', handleMouseEnter);
      map.on('mouseenter', 'clusters', handleMouseEnter);
      map.off('mouseleave', 'clusters', handleMouseLeave);
      map.on('mouseleave', 'clusters', handleMouseLeave);

      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
      updateCustomMarkers();
    },
    [handleClusterClick, handleMouseEnter, handleMouseLeave, updateCustomMarkers]
  );

  // ─── Init map ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES.peta,
      center: SURABAYA_CENTER,
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: SURABAYA_BOUNDS,
      pitch: 0,
      bearing: 0,
      pitchWithRotate: true,
      dragRotate: true,
      touchPitch: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, visualizePitch: true }), 'top-right');

    map.on('style.load', () => {
      try {
        map.setLight({
          anchor: 'viewport',
          color: '#ffffff',
          intensity: 0.55,
          position: [1.5, 180, 50],
        });
      } catch {
        /* ignore */
      }
      addSatelliteLayer(map);
      add3DBuildingsLayer(map);
      addKecamatanLayers(map);
      addReportLayers(map);
      applyRealisticWaterStyle(map, mapStyleRef.current);
      if (isInitialLoadRef.current) {
        debouncedFetchReports(map);
        isInitialLoadRef.current = false;
      }
    });
    map.on('moveend', () => { debouncedFetchReports(map); updateCustomMarkers(); });
    map.on('zoomend', updateCustomMarkers);
    map.on('sourcedata', (e) => {
      if (e.sourceId === 'reports-source' && e.isSourceLoaded) updateCustomMarkers();
    });
    map.on('click', (e) => onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

    mapRef.current = map;
    return () => {
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
      cctvMarkersRef.current.forEach((m) => m.remove());
      cctvMarkersRef.current = [];
      pumpMarkersRef.current.forEach((m) => m.remove());
      pumpMarkersRef.current = [];
      shipMarkersRef.current.forEach((m) => m.remove());
      shipMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [debouncedFetchReports, addSatelliteLayer, add3DBuildingsLayer, addKecamatanLayers, addReportLayers, applyRealisticWaterStyle, updateCustomMarkers]);

  // ─── Update data saat filteredReports berubah ────────────────────────────
  useEffect(() => {
    filteredReportsRef.current = filteredReports;
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource('reports-source') as mapboxgl.GeoJSONSource | undefined;
    source?.setData(reportsToGeoJSON(filteredReports));
    markersOnScreenRef.current.forEach((m) => m.remove());
    markersOnScreenRef.current.clear();
    updateCustomMarkers();
  }, [filteredReports, updateCustomMarkers]);

  // ─── Fly to selected report ──────────────────────────────────────────────
  useEffect(() => {
    if (selectedReport && mapRef.current) {
      mapRef.current.flyTo({
        center: [selectedReport.longitude, selectedReport.latitude],
        zoom: Math.max(mapRef.current.getZoom(), 15),
        duration: 800,
        essential: true,
      });
    }
  }, [selectedReport]);

  // ─── Kecamatan filter → highlight + fitBounds ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const currentKec = (filter.kecamatan || '').toLowerCase();

    // Jika choropleth aktif, jangan override fill-color
    if (!isChoroplethModeRef.current) {
      if (map.getLayer('kecamatan-fill')) {
        map.setPaintProperty('kecamatan-fill', 'fill-opacity', [
          'case',
          ['==', ['downcase', ['get', 'name']], currentKec],
          0.22,
          0,
        ]);
      }
    }

    if (map.getLayer('kecamatan-border')) {
      map.setPaintProperty('kecamatan-border', 'line-width', [
        'case',
        ['==', ['downcase', ['get', 'name']], currentKec],
        2.2,
        1.2,
      ]);
    }

    if (filter.kecamatan) {
      fetchKecamatanGeoJSON().then((geojson) => {
        const bounds = getKecamatanBounds(filter.kecamatan!, geojson);
        if (bounds && mapRef.current) {
          mapRef.current.fitBounds(bounds, { padding: 50, maxZoom: 14.5, duration: 800 });
        }
      });
    } else if (!isInitialLoadRef.current) {
      map.fitBounds(SURABAYA_BOUNDS, { padding: 20, duration: 800 });
    }
  }, [filter.kecamatan]);

  // ─── Cursor picking ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.getCanvas().style.cursor = isPickingLocation ? 'crosshair' : '';
  }, [isPickingLocation]);

  // ─── Task #7: Radius circle saat location dipilih ────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const source = map.getSource('radius-circle-source') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    if (pickedLocation) {
      source.setData(makeCircleGeoJSON(pickedLocation.lng, pickedLocation.lat, 0.5));
    } else {
      source.setData({ type: 'FeatureCollection', features: [] });
    }
  }, [pickedLocation]);

  // ─── Task #4: Choropleth — apply density colors ke kecamatan-fill ─────────
  const applyChoroplethColors = useCallback(
    (map: mapboxgl.Map, data: KecamatanDensityItem[], max: number) => {
      if (!map.getLayer('kecamatan-fill')) return;
      const safeMax = Math.max(max, 1);

      // Data-driven interpolation: lebih banyak laporan = lebih gelap merah
      // Bangun match expression: ['match', ['downcase', ['get','name']], kec1, color1, ..., fallback]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchExpr: any[] = ['match', ['downcase', ['get', 'name']]];

      for (const item of data) {
        const ratio = item.total / safeMax;
        const r = Math.round(192 + (192 - 30) * 0 + ratio * (220 - 192));    // merah
        const g = Math.round(215 - ratio * 150);   // hijau berkurang
        const b = Math.round(210 - ratio * 180);   // biru berkurang
        // Interpolasi dari hijau-biru → merah tua
        const color =
          ratio < 0.2
            ? '#C6E8D0'
            : ratio < 0.4
            ? '#A0D1A8'
            : ratio < 0.6
            ? '#F5C842'
            : ratio < 0.8
            ? '#F07A30'
            : '#C0392B';
        matchExpr.push(item.kecamatan.toLowerCase(), color);
      }

      matchExpr.push('#E8E0D4'); // fallback (kecamatan tanpa laporan)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setPaintProperty('kecamatan-fill', 'fill-color', matchExpr as any);
      map.setPaintProperty('kecamatan-fill', 'fill-opacity', 0.65);
    },
    []
  );

  const clearChoroplethColors = useCallback((map: mapboxgl.Map) => {
    if (!map.getLayer('kecamatan-fill')) return;
    const currentKec = (filterRef.current?.kecamatan || '').toLowerCase();
    map.setPaintProperty('kecamatan-fill', 'fill-color', '#D4C9B2');
    map.setPaintProperty('kecamatan-fill', 'fill-opacity', [
      'case',
      ['==', ['downcase', ['get', 'name']], currentKec],
      0.22,
      0,
    ]);
  }, []);

  // ─── Task #4: Toggle Choropleth ───────────────────────────────────────────
  const handleToggleChoropleth = useCallback(async () => {
    const next = !isChoroplethMode;
    setIsChoroplethMode(next);
    isChoroplethModeRef.current = next;

    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (next) {
      // Fetch density data (cache setelah pertama)
      let data = densityData;
      let max = maxDensity;
      if (!densityLoadedRef.current) {
        try {
          const res = await statsApi.kecamatanDensity();
          data = res.density;
          max = res.maxTotal;
          setDensityData(data);
          setMaxDensity(max);
          densityLoadedRef.current = true;
        } catch {
          /* fallback gracefully */
        }
      }
      applyChoroplethColors(map, data, max);
      if (map.getLayer('kecamatan-label'))
        map.setLayoutProperty('kecamatan-label', 'visibility', 'visible');
      // Sembunyikan cluster & marker agar choropleth terlihat jelas
      if (map.getLayer('clusters')) map.setLayoutProperty('clusters', 'visibility', 'none');
      if (map.getLayer('cluster-count')) map.setLayoutProperty('cluster-count', 'visibility', 'none');
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
    } else {
      clearChoroplethColors(map);
      if (map.getLayer('kecamatan-label'))
        map.setLayoutProperty('kecamatan-label', 'visibility', 'none');
      if (!isHeatmapModeRef.current) {
        if (map.getLayer('clusters')) map.setLayoutProperty('clusters', 'visibility', 'visible');
        if (map.getLayer('cluster-count')) map.setLayoutProperty('cluster-count', 'visibility', 'visible');
        updateCustomMarkers();
      }
    }
  }, [isChoroplethMode, densityData, maxDensity, applyChoroplethColors, clearChoroplethColors, updateCustomMarkers]);

  // ─── Task #6: Toggle Heatmap ──────────────────────────────────────────────
  const handleToggleHeatmap = useCallback(() => {
    const next = !isHeatmapMode;
    setIsHeatmapMode(next);
    isHeatmapModeRef.current = next;

    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('reports-heatmap'))
      map.setLayoutProperty('reports-heatmap', 'visibility', next ? 'visible' : 'none');

    if (!isChoroplethModeRef.current) {
      if (map.getLayer('clusters'))
        map.setLayoutProperty('clusters', 'visibility', next ? 'none' : 'visible');
      if (map.getLayer('cluster-count'))
        map.setLayoutProperty('cluster-count', 'visibility', next ? 'none' : 'visible');
    }

    if (next) {
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
    } else {
      updateCustomMarkers();
    }
  }, [isHeatmapMode, updateCustomMarkers]);

  const handleToggleStyle = useCallback(() => {
    const next: MapStyleMode = mapStyle === 'peta' ? 'satelit' : 'peta';
    setMapStyle(next);
    mapStyleRef.current = next;

    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('satellite-layer')) {
      map.setLayoutProperty('satellite-layer', 'visibility', next === 'satelit' ? 'visible' : 'none');
    }
    if (map.getLayer('kecamatan-border')) {
      map.setPaintProperty('kecamatan-border', 'line-color', next === 'satelit' ? '#FAF6EE' : '#B8AC94');
    }
    if (map.getLayer('3d-buildings')) {
      map.setPaintProperty('3d-buildings', 'fill-extrusion-opacity', next === 'satelit' ? 0.38 : 0.92);
    }
    applyRealisticWaterStyle(map, next);
  }, [mapStyle, applyRealisticWaterStyle]);

  const handleToggle3D = useCallback(() => {
    const next = !is3DMode;
    setIs3DMode(next);
    is3DModeRef.current = next;

    const map = mapRef.current;
    if (!map) return;

    if (next) {
      const currentZoom = map.getZoom();
      map.easeTo({
        pitch: 62,
        bearing: -18,
        zoom: currentZoom < 14.8 ? 15.2 : currentZoom,
        duration: 1200,
      });
      setAtmosphereFog(map, true);
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', 'visible');
      }
    } else {
      map.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000,
      });
      setAtmosphereFog(map, false);
      if (map.getLayer('3d-buildings')) {
        map.setLayoutProperty('3d-buildings', 'visibility', 'none');
      }
    }
  }, [is3DMode, setAtmosphereFog]);

  const removeCctvMarkers = useCallback(() => {
    cctvMarkersRef.current.forEach((m) => m.remove());
    cctvMarkersRef.current = [];
  }, []);

  const addCctvMarkers = useCallback(
    (data: CctvItem[]) => {
      const map = mapRef.current;
      if (!map) return;
      removeCctvMarkers();
      data.forEach((cctv) => {
        const el = createCctvPinElement(cctv, () => {
          setSelectedCctv(cctv);
          map.flyTo({
            center: [cctv.lng, cctv.lat],
            zoom: Math.max(map.getZoom(), 15.5),
            duration: 700,
          });
        });
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([cctv.lng, cctv.lat])
          .addTo(map);
        cctvMarkersRef.current.push(marker);
      });
    },
    [removeCctvMarkers]
  );

  const handleToggleCctv = useCallback(async () => {
    const next = !isCctvMode;
    setIsCctvMode(next);
    isCctvModeRef.current = next;

    if (next) {
      let items = cctvData;
      if (items.length === 0) {
        try {
          const res = await fetch('/data/cctv-surabaya.json');
          items = await res.json();
          setCctvData(items);
        } catch (err) {
          console.error('Failed to load CCTV data:', err);
        }
      }
      addCctvMarkers(items);
    } else {
      removeCctvMarkers();
    }
  }, [isCctvMode, cctvData, addCctvMarkers, removeCctvMarkers]);

  const handleViewReportsNearCctv = useCallback((cctv: CctvItem) => {
    setSelectedCctv(null);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [cctv.lng, cctv.lat],
        zoom: 16.5,
        duration: 800,
      });
    }
  }, []);

  const removePumpMarkers = useCallback(() => {
    pumpMarkersRef.current.forEach((m) => m.remove());
    pumpMarkersRef.current = [];
  }, []);

  const addPumpMarkers = useCallback(
    (data: WaterPumpItem[]) => {
      const map = mapRef.current;
      if (!map) return;
      removePumpMarkers();
      data.forEach((pump) => {
        const el = createWaterPumpPinElement(pump, () => {
          setSelectedPump(pump);
          map.flyTo({
            center: [pump.lng, pump.lat],
            zoom: Math.max(map.getZoom(), 15.5),
            duration: 700,
          });
        });
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([pump.lng, pump.lat])
          .addTo(map);
        pumpMarkersRef.current.push(marker);
      });
    },
    [removePumpMarkers]
  );

  const handleTogglePump = useCallback(async () => {
    const next = !isPumpMode;
    setIsPumpMode(next);
    isPumpModeRef.current = next;

    if (next) {
      let items = pumpData;
      if (items.length === 0) {
        try {
          const res = await fetch('/data/water-pumps-surabaya.json');
          items = await res.json();
          setPumpData(items);
        } catch (err) {
          console.error('Failed to load pump data:', err);
        }
      }
      addPumpMarkers(items);
    } else {
      removePumpMarkers();
    }
  }, [isPumpMode, pumpData, addPumpMarkers, removePumpMarkers]);

  const handleViewReportsNearPump = useCallback((pump: WaterPumpItem) => {
    setSelectedPump(null);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [pump.lng, pump.lat],
        zoom: 16.5,
        duration: 800,
      });
    }
  }, []);

  const removeShipMarkers = useCallback(() => {
    shipMarkersRef.current.forEach((m) => m.remove());
    shipMarkersRef.current = [];
  }, []);

  const addShipMarkers = useCallback(
    (data: ShipItem[]) => {
      const map = mapRef.current;
      if (!map) return;
      removeShipMarkers();
      data.forEach((ship) => {
        const el = createShipPinElement(ship, () => {
          setSelectedShip(ship);
          map.flyTo({
            center: [ship.lng, ship.lat],
            zoom: Math.max(map.getZoom(), 14.8),
            duration: 700,
          });
        });
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([ship.lng, ship.lat])
          .addTo(map);
        shipMarkersRef.current.push(marker);
      });
    },
    [removeShipMarkers]
  );

  const handleToggleShip = useCallback(async () => {
    const next = !isShipMode;
    setIsShipMode(next);
    isShipModeRef.current = next;

    if (next) {
      let items = shipData;
      if (items.length === 0) {
        try {
          const res = await fetch('/data/maritime-surabaya.json');
          items = await res.json();
          setShipData(items);
        } catch (err) {
          console.error('Failed to load maritime data:', err);
        }
      }
      addShipMarkers(items);
    } else {
      removeShipMarkers();
    }
  }, [isShipMode, shipData, addShipMarkers, removeShipMarkers]);

  const handleFocusShip = useCallback((ship: ShipItem) => {
    setSelectedShip(null);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [ship.lng, ship.lat],
        zoom: 16,
        duration: 800,
      });
    }
  }, []);

  // ─── Radar Hujan Real-Time (RainViewer) ───────────────────────────────────
  const applyRainRadarFrame = useCallback((frame: { time: number; path: string }) => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const tileUrl = `https://tilecache.rainviewer.com${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
    const existingSource = map.getSource('rainviewer-radar-source') as mapboxgl.RasterTileSource | undefined;

    if (existingSource && typeof existingSource.setTiles === 'function') {
      existingSource.setTiles([tileUrl]);
      return;
    }

    if (map.getLayer('rainviewer-radar-layer')) {
      map.removeLayer('rainviewer-radar-layer');
    }
    if (map.getSource('rainviewer-radar-source')) {
      map.removeSource('rainviewer-radar-source');
    }

    map.addSource('rainviewer-radar-source', {
      type: 'raster',
      tiles: [tileUrl],
      tileSize: 256,
      minzoom: 0,
      maxzoom: 7,
    });

    map.addLayer({
      id: 'rainviewer-radar-layer',
      type: 'raster',
      source: 'rainviewer-radar-source',
      paint: {
        'raster-opacity': 0.68,
        'raster-fade-duration': 200,
      },
    });
  }, []);

  const removeRainRadarLayer = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('rainviewer-radar-layer')) {
      map.removeLayer('rainviewer-radar-layer');
    }
    if (map.getSource('rainviewer-radar-source')) {
      map.removeSource('rainviewer-radar-source');
    }
  }, []);

  const handleToggleRainRadar = useCallback(async () => {
    const next = !isRainRadarMode;
    setIsRainRadarMode(next);

    if (next) {
      let frames = rainFrames;
      if (frames.length === 0) {
        try {
          const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
          const json = await res.json();
          const past = json?.radar?.past || [];
          const nowcast = json?.radar?.nowcast || [];
          frames = [...past, ...nowcast];
          setRainFrames(frames);
        } catch {
          frames = [];
        }
      }
      if (frames.length > 0) {
        const latestIdx = frames.length - 1;
        setRainFrameIndex(latestIdx);
        applyRainRadarFrame(frames[latestIdx]);
        setIsRainPlaying(true);
      }
    } else {
      setIsRainPlaying(false);
      removeRainRadarLayer();
    }
  }, [isRainRadarMode, rainFrames, applyRainRadarFrame, removeRainRadarLayer]);

  useEffect(() => {
    if (!isRainRadarMode || rainFrames.length === 0) return;
    const frame = rainFrames[rainFrameIndex];
    if (frame) {
      applyRainRadarFrame(frame);
    }
  }, [isRainRadarMode, rainFrameIndex, rainFrames, applyRainRadarFrame]);

  useEffect(() => {
    if (!isRainRadarMode || !isRainPlaying || rainFrames.length <= 1) return;
    const timer = setInterval(() => {
      setRainFrameIndex((prev) => (prev + 1) % rainFrames.length);
    }, 950);
    return () => clearInterval(timer);
  }, [isRainRadarMode, isRainPlaying, rainFrames.length]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ── Tactical Command Bar (Osiris AI Situation Room) ── */}
      <TacticalCommandBar
        reports={filteredReports}
        cctvCount={40}
        pumpCount={20}
        shipCount={15}
        onSelectReport={(r) => onSelectReportRef.current(r)}
      />

      {/* ── Kontrol Peta ── */}
      <div className="absolute bottom-3 left-3 z-[10] flex flex-wrap items-center gap-1.5">
        {/* Style toggle: Peta vs Foto Satelit */}
        <button
          type="button"
          onClick={handleToggleStyle}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            mapStyle === 'satelit'
              ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-bold'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Beralih antara Peta Vektor dan Foto Satelit Asli"
        >
          {mapStyle === 'peta' ? (
            <><IconSatellite className="w-3.5 h-3.5 shrink-0" stroke={1.5} /><span>Satelit</span></>
          ) : (
            <><IconMap2 className="w-3.5 h-3.5 shrink-0" stroke={1.5} /><span>Peta Vektor</span></>
          )}
        </button>

        {/* 3D Mode toggle */}
        <button
          type="button"
          onClick={handleToggle3D}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            is3DMode
              ? 'bg-[#E67E22] text-white border-[#E67E22] font-bold shadow-sm'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Mode 3D — Sudut kamera miring & Gedung 3D Surabaya"
        >
          <Icon3dCubeSphere className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>{is3DMode ? '3D Aktif' : 'Mode 3D'}</span>
        </button>

        {/* Heatmap toggle */}
        <button
          type="button"
          onClick={handleToggleHeatmap}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isHeatmapMode
              ? 'bg-[#C0392B] text-white border-[#C0392B] font-bold'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Peta panas — kepadatan & urgensi laporan"
        >
          <IconFlame className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Heatmap{isHeatmapMode ? ' ✓' : ''}</span>
        </button>

        {/* Choropleth toggle */}
        <button
          type="button"
          onClick={handleToggleChoropleth}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isChoroplethMode
              ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-bold'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Choropleth — kepadatan laporan per kecamatan"
        >
          <IconChartBar className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Choropleth{isChoroplethMode ? ' ✓' : ''}</span>
        </button>

        {/* CCTV toggle */}
        <button
          type="button"
          onClick={handleToggleCctv}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isCctvMode
              ? 'bg-[#002b1b] text-[#00ff88] border-[#00ff88] font-bold shadow-[0_0_8px_rgba(0,255,136,0.35)]'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Layer CCTV — Titik kamera CCTV pantauan lalu lintas Surabaya"
        >
          <IconDeviceCctv className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>CCTV{isCctvMode ? ' Aktif' : ''}</span>
        </button>

        {/* Sensor Pompa Air toggle */}
        <button
          type="button"
          onClick={handleTogglePump}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isPumpMode
              ? 'bg-[#06182c] text-[#00d2ff] border-[#00d2ff] font-bold shadow-[0_0_8px_rgba(0,210,255,0.35)]'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Layer Sensor Air & Rumah Pompa — Pantauan ketinggian air (TMA) dan status pompa Surabaya"
        >
          <IconDroplet className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Pompa Air{isPumpMode ? ' Aktif' : ''}</span>
        </button>

        {/* Radar Maritim AIS toggle */}
        <button
          type="button"
          onClick={handleToggleShip}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isShipMode
              ? 'bg-[#051c14] text-[#00ffaa] border-[#00ffaa] font-bold shadow-[0_0_8px_rgba(0,255,170,0.35)]'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Radar Maritim & Transponder AIS — Pantauan posisi kapal Pelabuhan Tanjung Perak & Selat Madura"
        >
          <IconShip className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Radar Kapal{isShipMode ? ' Aktif' : ''}</span>
        </button>

        {/* Peta Hujan (Radar Cuaca Real-Time) toggle */}
        <button
          type="button"
          onClick={handleToggleRainRadar}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isRainRadarMode
              ? 'bg-[#082f49] text-[#38bdf8] border-[#38bdf8] font-bold shadow-[0_0_8px_rgba(56,189,248,0.4)]'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Peta Hujan — Overlay radar curah hujan real-time di atas wilayah Surabaya"
        >
          <IconRadar className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Peta Hujan{isRainRadarMode ? ' Aktif' : ''}</span>
        </button>

        {/* Forecast & Prediksi Cuaca modal trigger */}
        <button
          type="button"
          onClick={() => setIsWeatherModalOpen(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 border text-xs font-sans font-medium active:translate-y-[1px] transition-all select-none shadow-xs ${
            isWeatherModalOpen
              ? 'bg-[#1E3A5F] text-white border-[#1E3A5F] font-bold'
              : 'bg-paper-white text-ink border-ink hover:bg-paper-kraft'
          }`}
          title="Forecast & Prediksi Cuaca Surabaya (BMKG & Nowcast 24 Jam)"
        >
          <IconCloudRain className="w-3.5 h-3.5 shrink-0" stroke={1.8} />
          <span>Forecast Cuaca</span>
        </button>
      </div>

      {/* ── Task #6: Heatmap Legend ── */}
      {isHeatmapMode && (
        <div className="absolute top-3 left-3 z-[10] bg-paper-white/95 border border-ink px-3 py-2 shadow-sm select-none">
          <p className="text-[10px] font-bold font-sans text-ink mb-1.5 uppercase tracking-wider">
            Peta Panas Urgensi
          </p>
          <div className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-28 rounded-sm shrink-0"
              style={{
                background:
                  'linear-gradient(to right, rgba(42,127,134,0.65), rgba(94,124,74,0.8), rgba(230,126,34,0.9), rgba(192,57,43,0.95), rgba(120,20,15,1))',
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-ink/60 mt-0.5 w-28">
            <span>Rendah</span>
            <span>Kritis</span>
          </div>
        </div>
      )}

      {/* ── Task #4: Choropleth Legend ── */}
      {isChoroplethMode && (
        <div className="absolute top-3 left-3 z-[10] bg-paper-white/95 border border-ink px-3 py-2 shadow-sm select-none min-w-[160px]">
          <p className="text-[10px] font-bold font-sans text-ink mb-1.5 uppercase tracking-wider">
            Kepadatan per Kecamatan
          </p>
          <div className="space-y-1">
            {[
              { color: '#C6E8D0', label: 'Sangat rendah (< 20%)' },
              { color: '#A0D1A8', label: 'Rendah (20–40%)' },
              { color: '#F5C842', label: 'Sedang (40–60%)' },
              { color: '#F07A30', label: 'Tinggi (60–80%)' },
              { color: '#C0392B', label: 'Sangat tinggi (> 80%)' },
            ].map(({ color, label }) => (
              <div key={color} className="flex items-center gap-2">
                <div
                  className="w-4 h-3 rounded-sm border border-ink/20 shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] font-sans text-ink/70">{label}</span>
              </div>
            ))}
          </div>
          {densityData.length > 0 && (
            <p className="text-[9px] font-mono text-ink/50 mt-1.5 border-t border-ink/10 pt-1">
              Maks: {maxDensity} laporan
            </p>
          )}
        </div>
      )}

      {/* ── Task #7: Picking location banner + radius hint ── */}
      {isPickingLocation && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
          <div className="bg-paper-white text-ink px-4 py-2 border border-ink text-xs font-sans font-medium shadow-md">
            Klik titik pada peta untuk memilih lokasi laporan
          </div>
        </div>
      )}

      {/* Radius info badge saat lokasi sudah dipilih */}
      {pickedLocation && !isPickingLocation && (
        <div className="absolute top-3 right-3 z-[10] bg-paper-white/95 border border-navy px-3 py-1.5 shadow-sm flex items-center gap-1.5">
          <IconCircleDot className="w-3.5 h-3.5 text-navy shrink-0" stroke={1.8} />
          <span className="text-[10px] font-sans font-medium text-navy">
            Radius 500m dari titik laporan
          </span>
        </div>
      )}

      {/* 3D Mode Hint Banner */}
      {is3DMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10] bg-paper-white/95 border border-ink px-3 py-1.5 text-[11px] font-sans font-medium text-ink shadow-sm pointer-events-none flex items-center gap-1.5 rounded-sm">
          <Icon3dCubeSphere className="w-4 h-4 text-orange shrink-0" />
          <span><b>Mode 3D Aktif:</b> Tahan <b>Klik Kanan</b> atau <b>Ctrl + Geser Mouse</b> untuk rotasi & kemiringan 3D</span>
        </div>
      )}

      {/* ── Atribusi ── */}
      <div className="absolute bottom-14 right-3 z-[10] hidden sm:block px-2.5 py-1 bg-paper-white/95 border border-ink text-[10px] font-mono text-ink/80 select-none shadow-sm pointer-events-none">
        Batas Wilayah: Pemkot Surabaya (Satu Data / Perwali No. 26/2023)
      </div>

      {/* ── CCTV Modal Detail & Live Stream ── */}
      {selectedCctv && (
        <CctvModal
          cctv={selectedCctv}
          onClose={() => setSelectedCctv(null)}
          onViewReports={handleViewReportsNearCctv}
        />
      )}

      {/* ── Water Sensor & Pump Modal ── */}
      {selectedPump && (
        <WaterSensorModal
          pump={selectedPump}
          onClose={() => setSelectedPump(null)}
          onViewReports={handleViewReportsNearPump}
        />
      )}

      {/* ── Maritime Vessel Modal ── */}
      {selectedShip && (
        <ShipModal
          ship={selectedShip}
          onClose={() => setSelectedShip(null)}
          onFocusShip={handleFocusShip}
        />
      )}

      {/* ── Radar Hujan Floating Controller ── */}
      {isRainRadarMode && rainFrames.length > 0 && (
        <div
          className="absolute top-14 right-3 z-[12] rounded-xl p-2.5 shadow-xl select-none w-[240px] backdrop-blur-md"
          style={{
            background: 'rgba(6, 16, 30, 0.9)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[10px] font-mono font-bold text-sky-300 uppercase">RADAR PETA HUJAN</span>
            </div>
            <button
              type="button"
              onClick={() => setIsWeatherModalOpen(true)}
              className="text-[10px] font-mono text-amber-300 hover:underline"
            >
              Forecast
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRainPlaying((p) => !p)}
              className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-300 flex items-center justify-center hover:bg-sky-500/30 shrink-0"
              title={isRainPlaying ? 'Jeda Animasi Radar' : 'Putar Animasi Radar'}
            >
              {isRainPlaying ? <IconPlayerPause size={13} /> : <IconPlayerPlay size={13} />}
            </button>
            <input
              type="range"
              min={0}
              max={rainFrames.length - 1}
              value={rainFrameIndex}
              onChange={(e) => {
                setIsRainPlaying(false);
                setRainFrameIndex(Number(e.target.value));
              }}
              className="w-full accent-sky-400 cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 mt-1.5">
            <span>
              {new Date(rainFrames[rainFrameIndex].time * 1000).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              })}{' '}
              WIB
            </span>
            <span className="text-slate-400">
              Frame {rainFrameIndex + 1}/{rainFrames.length}
            </span>
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/10">
            <div
              className="h-2 rounded-sm w-full"
              style={{
                background: 'linear-gradient(to right, #38bdf8, #22c55e, #eab308, #f97316, #ef4444)',
              }}
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
              <span>Ringan</span>
              <span>Sedang</span>
              <span>Lebat</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Forecast & Prediksi Cuaca Modal ── */}
      {isWeatherModalOpen && (
        <WeatherForecastModal
          onClose={() => setIsWeatherModalOpen(false)}
          isRainRadarActive={isRainRadarMode}
          onToggleRainRadar={handleToggleRainRadar}
        />
      )}
    </div>
  );
};

export default MapView;
