import { useCallback } from 'react';
import { useMap } from '@/contexts/MapContext';

// Hook giữ nguyên tên để không cần đổi import ở HomePage
export function useMapbox() {
  const { map } = useMap();

  const flyTo = useCallback(
    (coords: [number, number] | { lat: number; lng: number } | { latitude: number; longitude: number }, zoom?: number) => {
      if (!map) return;
      let lat: number, lng: number;
      if (Array.isArray(coords)) {
        // Leaflet dùng [lat, lng] nhưng Mapbox dùng [lng, lat]
        // Giữ nguyên API: [lng, lat] giống Mapbox để không đổi callers
        [lng, lat] = coords;
      } else if ('lng' in coords) {
        ({ lat, lng } = coords);
      } else {
        lat = coords.latitude; lng = coords.longitude;
      }
      map.flyTo([lat, lng], zoom ?? map.getZoom(), { animate: true, duration: 1 });
    },
    [map]
  );

  const fitBounds = useCallback(
    (bounds: [[number, number], [number, number]], padding = 50) => {
      if (!map) return;
      // Mapbox bounds: [[lng,lat],[lng,lat]] → Leaflet: [[lat,lng],[lat,lng]]
      map.fitBounds(
        [[bounds[0][1], bounds[0][0]], [bounds[1][1], bounds[1][0]]],
        { padding: [padding, padding] }
      );
    },
    [map]
  );

  const zoomIn = useCallback(() => map?.zoomIn(), [map]);
  const zoomOut = useCallback(() => map?.zoomOut(), [map]);

  return { map, flyTo, fitBounds, zoomIn, zoomOut };
}

export default useMapbox;
