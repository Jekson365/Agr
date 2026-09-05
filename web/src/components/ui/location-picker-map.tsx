import * as L from 'leaflet';
import { useEffect, useRef, useState } from 'react';

import { MAP_FALLBACK_CENTER, MAP_TILE_LAYERS, type MapBaseLayer } from '@/config/map-tiles';
import type { TerritoryPoint } from '@/config/territory';
import { useLanguage } from '@/contexts/language-context';

import 'leaflet/dist/leaflet.css';
import './location-picker-map.css';

const DEFAULT_ZOOM = 13;
const PICKED_ZOOM = 16;

const PIN_ICON = L.divIcon({ className: 'location-pin', iconSize: [26, 26] });

type Props = {
  value: TerritoryPoint | null;
  onChange: (point: TerritoryPoint) => void;
  className?: string;
};

export function LocationPickerMap({ value, onChange, className }: Props) {
  const { t } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);
  const centeredRef = useRef(false);

  const [baseLayer, setBaseLayer] = useState<MapBaseLayer>('satellite');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { zoomControl: true, scrollWheelZoom: true, maxZoom: 21 });
    mapRef.current = map;

    const start = valueRef.current ?? MAP_FALLBACK_CENTER;
    map.setView([start.lat, start.lng], valueRef.current ? PICKED_ZOOM : DEFAULT_ZOOM);

    map.on('click', (event: L.LeafletMouseEvent) => {
      onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
    });

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      tileLayerRef.current = null;
      markerRef.current = null;
      centeredRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { url, attribution, maxNativeZoom } = MAP_TILE_LAYERS[baseLayer];
    const layer = L.tileLayer(url, { attribution, maxNativeZoom, maxZoom: 21 }).addTo(map);
    tileLayerRef.current?.remove();
    tileLayerRef.current = layer;
  }, [baseLayer]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!value) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([value.lat, value.lng]);
    } else {
      const marker = L.marker([value.lat, value.lng], { icon: PIN_ICON, draggable: true, keyboard: false }).addTo(map);
      marker.on('dragend', () => {
        const moved = marker.getLatLng();
        onChangeRef.current({ lat: moved.lat, lng: moved.lng });
      });
      markerRef.current = marker;
    }

    if (!centeredRef.current) {
      centeredRef.current = true;
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), PICKED_ZOOM));
    }
  }, [value]);

  function locate() {
    const map = mapRef.current;
    if (!map || locating) return;
    setLocating(true);
    map
      .locate({ setView: true, maxZoom: PICKED_ZOOM })
      .once('locationfound', (event: L.LocationEvent) => {
        setLocating(false);
        onChangeRef.current({ lat: event.latlng.lat, lng: event.latlng.lng });
      })
      .once('locationerror', () => setLocating(false));
  }

  return (
    <div className={className ? `location-picker ${className}` : 'location-picker'}>
      <div ref={containerRef} className="location-picker-canvas" />

      <div className="location-picker-controls">
        <div className="location-picker-layers">
          <button
            type="button"
            className={baseLayer === 'satellite' ? 'location-picker-btn active' : 'location-picker-btn'}
            onClick={() => setBaseLayer('satellite')}
          >
            {t('landTerritory.satellite')}
          </button>
          <button
            type="button"
            className={baseLayer === 'street' ? 'location-picker-btn active' : 'location-picker-btn'}
            onClick={() => setBaseLayer('street')}
          >
            {t('landTerritory.street')}
          </button>
        </div>

        <button type="button" className="location-picker-locate" onClick={locate} disabled={locating}>
          {locating ? '…' : t('landTerritory.locate')}
        </button>
      </div>
    </div>
  );
}
