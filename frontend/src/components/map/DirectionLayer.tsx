import { useEffect, useRef } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';

interface DirectionLayerProps {
  origin: [number, number] | null;       // [lng, lat]
  destination: [number, number] | null;  // [lng, lat]
}

export default function DirectionLayer({ origin, destination }: DirectionLayerProps) {
  const leafletMap = useLeafletMap();
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    // Cleanup cũ
    polylineRef.current?.remove(); polylineRef.current = null;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];

    if (!origin || !destination) return;

    // Convert [lng, lat] → [lat, lng]
    const originLL:  L.LatLngExpression = [origin[1],      origin[0]];
    const destLL:    L.LatLngExpression = [destination[1], destination[0]];

    let isActive = true;

    // Gọi OSRM walking route (miễn phí, không cần token)
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/foot/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (!isActive) return;

        if (data.routes?.[0]?.geometry?.coordinates) {
          const coords: L.LatLngExpression[] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng]
          );

          polylineRef.current = L.polyline(coords, {
            color: '#0ea5e9',
            weight: 5,
            opacity: 0.85,
            dashArray: undefined,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(leafletMap);

          leafletMap.fitBounds(L.latLngBounds(coords as L.LatLng[]), { padding: [60, 60] });
        } else {
          // Fallback: đường thẳng
          drawStraightLine(originLL, destLL);
        }
      } catch {
        if (isActive) drawStraightLine(originLL, destLL);
      }
    };

    const drawStraightLine = (from: L.LatLngExpression, to: L.LatLngExpression) => {
      polylineRef.current = L.polyline([from, to], {
        color: '#0ea5e9', weight: 4, opacity: 0.7, dashArray: '8,6',
      }).addTo(leafletMap);
      leafletMap.fitBounds(L.latLngBounds([from as L.LatLng, to as L.LatLng]), { padding: [60, 60] });
    };

    // Origin marker (xanh)
    const originIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#22c55e;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      className: '', iconSize: [14, 14], iconAnchor: [7, 7],
    });
    // Dest marker (đỏ)
    const destIcon = L.divIcon({
      html: `<div style="width:14px;height:14px;border-radius:50%;background:#ef4444;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
      className: '', iconSize: [14, 14], iconAnchor: [7, 7],
    });

    markersRef.current.push(
      L.marker(originLL, { icon: originIcon, zIndexOffset: 500, interactive: false }).addTo(leafletMap),
      L.marker(destLL,   { icon: destIcon,   zIndexOffset: 500, interactive: false }).addTo(leafletMap),
    );

    fetchRoute();

    return () => {
      isActive = false;
      polylineRef.current?.remove(); polylineRef.current = null;
      markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    };
  }, [origin, destination, leafletMap]);

  return null;
}
