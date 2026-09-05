export type MapBaseLayer = 'satellite' | 'street';

export type MapTileLayer = {
  url: string;
  attribution: string;
  maxNativeZoom: number;
};

export const MAP_TILE_LAYERS: Record<MapBaseLayer, MapTileLayer> = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP and the GIS User Community',
    maxNativeZoom: 19,
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19,
  },
};

export const MAP_FALLBACK_CENTER = { lat: 41.7151, lng: 44.8271 };
