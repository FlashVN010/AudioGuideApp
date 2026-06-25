import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMap } from '@/contexts/MapContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CENTER, DEFAULT_ZOOM, TILE_LAYERS, TILE_ATTRIBUTIONS } from '@/utils/constants';
import { Plus, Minus, Navigation } from 'lucide-react';

// Fix Leaflet default icon vite issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Bridge: expose Leaflet map instance lên MapContext để các hook (useMapbox, flyTo) hoạt động
function MapInstanceBridge({ onMapClick }: { onMapClick?: (lngLat: [number, number]) => void }) {
  const leafletMap = useLeafletMap();
  const { setMap } = useMap();

  useEffect(() => {
    setMap(leafletMap);

    if (onMapClick) {
      const handler = (e: L.LeafletMouseEvent) => onMapClick([e.latlng.lng, e.latlng.lat]);
      leafletMap.on('click', handler);
      return () => { setMap(null); leafletMap.off('click', handler); };
    }
    return () => setMap(null);
  }, [leafletMap, setMap, onMapClick]);

  return null;
}

interface MapViewProps {
  children?: React.ReactNode;
  onMapClick?: (lngLat: [number, number]) => void;
}

export default function MapView({ children, onMapClick }: MapViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { map } = useMap();

  const tileUrl  = theme === 'dark' ? TILE_LAYERS.dark  : TILE_LAYERS.light;
  const tileAttr = theme === 'dark' ? TILE_ATTRIBUTIONS.dark : TILE_ATTRIBUTIONS.light;

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden select-none bg-surface-alt">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full absolute inset-0"
        style={{ zIndex: 0 }}
      >
        <TileLayer url={tileUrl} attribution={tileAttr} key={tileUrl} />
        <MapInstanceBridge onMapClick={onMapClick} />
        {children}
      </MapContainer>

      {/* Custom zoom + locate controls */}
      <div className="absolute right-4 bottom-24 md:bottom-6 z-[1000] flex flex-col gap-2">
        <button onClick={() => navigator.geolocation.getCurrentPosition(
          ({ coords }) => map?.flyTo([coords.latitude, coords.longitude], 17, { animate: true, duration: 1 }),
          () => {}, { enableHighAccuracy: true }
        )}
          title={t('map.locateMe', 'Vị trí của tôi')}
          className="w-10 h-10 rounded-xl border border-border bg-card shadow-lg flex items-center justify-center text-primary hover:bg-surface-alt active:scale-95 transition-all outline-none"
        >
          <Navigation size={17} className="fill-current" />
        </button>
        <button onClick={() => map?.zoomIn()} title="Phóng to"
          className="w-10 h-10 rounded-t-xl border border-b-0 border-border bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 transition-all outline-none">
          <Plus size={18} />
        </button>
        <button onClick={() => map?.zoomOut()} title="Thu nhỏ"
          className="w-10 h-10 rounded-b-xl border border-border bg-card shadow-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-alt active:scale-95 transition-all outline-none">
          <Minus size={18} />
        </button>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-1 left-1 z-[1000] text-[9px] text-text-muted bg-card/70 backdrop-blur-sm px-1.5 py-0.5 rounded border border-border/50 pointer-events-none">
        © <a href="https://openstreetmap.org" className="pointer-events-auto hover:underline">OpenStreetMap</a>
      </div>
    </div>
  );
}
