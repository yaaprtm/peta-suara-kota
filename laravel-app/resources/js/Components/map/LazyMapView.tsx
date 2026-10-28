import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '@/Components/ui/Badges';
import type { Report } from '@/types';

// Lazy load MapView untuk mengurangi initial bundle
const MapView = lazy(() => import('./MapView'));

const MapViewSkeleton: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600">Loading map...</p>
    </div>
  </div>
);

interface LazyMapViewProps {
  onSelectReport: (report: Report) => void;
  onMapClick: (latlng: { lat: number; lng: number }) => void;
  isPickingLocation: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
}

export const LazyMapView: React.FC<LazyMapViewProps> = (props) => {
  return (
    <Suspense fallback={<MapViewSkeleton />}>
      <MapView {...props} />
    </Suspense>
  );
};

export default LazyMapView;
