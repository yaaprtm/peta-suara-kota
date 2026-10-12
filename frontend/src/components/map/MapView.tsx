import React, { useEffect, useRef, useCallback, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  IconAlertTriangle,
  IconKey,
  IconMap2,
  IconSatellite,
} from '@tabler/icons-react';
import { Report } from '../../types';
import { useReportsStore } from '../../stores/reportsStore';

// ─── Mapbox Access Token Setup & Validation ───────────────────────────────────
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// ─── Style Peta (Peta Gelap & Satelit) ─────────────────────────────────────────
export type MapStyleMode = 'peta' | 'satelit';

const MAP_STYLES: Record<MapStyleMode, string> = {
  peta: 'mapbox://styles/mapbox/dark-v11',
  satelit: 'mapbox://styles/mapbox/satellite-streets-v12',
};

// ─── Default View & Batasan Wilayah Surabaya ──────────────────────────────────
const SURABAYA_CENTER: [number, number] = [112.7521, -7.2575]; // Titik tengah Surabaya
const DEFAULT_ZOOM = 12.5;
const MIN_ZOOM = 10.5;
const MAX_ZOOM = 18;

// Bounding box administratif wilayah Surabaya
const SURABAYA_BOUNDS: [[number, number], [number, number]] = [
  [112.55, -7.38], // Barat Daya (Southwest Surabaya)
  [112.92, -7.15], // Timur Laut (Northeast Surabaya)
];

// Helper: Buat gambar teardrop pin canvas untuk Mapbox image
function createTeardropImageData(
  color: string,
  width = 24,
  height = 32,
  isSatellite = false
) {
  const canvas = document.createElement('canvas');
  canvas.width = width * 2;
  canvas.height = height * 2;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(2, 2);

  const r = width / 2 - 2;
  const cx = width / 2;
  const cy = r + 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 0.2, false);
  ctx.lineTo(cx, height - 2);
  ctx.closePath();

  ctx.fillStyle = color;
  ctx.fill();

  if (isSatellite) {
    // Mode satelit: outline putih/krem (#FAF6EE) selebar 2px agar kontras di atas citra satelit
    ctx.strokeStyle = '#FAF6EE';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else {
    // Mode peta gelap: outline asli #2B2822 selebar 1.8px (tidak diubah)
    ctx.strokeStyle = '#2B2822';
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }

  // Inner center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#FAF6EE';
  ctx.fill();

  return {
    width: width * 2,
    height: height * 2,
    data: ctx.getImageData(0, 0, width * 2, height * 2).data,
  };
}

// Helper: Convert array Report ke GeoJSON FeatureCollection
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
          geometry: {
            type: 'Point',
            coordinates: [r.longitude, r.latitude],
          },
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

