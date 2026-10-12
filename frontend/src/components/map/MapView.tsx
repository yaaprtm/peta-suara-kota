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
import { createPinElement, PIN_STYLE } from './markers/createPin';
import { fetchKecamatanGeoJSON, getKecamatanBounds } from '../../lib/kecamatan';

// ─── Mapbox Access Token Setup & Validation ───────────────────────────────────
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
if (MAPBOX_TOKEN) {
  mapboxgl.accessToken = MAPBOX_TOKEN;
}

// ─── Style Peta (Peta Gelap & Satelit) ─────────────────────────────────────────
export type MapStyleMode = 'peta' | 'satelit';

const MAP_STYLES: Record<MapStyleMode, string> = {
  peta: 'mapbox://styles/mapbox/light-v11',
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

  const { filteredReports, selectedReport, filter, hoveredReportId, fetchViewportReports } = useReportsStore();

  const filterRef = useRef(filter);
  filterRef.current = filter;

  // Efek pulse pin saat kartu laporan di sidebar di-hover
  useEffect(() => {
    if (!hoveredReportId) {
      document.querySelectorAll('.pin-pulse-active').forEach((el) => {
        el.classList.remove('pin-pulse-active');
      });
      return;
    }
    const pinEl = document.getElementById(`map-pin-${hoveredReportId}`);
    if (pinEl) {
      const inner = pinEl.querySelector('.psk-pin-inner');
      inner?.classList.add('pin-pulse-active');
    }
  }, [hoveredReportId]);

  // Simpan data & props ke ref agar listener stabil dan tidak men-trigger re-attach yang tak perlu
  const filteredReportsRef = useRef(filteredReports);
  filteredReportsRef.current = filteredReports;

  const onSelectReportRef = useRef(onSelectReport);
  onSelectReportRef.current = onSelectReport;

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const isInitialLoadRef = useRef(true);

  // Kumpulan Mapbox Marker HTML yang aktif di viewport
  const markersOnScreenRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

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

  // ─── Pembaruan DOM Markers untuk Titik Tidak Ter-Cluster ────────────────────
  const updateCustomMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (!map.getLayer('unclustered-point')) return;

    // Map id -> Report untuk pencarian O(1)
    const reportMap = new Map<string, Report>();
    for (const r of filteredReportsRef.current) {
      reportMap.set(r.id, r);
    }

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

      // Pasang marker baru jika belum ada di layar
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

          const marker = new mapboxgl.Marker({ element, anchor })
            .setLngLat([report.longitude, report.latitude])
            .addTo(map);

          currentMarkers.set(id, marker);
        }
      }

      // Batasi maksimal 300 marker DOM demi performa
      if (newVisibleIds.size >= 300) break;
    }

    // Hapus marker yang keluar viewport atau melebur ke dalam cluster
    for (const [id, marker] of currentMarkers.entries()) {
      if (!newVisibleIds.has(id)) {
        marker.remove();
        currentMarkers.delete(id);
      }
    }
  }, []);

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

  // ─── Layer Batas Kecamatan (GeoJSON Resmi Pemkot Surabaya) ───────────────────
  const addKecamatanLayers = useCallback((map: mapboxgl.Map) => {
    const isSatellite = mapStyleRef.current === 'satelit';
    const currentKec = (filterRef.current?.kecamatan || '').toLowerCase();

    // Source GeoJSON batas kecamatan
    if (!map.getSource('kecamatan-source')) {
      map.addSource('kecamatan-source', {
        type: 'geojson',
        data: '/data/kecamatan-surabaya.geojson',
      });
    }

    // Layer fill: transparan secara default, semi-transparan saat terpilih
    if (!map.getLayer('kecamatan-fill')) {
      map.addLayer({
        id: 'kecamatan-fill',
        type: 'fill',
        source: 'kecamatan-source',
        paint: {
          'fill-color': '#D4C9B2', // Warm paper kraft highlight
          'fill-opacity': [
            'case',
            ['==', ['downcase', ['get', 'name']], currentKec],
            0.32,
            0,
          ],
        },
      });
    }

    // Layer border: garis tipis flat tanpa glow, netral
    if (!map.getLayer('kecamatan-border')) {
      map.addLayer({
        id: 'kecamatan-border',
        type: 'line',
        source: 'kecamatan-source',
        paint: {
          'line-color': isSatellite ? '#FAF6EE' : '#B8AC94',
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
  }, []);

  // ─── SATU Fungsi Penambahan Source & Layer Laporan ──────────────────────────
  const addReportLayers = useCallback((map: mapboxgl.Map) => {
    const isSatellite = mapStyleRef.current === 'satelit';

    // 1. Tambahkan GeoJSON Source laporan (menggunakan data yang sudah ada di store)
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

    // 2. Layer Cluster Circles (Sesuai dominan kategori & ring merah jika ada kritis)
    if (!map.getLayer('clusters')) {
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'reports-source',
        filter: ['has', 'point_count'],
        paint: {
          // Warna sesuai kategori dominan
          'circle-color': [
            'case',
            ['>=', ['get', 'ban_count'], ['max', ['get', 'inf_count'], ['get', 'keb_count'], ['get', 'kea_count'], ['get', 'lai_count']]],
            '#2A7F86', // Banjir
            ['>=', ['get', 'inf_count'], ['max', ['get', 'keb_count'], ['get', 'kea_count'], ['get', 'lai_count']]],
            '#3E5C76', // Infrastruktur
            ['>=', ['get', 'keb_count'], ['max', ['get', 'kea_count'], ['get', 'lai_count']]],
            '#5E7C4A', // Kebersihan
            ['>=', ['get', 'kea_count'], ['get', 'lai_count']],
            '#5B3F6E', // Keamanan
            '#8A7F70',  // Lainnya
          ],
          // Ukuran berdasarkan jumlah titik
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15,
            10,
            20,
            30,
            25,
            60,
            30,
          ],
          // Ring merah tipis jika terdapat laporan kritis di dalam cluster
          'circle-stroke-width': ['case', ['get', 'has_critical'], 3, 1.8],
          'circle-stroke-color': ['case', ['get', 'has_critical'], '#C0392B', isSatellite ? '#FAF6EE' : '#1E1B16'],
          'circle-opacity': 0.94,
        },
      });
    }

    // 3. Layer Cluster Count Label
    if (!map.getLayer('cluster-count')) {
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'reports-source',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
          'text-size': 12,
        },
        paint: {
          'text-color': '#FAF6EE',
        },
      });
    }

    // 4. Layer Unclustered Points (Transparan — dipakai untuk query titik unclustered)
    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'reports-source',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-radius': 1,
          'circle-opacity': 0,
        },
      });
    }

    // 5. Pasang event listener layer cluster
    map.off('click', 'clusters', handleClusterClick);
    map.on('click', 'clusters', handleClusterClick);

    map.off('mouseenter', 'clusters', handleMouseEnter);
    map.on('mouseenter', 'clusters', handleMouseEnter);

    map.off('mouseleave', 'clusters', handleMouseLeave);
    map.on('mouseleave', 'clusters', handleMouseLeave);

    // Refresh marker kustom di viewport
    markersOnScreenRef.current.forEach((m) => m.remove());
    markersOnScreenRef.current.clear();
    updateCustomMarkers();
  }, [handleClusterClick, handleMouseEnter, handleMouseLeave, updateCustomMarkers]);

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
      addKecamatanLayers(map);
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
      updateCustomMarkers();
    });

    map.on('zoomend', updateCustomMarkers);
    map.on('idle', updateCustomMarkers);

    map.on('sourcedata', (e) => {
      if (e.sourceId === 'reports-source' && e.isSourceLoaded) {
        updateCustomMarkers();
      }
    });

    // Click handler untuk pilih lokasi (jika mode picking location aktif)
    map.on('click', (e) => {
      onMapClickRef.current({ lat: e.lngLat.lat, lng: e.lngLat.lng });
    });

    mapRef.current = map;

    return () => {
      markersOnScreenRef.current.forEach((m) => m.remove());
      markersOnScreenRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [debouncedFetchReports, addKecamatanLayers, addReportLayers, updateCustomMarkers]);

  // ─── Update GeoJSON Data saat filteredReports berubah ───────────────────────
  useEffect(() => {
    filteredReportsRef.current = filteredReports;
    if (!mapRef.current) return;
    const map = mapRef.current;
    if (!map.isStyleLoaded()) return;

    const source = map.getSource('reports-source') as mapboxgl.GeoJSONSource | undefined;
    if (source) {
      source.setData(reportsToGeoJSON(filteredReports));
    }

    // Bersihkan marker lama dan render ulang sesuai laporan yang lolos filter
    markersOnScreenRef.current.forEach((m) => m.remove());
    markersOnScreenRef.current.clear();
    updateCustomMarkers();
  }, [filteredReports, updateCustomMarkers]);

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

  // ─── Fit Bounds & Highlight saat filter kecamatan berubah ─────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const currentKec = (filter.kecamatan || '').toLowerCase();

    if (map.getLayer('kecamatan-fill')) {
      map.setPaintProperty('kecamatan-fill', 'fill-opacity', [
        'case',
        ['==', ['downcase', ['get', 'name']], currentKec],
        0.22,
        0,
      ]);
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
          mapRef.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 14.5,
            duration: 800,
          });
        }
      });
    } else {
      // "Semua Kecamatan" mengembalikan ke tampilan seluruh kota
      if (!isInitialLoadRef.current) {
        map.fitBounds(SURABAYA_BOUNDS, {
          padding: 20,
          duration: 800,
        });
      }
    }
  }, [filter.kecamatan]);

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

      {/* ─── Atribusi Sumber Data Wilayah ──────────────────────────────────── */}
      <div className="absolute bottom-3 right-3 z-[10] hidden sm:block px-2.5 py-1 bg-paper-white/95 border border-ink text-[10px] font-mono text-ink/80 select-none shadow-sm pointer-events-none">
        Batas Wilayah: Pemkot Surabaya (Satu Data / Perwali No. 26/2023)
      </div>
    </div>
  );
};

export default MapView;
