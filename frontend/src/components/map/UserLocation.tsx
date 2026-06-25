import { useEffect, useRef } from 'react';
import { useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import { useGeolocation } from '@/hooks/useGeolocation';

export default function UserLocation() {
  const { position } = useGeolocation();
  const leafletMap = useLeafletMap();
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  useEffect(() => {
    if (!leafletMap) return;

    if (!position) {
      markerRef.current?.remove(); markerRef.current = null;
      circleRef.current?.remove(); circleRef.current = null;
      return;
    }

    const { latitude, longitude, accuracy } = position;
    const latlng: L.LatLngExpression = [latitude, longitude];

    // Pulsing blue dot icon
    const userIcon = L.divIcon({
      html: `
        <div style="position:relative; width:20px; height:20px; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:20px; height:20px; border-radius:50%; background:rgba(59,130,246,0.2); animation:ping 1.5s ease-in-out infinite;"></div>
          <div style="width:12px; height:12px; border-radius:50%; background:#3b82f6; border:2.5px solid white; box-shadow:0 0 8px rgba(59,130,246,0.6); flex-shrink:0;"></div>
        </div>
        <style>@keyframes ping{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.8);opacity:0.3}}</style>
      `,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    if (!markerRef.current) {
      markerRef.current = L.marker(latlng, { icon: userIcon, zIndexOffset: 2000, interactive: false }).addTo(leafletMap);
      if (accuracy && accuracy < 500) {
        circleRef.current = L.circle(latlng, { radius: accuracy, color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 1 }).addTo(leafletMap);
      }
    } else {
      markerRef.current.setLatLng(latlng);
      circleRef.current?.setLatLng(latlng);
    }

    return () => {
      markerRef.current?.remove(); markerRef.current = null;
      circleRef.current?.remove(); circleRef.current = null;
    };
  }, [position, leafletMap]);

  return null;
}