// ─── Debounce Helper ─────────────────────────────────────────────────────────
function debounce<T extends (...args: any[]) => void>(fn: T, delayMs: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

// ─── Map Component ────────────────────────────────────────────────────────────

interface MapViewProps {
  onSelectReport: (report: Report) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  isPickingLocation: boolean;
}

const MapView: React.FC<MapViewProps> = ({ onSelectReport, onMapClick, isPickingLocation }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const crosshairRef = useRef<HTMLDivElement>(null);

  // State pilihan style peta (default: 'peta')
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('peta');
  const mapStyleRef = useRef<MapStyleMode>(mapStyle);
  mapStyleRef.current = mapStyle;

  const { filteredReports, selectedReport, fetchViewportReports } = useReportsStore();

  // Simpan data & props ke ref agar listener stabil dan tidak men-trigger re-attach yang tak perlu
  const filteredReportsRef = useRef(filteredReports);
  filteredReportsRef.current = filteredReports;

  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const isInitialLoadRef = useRef(true);

  // Validasi jika token kosong
  if (!MAPBOX_TOKEN) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#241F1B] p-6 text-ink">
        <div className="max-w-md w-full bg-paper-white p-6 border border-ink text-center">
          <div className="w-12 h-12 mx-auto mb-3 border border-ink bg-paper-kraft flex items-center justify-center text-ink">
            <IconKey className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-base font-bold font-sans text-ink mb-2">
            Mapbox Token Belum Dikonfigurasi
          </h3>
          <p className="text-xs text-ink/70 mb-4 leading-relaxed font-sans">
            Variabel environment <code className="bg-paper-kraft px-1.5 py-0.5 border border-ink text-ink font-mono text-xs">VITE_MAPBOX_TOKEN</code> belum diisi pada file <code className="bg-paper-kraft px-1.5 py-0.5 border border-ink text-ink font-mono text-xs">frontend/.env</code>.
          </p>
          <div className="bg-paper-kraft/40 border border-ink/40 p-2.5 text-left text-xs font-mono text-ink/80 mb-3 overflow-x-auto">
            VITE_MAPBOX_TOKEN=pk.eyJ1...
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs text-ink/70 font-sans">
            <IconAlertTriangle className="w-4 h-4 text-mustard shrink-0" />
            <span>Restart development server setelah token diisi.</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Debounced Viewport Fetcher (300ms) ──────────────────────────────────────
  const debouncedFetchReports = useRef(
    debounce((map: mapboxgl.Map) => {
      const bounds = map.getBounds();
      if (!bounds) return;
      const zoom = map.getZoom();
      const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`;
      fetchViewportReports(bbox, zoom);
    }, 300)
  ).current;

  // ─── Event Handlers untuk Layer Peta ─────────────────────────────────────────

  const handleClusterClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    const map = mapRef.current;
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    if (!features.length) return;
    const clusterId = features[0].properties?.cluster_id;
    const source = map.getSource('reports-source') as mapboxgl.GeoJSONSource | undefined;
    if (!source) return;

    source.getClusterExpansionZoom(clusterId, (err, zoom) => {
      if (err || zoom === undefined || zoom === null) return;
      const coords = (features[0].geometry as GeoJSON.Point).coordinates;
      map.easeTo({
        center: [coords[0], coords[1]],
        zoom: zoom,
        duration: 600,
      });
    });
  }, []);

  const handlePointClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!e.features || !e.features[0]) return;
    const props = e.features[0].properties as any;
    if (!props) return;

    try {
      const report: Report = {
        id: props.id,
        title: props.title,
        description: props.description,
        category: props.category,
        status: props.status,
        skorUrgensi: Number(props.skorUrgensi),
        latitude: (e.features[0].geometry as GeoJSON.Point).coordinates[1],
        longitude: (e.features[0].geometry as GeoJSON.Point).coordinates[0],
        address: props.address,
        photos: props.photos ? JSON.parse(props.photos) : [],
        urgensiKeywords: props.urgensiKeywords ? JSON.parse(props.urgensiKeywords) : [],
        userId: props.userId || '',
        createdAt: props.createdAt,
        updatedAt: props.updatedAt || props.createdAt,
        user: props.user ? JSON.parse(props.user) : { id: '', name: 'Warga' },
        kelurahan: props.kelurahan ? JSON.parse(props.kelurahan) : undefined,
      };
      onSelectReportRef.current(report);
    } catch (err) {
      console.error('Failed to parse report properties', err);
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = 'pointer';
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.getCanvas().style.cursor = '';
    }
  }, []);

  // ─── SATU Fungsi Penambahan Source & Layer Laporan ──────────────────────────
  const addReportLayers = useCallback((map: mapboxgl.Map) => {
    const isSatellite = mapStyleRef.current === 'satelit';

    // 1. Daftarkan custom teardrop pin icons sesuai mode (satelit vs peta gelap)
    const pinKritis = createTeardropImageData('#B23327', 28, 36, isSatellite);
    const pinTinggi = createTeardropImageData('#C9972F', 24, 32, isSatellite);
    const pinSedang = createTeardropImageData('#C9972F', 22, 30, isSatellite);
    const pinRendah = createTeardropImageData('#4A7A6E', 20, 26, isSatellite);

    if (map.hasImage('pin-kritis')) map.removeImage('pin-kritis');
    if (map.hasImage('pin-tinggi')) map.removeImage('pin-tinggi');
    if (map.hasImage('pin-sedang')) map.removeImage('pin-sedang');
    if (map.hasImage('pin-rendah')) map.removeImage('pin-rendah');

    map.addImage('pin-kritis', pinKritis);
    map.addImage('pin-tinggi', pinTinggi);
    map.addImage('pin-sedang', pinSedang);
    map.addImage('pin-rendah', pinRendah);

    // 2. Tambahkan GeoJSON Source laporan (menggunakan data yang sudah ada di store)
    if (!map.getSource('reports-source')) {
      map.addSource('reports-source', {
        type: 'geojson',
        data: reportsToGeoJSON(filteredReportsRef.current),
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 40,
      });
    } else {
      (map.getSource('reports-source') as mapboxgl.GeoJSONSource).setData(
        reportsToGeoJSON(filteredReportsRef.current)
      );
    }

    // 3. Layer Cluster Circles (Paper Board Stamp Bubble)
    // Di mode satelit diberi stroke putih/krem (#FAF6EE) 2px agar kontras
    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports-source',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#E8D9B5', // < 10: Paper kraft
            10,
            '#C9972F', // 10 - 49: Mustard
            50,
            '#B23327', // >= 50: Stamp Red
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            10,
            22,
            50,
            28,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': isSatellite ? '#FAF6EE' : '#2B2822',
          'circle-opacity': 0.95,
        },
      });
    }

    // 4. Layer Cluster Count Label
    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#2B2822',
        },
      });
    }

    // 5. Layer Unclustered Points (Teardrop Pins sesuai urgensi)
    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
        id: 'unclustered-point',
        type: 'symbol',
        source: 'reports-source',
        filter: ['!', ['has', 'point_count']],
        layout: {
          'icon-image': ['get', 'pinType'],
          'icon-size': 0.55,
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
        },
      });
    }

    // 6. Pasang event listener layer (lepaskan dulu agar tidak menumpuk ganda)
    map.off('click', 'clusters', handleClusterClick);
    map.on('click', 'clusters', handleClusterClick);

    map.off('click', 'unclustered-point', handlePointClick);
    map.on('click', 'unclustered-point', handlePointClick);

    map.off('mouseenter', 'clusters', handleMouseEnter);
    map.on('mouseenter', 'clusters', handleMouseEnter);

    map.off('mouseleave', 'clusters', handleMouseLeave);
    map.on('mouseleave', 'clusters', handleMouseLeave);

    map.off('mouseenter', 'unclustered-point', handleMouseEnter);
    map.on('mouseenter', 'unclustered-point', handleMouseEnter);

    map.off('mouseleave', 'unclustered-point', handleMouseLeave);
    map.on('mouseleave', 'unclustered-point', handleMouseLeave);
  }, [handleClusterClick, handlePointClick, handleMouseEnter, handleMouseLeave]);

  // ─── Initialize Mapbox GL Map ───────────────────────────────────────────────

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

    // Dipanggil pada event 'style.load' (bukan 'load') agar dijalankan ulang setiap kali style berganti
    const handleStyleLoad = () => {
      addReportLayers(map);

      // Hanya fetch data awal saat peta pertama kali diinisialisasi
      // Saat pergantian style, data TIDAK di-fetch ulang dari server
      if (isInitialLoadRef.current) {
        debouncedFetchReports(map);
        isInitialLoadRef.current = false;
      }
    };

    map.on('style.load', handleStyleLoad);

    // Event listener pergerakan / zoom peta
    map.on('moveend', () => {
      debouncedFetchReports(map);
    });

    // Click handler untuk pilih lokasi (jika mode picking location aktif)
    map.on('click', (e) => {
      onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [debouncedFetchReports, addReportLayers]);

  // ─── Update GeoJSON Data saat filteredReports berubah ───────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    const source = map.getSource('reports-source') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(reportsToGeoJSON(filteredReports));
    }
  }, [filteredReports]);

  // ─── Fly to Selected Report ───────────────────────────────────────────────
  useEffect(() => {
    if (selectedReport && mapRef.current) {
      const map = mapRef.current;
      map.flyTo({
        center: [selectedReport.longitude, selectedReport.latitude],
        zoom: Math.max(map.getZoom(), 15),
        duration: 800,
        essential: true,
      });
    }
  }, [selectedReport]);

  // ─── Picking location cursor ──────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    const canvas = mapRef.current.getCanvas();
    if (canvas) {
      canvas.style.cursor = isPickingLocation ? 'crosshair' : '';
    }
  }, [isPickingLocation]);

  // ─── Handler Pergantian Tampilan Peta ────────────────────────────────────────
  const handleToggleStyle = useCallback(() => {
    const nextStyle: MapStyleMode = mapStyle === 'peta' ? 'satelit' : 'peta';
    setMapStyle(nextStyle);
    mapStyleRef.current = nextStyle;

    if (mapRef.current) {
      // map.setStyle mempertahankan posisi kamera (center, zoom, pitch, bearing)
      mapRef.current.setStyle(MAP_STYLES[nextStyle]);
    }
  }, [mapStyle]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* ─── Tombol Ganti Tampilan Peta (Peta / Satelit) ────────────────────── */}
      <button
        type="button"
        onClick={handleToggleStyle}
        className="absolute bottom-3 left-3 z-[10] inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-paper-white text-ink border border-ink text-xs font-sans font-medium hover:bg-paper-kraft active:translate-y-[1px] transition-colors select-none"
        title={mapStyle === 'peta' ? 'Ganti ke tampilan Satelit' : 'Ganti ke tampilan Peta'}
      >
        {mapStyle === 'peta' ? (
          <>
            <IconSatellite className="w-3.5 h-3.5 shrink-0" stroke={1.5} />
            <span>Satelit</span>
          </>
        ) : (
          <>
            <IconMap2 className="w-3.5 h-3.5 shrink-0" stroke={1.5} />
            <span>Peta</span>
          </>
        )}
      </button>

      {isPickingLocation && (
        <div
          ref={crosshairRef}
          className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]"
        >
          <div className="bg-paper-white text-ink px-4 py-2 border border-ink text-xs font-sans font-medium shadow-md">
            Klik titik pada peta untuk memilih lokasi laporan
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
