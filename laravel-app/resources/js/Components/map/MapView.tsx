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
} from '@tabler/icons-react';
import { Report } from '../../types';
import { useReportsStore } from '../../stores/reportsStore';
import { createPinElement, PIN_STYLE } from './markers/createPin';
import { fetchKecamatanGeoJSON, getKecamatanBounds } from '../../lib/kecamatan';
import { statsApi } from '../../lib/api';

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
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    map.on('style.load', () => {
      addKecamatanLayers(map);
      addReportLayers(map);
      if (isInitialLoadRef.current) {
        debouncedFetchReports(map);
        isInitialLoadRef.current = false;
      }
    });
    map.on('moveend', () => { debouncedFetchReports(map); updateCustomMarkers(); });
    map.on('zoomend', updateCustomMarkers);
    map.on('idle', updateCustomMarkers);
    map.on('sourcedata', (e) => {
      if (e.sourceId === 'reports-source' && e.isSourceLoaded) updateCustomMarkers();
    });
    map.on('click', (e) => onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng }));

    mapRef.current = map;
    return () => {
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [debouncedFetchReports, addKecamatanLayers, addReportLayers, updateCustomMarkers]);

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
    mapRef.current?.setStyle(MAP_STYLES[next]);
  }, [mapStyle]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ── Kontrol Peta ── */}
      <div className="absolute bottom-3 left-3 z-[10] flex flex-wrap items-center gap-1.5">
        {/* Style toggle */}
        <button
          type="button"
          onClick={handleToggleStyle}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper-white text-ink border border-ink text-xs font-sans font-medium hover:bg-paper-kraft active:translate-y-[1px] transition-colors select-none shadow-xs"
        >
          {mapStyle === 'peta' ? (
            <><IconSatellite className="w-3.5 h-3.5 shrink-0" stroke={1.5} /><span>Satelit</span></>
          ) : (
            <><IconMap2 className="w-3.5 h-3.5 shrink-0" stroke={1.5} /><span>Peta</span></>
          )}
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

      {/* ── Atribusi ── */}
      <div className="absolute bottom-3 right-3 z-[10] hidden sm:block px-2.5 py-1 bg-paper-white/95 border border-ink text-[10px] font-mono text-ink/80 select-none shadow-sm pointer-events-none">
        Batas Wilayah: Pemkot Surabaya (Satu Data / Perwali No. 26/2023)
      </div>
    </div>
  );
};

export default MapView;
