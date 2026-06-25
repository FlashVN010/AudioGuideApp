import { useEffect, useRef } from 'react';
import { Marker, Popup, useMap as useLeafletMap } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import type { POIListItem, POI } from '@/types/poi';
import MarkerPopup from './MarkerPopup';

interface POIMarkerProps {
  poi: POIListItem | POI;
  isSelected: boolean;
  onClick?: () => void;
  onDetailClick: (poi: POIListItem | POI) => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  ốc: '🐚', snail: '🐚',
  lẩu: '🍲', hotpot: '🍲',
  nướng: '🍢', bbq: '🍢', grill: '🍢',
  'ăn vặt': '🍡', snack: '🍡',
  'bánh mì': '🥖',
  nước: '🥤', uống: '🥤', drink: '🥤', beer: '🥤',
  cafe: '☕', coffee: '☕',
};

function getCategoryEmoji(category: string): string {
  const cat = category.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (cat.includes(key)) return emoji;
  }
  return '🍴';
}

// Tạo custom Leaflet DivIcon từ emoji
function createCustomIcon(emoji: string, isSelected: boolean): L.DivIcon {
  const size = isSelected ? 42 : 36;
  const html = `
    <div style="
      width:${size}px; height:${size}px;
      background:${isSelected ? 'oklch(0.65 0.24 30)' : 'white'};
      border: 2.5px solid ${isSelected ? 'white' : 'oklch(0.65 0.24 30)'};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display:flex; align-items:center; justify-content:center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      transition: all 0.2s;
      ${isSelected ? 'box-shadow: 0 0 0 6px rgba(237,100,30,0.18), 0 4px 12px rgba(0,0,0,0.25);' : ''}
    ">
      <span style="transform: rotate(45deg); font-size:${isSelected ? 18 : 15}px; line-height:1">${emoji}</span>
    </div>
  `;
  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  });
}

export default function POIMarker({ poi, isSelected, onClick, onDetailClick }: POIMarkerProps) {
  const leafletMap = useLeafletMap();
  const markerRef = useRef<L.Marker | null>(null);
  const emoji = getCategoryEmoji(poi.category);

  // Fly to và mở popup khi isSelected
  useEffect(() => {
    if (!markerRef.current) return;
    if (isSelected) {
      leafletMap.flyTo([poi.latitude, poi.longitude], Math.max(leafletMap.getZoom(), 17), { animate: true, duration: 0.8 });
      markerRef.current.openPopup();
    } else {
      markerRef.current.closePopup();
    }
  }, [isSelected, poi.latitude, poi.longitude, leafletMap]);

  return (
    <Marker
      position={[poi.latitude, poi.longitude]}
      icon={createCustomIcon(emoji, isSelected)}
      ref={markerRef}
      eventHandlers={{
        click: () => onClick?.(),
      }}
      zIndexOffset={isSelected ? 1000 : 0}
    >
      <Popup
        closeButton={true}
        minWidth={240}
        maxWidth={280}
        className="leaflet-poi-popup"
      >
        <MarkerPopup poi={poi} onDetailClick={onDetailClick} />
      </Popup>
    </Marker>
  );
}
