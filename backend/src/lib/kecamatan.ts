import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import fs from 'fs';
import path from 'path';

export interface KecamatanFeature {
  type: 'Feature';
  properties: {
    id: string;
    kode: string;
    name: string;
    rawName: string;
    luasKm: number;
    bbox?: [number, number, number, number];
  };
  geometry: any;
}

export interface KecamatanFeatureCollection {
  type: 'FeatureCollection';
  features: KecamatanFeature[];
}

let loadedGeoJSON: KecamatanFeatureCollection | null = null;

export function getSurabayaKecamatanGeoJSON(): KecamatanFeatureCollection | null {
  if (loadedGeoJSON) return loadedGeoJSON;

  // Possible paths for geojson
  const candidatePaths = [
    path.resolve(__dirname, '../../../frontend/public/data/kecamatan-surabaya.geojson'),
    path.resolve(__dirname, '../../data/kecamatan-surabaya.geojson'),
    path.resolve(process.cwd(), '../frontend/public/data/kecamatan-surabaya.geojson'),
    path.resolve(process.cwd(), 'public/data/kecamatan-surabaya.geojson'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        loadedGeoJSON = JSON.parse(raw);
        return loadedGeoJSON;
      } catch (err) {
        console.error('Error reading geojson from', p, err);
      }
    }
  }

  return null;
}

/**
 * Tentukan kecamatan dari koordinat [lng, lat] menggunakan point-in-polygon.
 * Mengembalikan nama kecamatan kanonik, atau null jika di luar Surabaya.
 */
export function determineKecamatan(lng: number, lat: number): string | null {
  if (isNaN(lng) || isNaN(lat)) return null;

  const geojson = getSurabayaKecamatanGeoJSON();
  if (!geojson) return null;

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
      if (booleanPointInPolygon(point, feature as any)) {
        return feature.properties.name;
      }
    } catch {
      continue;
    }
  }

  return null;
}
