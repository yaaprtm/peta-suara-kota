import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from 'geojson';

export interface KecamatanProperties {
  id: string;
  kode: string;
  name: string;
  rawName: string;
  luasKm: number;
  sumber: string;
  dasarHukum: string;
  bbox: [number, number, number, number];
}

export type KecamatanFeature = Feature<Polygon | MultiPolygon, KecamatanProperties>;
export type KecamatanFeatureCollection = FeatureCollection<Polygon | MultiPolygon, KecamatanProperties>;

// ─── 31 Kecamatan Resmi Kota Surabaya (Berdasarkan Perwali No. 26/2023) ────────
export const KECAMATAN_SURABAYA: readonly string[] = [
  'Asemrowo',
  'Benowo',
  'Bubutan',
  'Bulak',
  'Dukuh Pakis',
  'Gayungan',
  'Genteng',
  'Gubeng',
  'Gunung Anyar',
  'Jambangan',
  'Karangpilang',
  'Kenjeran',
  'Krembangan',
  'Lakarsantri',
  'Mulyorejo',
  'Pabean Cantian',
  'Pakal',
  'Rungkut',
  'Sambikerep',
  'Sawahan',
  'Semampir',
  'Simokerto',
  'Sukolilo',
  'Sukomanunggal',
  'Tambaksari',
  'Tandes',
  'Tegalsari',
  'Tenggilis Mejoyo',
  'Wiyung',
  'Wonocolo',
  'Wonokromo',
] as const;

// ─── Tabel Pemetaan Ejaan / Varian ke Nama Kanonik ─────────────────────────────
export const KECAMATAN_MAPPING_TABLE: Record<string, string> = {
  'ASEM ROWO': 'Asemrowo',
  'ASEMROWO': 'Asemrowo',
  'BENOWO': 'Benowo',
  'BUBUTAN': 'Bubutan',
  'BULAK': 'Bulak',
  'DUKUH PAKIS': 'Dukuh Pakis',
  'DUKUHPAKIS': 'Dukuh Pakis',
  'GAYUNGAN': 'Gayungan',
  'GENTENG': 'Genteng',
  'GUBENG': 'Gubeng',
  'GUNUNG ANYAR': 'Gunung Anyar',
  'GUNUNGANYAR': 'Gunung Anyar',
  'JAMBANGAN': 'Jambangan',
  'KARANG PILANG': 'Karangpilang',
  'KARANGPILANG': 'Karangpilang',
  'KENJERAN': 'Kenjeran',
  'KREMBANGAN': 'Krembangan',
  'LAKARSANTRI': 'Lakarsantri',
  'MULYOREJO': 'Mulyorejo',
  'PABEAN CANTIAN': 'Pabean Cantian',
  'PABEAN CANTIKAN': 'Pabean Cantian',
  'PABEANCANTIAN': 'Pabean Cantian',
  'PAKAL': 'Pakal',
  'RUNGKUT': 'Rungkut',
  'SAMBIKEREP': 'Sambikerep',
  'SAWAHAN': 'Sawahan',
  'SEMAMPIR': 'Semampir',
  'SIMOKERTO': 'Simokerto',
  'SUKOLILO': 'Sukolilo',
  'SUKOMANUNGGAL': 'Sukomanunggal',
  'TAMBAKSARI': 'Tambaksari',
  'TANDES': 'Tandes',
  'TEGALSARI': 'Tegalsari',
  'TENGGILIS MEJOYO': 'Tenggilis Mejoyo',
  'TENGGILISMEJOYO': 'Tenggilis Mejoyo',
  'WIYUNG': 'Wiyung',
  'WONOCOLO': 'Wonocolo',
  'WONOKROMO': 'Wonokromo',
};

// ─── Helper Normalisasi Nama Kecamatan ─────────────────────────────────────────
export function normalizeKecamatanName(input?: string | null): string | null {
  if (!input) return null;
  const clean = input.trim();
  const upper = clean.toUpperCase();

  if (KECAMATAN_MAPPING_TABLE[upper]) {
    return KECAMATAN_MAPPING_TABLE[upper];
  }

  // Cek pencocokan tanpa spasi & tanda baca
  const stripped = upper.replace(/[^A-Z]/g, '');
  for (const [key, val] of Object.entries(KECAMATAN_MAPPING_TABLE)) {
    if (key.replace(/[^A-Z]/g, '') === stripped) {
      return val;
    }
  }

  return clean;
}

// ─── Cache GeoJSON Kecamatan di Frontend ──────────────────────────────────────
let cachedGeoJSON: KecamatanFeatureCollection | null = null;
let geojsonPromise: Promise<KecamatanFeatureCollection> | null = null;

export async function fetchKecamatanGeoJSON(): Promise<KecamatanFeatureCollection> {
  if (cachedGeoJSON) return cachedGeoJSON;
  if (geojsonPromise) return geojsonPromise;

  geojsonPromise = fetch('/data/kecamatan-surabaya.geojson')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json() as Promise<KecamatanFeatureCollection>;
    })
    .then((data) => {
      cachedGeoJSON = data;
      return data;
    });

  return geojsonPromise;
}

export function getCachedKecamatanGeoJSON(): KecamatanFeatureCollection | null {
  return cachedGeoJSON;
}

// ─── Point-In-Polygon: Temukan Kecamatan Berdasarkan Koordinat ────────────────
export function findKecamatanByCoordinate(
  lng: number,
  lat: number,
  geojson: KecamatanFeatureCollection | null = cachedGeoJSON
): { name: string; kode: string; feature: KecamatanFeature } | null {
  if (!geojson || isNaN(lng) || isNaN(lat)) return null;

  const point = {
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [lng, lat],
    },
    properties: {},
  };

  for (const feature of geojson.features) {
    try {
      if (booleanPointInPolygon(point, feature)) {
        return {
          name: feature.properties.name,
          kode: feature.properties.kode,
          feature,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

// ─── Ambil Bounding Box Kecamatan untuk fitBounds ─────────────────────────────
export function getKecamatanBounds(
  kecamatanName: string,
  geojson: KecamatanFeatureCollection | null = cachedGeoJSON
): [[number, number], [number, number]] | null {
  if (!geojson) return null;
  const canonical = normalizeKecamatanName(kecamatanName);
  const feat = geojson.features.find(
    (f) => f.properties.name.toLowerCase() === canonical?.toLowerCase()
  );
  if (!feat || !feat.properties.bbox) return null;

  const [minLng, minLat, maxLng, maxLat] = feat.properties.bbox;
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}
