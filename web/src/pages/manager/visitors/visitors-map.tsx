import * as L from 'leaflet';
import { useEffect, useRef } from 'react';

import { MAP_FALLBACK_CENTER, MAP_TILE_LAYERS } from '@/config/map-tiles';
import { useLanguage } from '@/contexts/language-context';
import type { VisitPoint } from '@/types/visit';
import { formatCount, placeLabel } from './visit-labels';

import 'leaflet/dist/leaflet.css';
import './visitors-map.css';

type Props = {
  points: VisitPoint[];
};

function textTooltip(text: string): HTMLElement {
  const element = document.createElement('span');
  element.textContent = text;
  return element;
}

export function VisitorsMap({ points }: Props) {
  const { t, language } = useLanguage();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, { scrollWheelZoom: false, worldCopyJump: true, minZoom: 1 });
    const { url, attribution, maxNativeZoom } = MAP_TILE_LAYERS.street;
    L.tileLayer(url, { attribution, maxNativeZoom, maxZoom: 18 }).addTo(map);
    map.setView([MAP_FALLBACK_CENTER.lat, MAP_FALLBACK_CENTER.lng], 3);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const busiest = Math.max(1, ...points.map((point) => point.visitors));

    for (const point of points) {
      const label = `${placeLabel(point.city, point.countryCode, point.countryCode, language, t)} · ${formatCount(point.visitors)}`;
      L.circleMarker([point.latitude, point.longitude], {
        radius: 5 + 13 * Math.sqrt(point.visitors / busiest),
        className: 'visitors-map-dot',
      })
        .bindTooltip(textTooltip(label))
        .addTo(layer);
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points.map((point) => [point.latitude, point.longitude] as L.LatLngTuple));
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 7, animate: false });
    }
  }, [points, language, t]);

  return (
    <section className="visitors-panel visitors-map-panel">
      <h2 className="visitors-panel-title">{t('visitors.mapTitle')}</h2>
      <div ref={containerRef} className="visitors-map" />
    </section>
  );
}
