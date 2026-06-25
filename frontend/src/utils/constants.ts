// Không cần token - dùng OpenStreetMap miễn phí!
export const DEFAULT_CENTER: [number, number] = [10.7537, 106.6825]; // [lat, lng] - Vinh Khanh
export const DEFAULT_ZOOM = 16;
export const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;
export const DEFAULT_LANGUAGE = 'en';
export const DEBOUNCE_MS = 300;

// OSM tile layers (miễn phí, không cần token)
export const TILE_LAYERS = {
  light: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
} as const;

export const TILE_ATTRIBUTIONS = {
  light: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  dark: '© <a href="https://openstreetmap.org">OpenStreetMap</a> © <a href="https://carto.com">CARTO</a>',
  satellite: '© Esri',
} as const;
