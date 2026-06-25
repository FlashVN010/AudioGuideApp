import { useEffect, useRef } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import type { Tour, TourStop } from '@/types/api';

interface TourLayerProps {
  tour: Tour | null;
  activeStopIndex: number | null;
  onStopClick?: (stop: TourStop) => void;
}

export default function TourLayer({ tour, activeStopIndex, onStopClick }: TourLayerProps) {
  const leafletMap = useLeafletMap();
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Cleanup
    polylineRef.current?.remove(); polylineRef.current = null;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];

    if (!tour || !tour.stops?.length) return;

    const stops = [...tour.stops].sort((a, b) => a.stopOrder - b.stopOrder);
    const latlngs: L.LatLngExpression[] = stops.map(s => [s.latitude, s.longitude]);

    // Vẽ đường tour
    polylineRef.current = L.polyline(latlngs, {
      color: 'oklch(0.65 0.24 30)',
      weight: 4,
      opacity: 0.8,
      dashArray: '10, 6',
      lineCap: 'round',
    }).addTo(leafletMap);

    // Tour stop markers
    stops.forEach((stop, idx) => {
      const isActive = activeStopIndex === idx;
      const icon = L.divIcon({
        html: `
          <div style="
            width:${isActive ? 34 : 28}px; height:${isActive ? 34 : 28}px;
            border-radius:50%; background:${isActive ? 'oklch(0.65 0.24 30)' : 'white'};
            border: 2.5px solid oklch(0.65 0.24 30);
            display:flex; align-items:center; justify-content:center;
            font-weight:bold; font-size:${isActive ? 14 : 11}px;
            color:${isActive ? 'white' : 'oklch(0.65 0.24 30)'};
            box-shadow:0 2px 8px rgba(0,0,0,0.2);
            font-family:sans-serif;
          ">${stop.stopOrder}</div>
        `,
        className: '',
        iconSize: [isActive ? 34 : 28, isActive ? 34 : 28],
        iconAnchor: [(isActive ? 34 : 28) / 2, (isActive ? 34 : 28) / 2],
        popupAnchor: [0, -(isActive ? 34 : 28) / 2 - 4],
      });

      const marker = L.marker([stop.latitude, stop.longitude], { icon, zIndexOffset: isActive ? 500 : 100 })
        .addTo(leafletMap)
        .bindPopup(`<div style="font-size:12px;font-weight:600">${stop.poiName}</div><div style="font-size:10px;color:#888">${stop.poiCategory || ''}</div>`, { minWidth: 140 });

      if (onStopClick) marker.on('click', () => onStopClick(stop));
      markersRef.current.push(marker);
    });

    // Fit bounds to show all stops
    if (latlngs.length > 1) {
      leafletMap.fitBounds(L.latLngBounds(latlngs as L.LatLng[]), { padding: [40, 40], maxZoom: 17 });
    }

    return () => {
      polylineRef.current?.remove(); polylineRef.current = null;
      markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    };
  }, [tour, activeStopIndex, leafletMap, onStopClick]);

  return null;
}
