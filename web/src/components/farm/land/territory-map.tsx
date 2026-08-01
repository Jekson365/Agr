import * as L from 'leaflet';
import { useEffect, useRef, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { initialOf, territoryCenter, type OtherTerritory, type TerritoryPoint } from '@/config/territory';

import 'leaflet/dist/leaflet.css';
import './territory-map.css';

/** Where the map opens when nothing is marked and the owner has no saved location — Tbilisi,
 *  the same fallback the mobile location picker uses. Better than the middle of the ocean. */
const DEFAULT_CENTER: TerritoryPoint = { lat: 41.7151, lng: 44.8271 };

/** Close enough to make out field edges, but not so close that a first-time user is lost. */
const DEFAULT_ZOOM = 15;

type BaseLayer = 'satellite' | 'street';

/** Imagery is the default: a street map shows roads, not where one field stops and the next
 *  begins, which is the whole job here. */
const TILE_LAYERS: Record<BaseLayer, { url: string; attribution: string; maxNativeZoom: number }> = {
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

const VERTEX_ICON = L.divIcon({ className: 'territory-handle', iconSize: [14, 14] });
const MIDPOINT_ICON = L.divIcon({ className: 'territory-handle midpoint', iconSize: [12, 12] });

/** Pin diameter in screen pixels. The land this map is about gets the slightly larger one. */
const PIN_SIZE = 48;
const MAIN_PIN_SIZE = 52;

/**
 * The pin that marks a piece of land, carrying its owner's initial. Fixed on screen rather than
 * scaled with the map, which is the point of it: zoomed out far enough that a field is a speck,
 * the pin is what says there is land there and whose it is.
 *
 * The size goes through Leaflet rather than CSS so that the anchor it works out from it actually
 * centres the pin on the land — a pin resized underneath Leaflet sits off by half the difference.
 */
function ownerPin(initial: string, owner: string, size: number): L.DivIcon {
  // Built as an element with textContent rather than an HTML string: the letter comes from a name
  // someone typed, and it has no business being parsed as markup. A fresh element per pin, since
  // Leaflet moves the one it is given into the marker.
  const letter = document.createElement('span');
  letter.textContent = initial;
  return L.divIcon({
    className: `territory-owner-pin ${owner}`,
    html: letter,
    iconSize: [size, size],
  });
}

type Props = {
  /** The outline, in order around the territory. */
  points: TerritoryPoint[];
  /** Absent leaves the map read-only — it shows the territory but nothing can be drawn on it. */
  onChange?: (points: TerritoryPoint[]) => void;
  /** Neighbouring territories, drawn in a muted style and never editable. */
  others?: OtherTerritory[];
  /** Makes those territories answer a click, reporting the key of the one picked. Absent — as in
   *  the editor, where a click means "put a corner here" — they take no clicks at all. */
  onSelectOther?: (key: string) => void;
  /** The one drawn as picked out from the rest. */
  selectedKey?: string | null;
  /** The name of the land being shown, which its own pin carries. Only used on a read-only map —
   *  the editor marks its outline with the handles instead. */
  label?: string;
  /** Whether the wheel zooms the map. Defaults to off for a map embedded in a page, whose scroll
   *  it would otherwise swallow, and on for one that fills the screen. */
  wheelZoom?: boolean;
  /** Where to open when nothing is marked yet, e.g. the owner's saved location. */
  fallbackCenter?: TerritoryPoint | null;
  className?: string;
};

/**
 * A Leaflet map showing a farm's marked territory, and — when `onChange` is given — the surface it
 * is drawn on: click the map to drop a corner, drag a corner to move it, click the faint handle
 * between two corners to add one there, right-click a corner to remove it.
 *
 * The component is controlled: it draws whatever `points` says and reports every finished edit
 * through `onChange`. While a corner is being dragged the outline is moved directly on the map
 * (no re-render per pixel) and only the finished position is reported, the same live/commit split
 * the greenhouse floor canvas uses.
 */
export function TerritoryMap({
  points,
  onChange,
  others,
  onSelectOther,
  selectedKey,
  label,
  wheelZoom,
  fallbackCenter,
  className,
}: Props) {
  const { t } = useLanguage();
  const editable = onChange != null;
  // The editor fills the screen, so the wheel there can only mean zoom.
  const allowWheelZoom = wheelZoom ?? editable;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const shapeRef = useRef<L.Polygon | L.Polyline | null>(null);
  const ownPinRef = useRef<L.Marker | null>(null);
  const othersGroupRef = useRef<L.LayerGroup | null>(null);
  const vertexGroupRef = useRef<L.LayerGroup | null>(null);
  const midpointGroupRef = useRef<L.LayerGroup | null>(null);

  // The map's listeners are attached once, when it is created, so they read the current points and
  // callback from refs rather than closing over the values of the render that created the map.
  const pointsRef = useRef(points);
  const onChangeRef = useRef(onChange);
  const editableRef = useRef(editable);
  const wheelZoomRef = useRef(allowWheelZoom);

  /** The view is framed on the territory the first time one arrives; after that the user's own
   *  panning and zooming is left alone. */
  const framedRef = useRef(false);

  const [baseLayer, setBaseLayer] = useState<BaseLayer>('satellite');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    pointsRef.current = points;
    onChangeRef.current = onChange;
    editableRef.current = editable;
    wheelZoomRef.current = allowWheelZoom;
  });

  // Create the map once. Everything after this point is drawn onto it by the effects below.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: true,
      scrollWheelZoom: wheelZoomRef.current,
      // While drawing, a double click is two corners and a zoom — the corners are what was meant.
      doubleClickZoom: !editableRef.current,
      maxZoom: 21,
    });
    mapRef.current = map;

    const start = pointsRef.current[0] ?? fallbackCenter ?? DEFAULT_CENTER;
    map.setView([start.lat, start.lng], DEFAULT_ZOOM);

    // Added first so the neighbours sit under this map's own outline and its handles.
    othersGroupRef.current = L.layerGroup().addTo(map);
    vertexGroupRef.current = L.layerGroup().addTo(map);
    midpointGroupRef.current = L.layerGroup().addTo(map);

    map.on('click', (event: L.LeafletMouseEvent) => {
      if (!editableRef.current) return;
      const { lat, lng } = event.latlng;
      onChangeRef.current?.([...pointsRef.current, { lat, lng }]);
    });

    // The map measures itself on creation, which is too early inside a modal that is still being
    // laid out — and it can be resized afterwards. Re-measuring on every size change covers both.
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      shapeRef.current = null;
      ownPinRef.current = null;
      othersGroupRef.current = null;
      vertexGroupRef.current = null;
      midpointGroupRef.current = null;
      // The next map starts with no view of its own, so it is owed the opening frame this one had.
      framedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap the imagery under the outline without touching anything drawn on top of it.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const { url, attribution, maxNativeZoom } = TILE_LAYERS[baseLayer];
    // Zooming past the deepest tile the source publishes stretches the last one rather than
    // showing empty squares — useful when tracing a boundary closely.
    const layer = L.tileLayer(url, { attribution, maxNativeZoom, maxZoom: 21 }).addTo(map);
    tileLayerRef.current?.remove();
    tileLayerRef.current = layer;
  }, [baseLayer]);

  // Redraw the outline and its handles whenever the territory changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const latlngs = points.map((point) => [point.lat, point.lng] as L.LatLngTuple);

    shapeRef.current?.remove();
    shapeRef.current = null;
    if (points.length >= 3) {
      // Not interactive: in the editor a click inside the territory means "add a corner here",
      // and the shape must not intercept it.
      shapeRef.current = L.polygon(latlngs, { className: 'territory-shape', interactive: false }).addTo(map);
    } else if (points.length === 2) {
      shapeRef.current = L.polyline(latlngs, { className: 'territory-shape', interactive: false }).addTo(map);
    }

    drawHandles(points);

    // This land's own pin, so it stays on the map once zoomed out past the size of the field. Not
    // in the editor: there the corner handles already mark where the outline is, and a pin sitting
    // in the middle of it would only be one more thing to click around.
    ownPinRef.current?.remove();
    ownPinRef.current = null;
    const center = editable ? null : territoryCenter(points);
    if (center) {
      ownPinRef.current = L.marker([center.lat, center.lng], {
        icon: ownerPin(initialOf(label ?? ''), 'main', MAIN_PIN_SIZE),
        interactive: false,
        keyboard: false,
      }).addTo(map);
    }

    if (!framedRef.current && points.length > 0) {
      framedRef.current = true;
      frameTerritory(points);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, editable, label]);

  // Redraw the neighbouring territories whenever they arrive or change.
  useEffect(() => {
    const map = mapRef.current;
    const group = othersGroupRef.current;
    if (!map || !group) return;

    group.clearLayers();
    for (const other of others ?? []) {
      if (other.points.length < 3) continue;

      // Only takes clicks where someone is listening for them. In the editor nothing is, so a
      // click on someone else's land still means "put a corner here".
      const selected = selectedKey === other.key ? ' selected' : '';
      const shape = L.polygon(
        other.points.map((point) => [point.lat, point.lng] as L.LatLngTuple),
        {
          className: `territory-shape context ${other.owner}${selected}`,
          interactive: onSelectOther != null,
        },
      ).addTo(group);

      if (onSelectOther) {
        shape.on('click', (event: L.LeafletMouseEvent) => {
          L.DomEvent.stop(event.originalEvent);
          onSelectOther(other.key);
        });
      }

      shape.bindTooltip(other.label, {
        permanent: true,
        direction: 'center',
        // Clear of the pin that sits on the same spot, so the name reads under it.
        offset: [0, PIN_SIZE / 2 + 8],
        className: `territory-other-label ${other.owner}`,
      });

      // The pin that keeps the land findable once it is too small on screen to make out.
      const center = territoryCenter(other.points);
      if (center) {
        L.marker([center.lat, center.lng], {
          icon: ownerPin(other.initial, other.owner, PIN_SIZE),
          // Never takes a click: in the editor that still means "put a corner here".
          interactive: false,
          keyboard: false,
        }).addTo(group);
      }
    }

    // With nothing of one's own marked yet, the neighbours are the only thing that says where on
    // Earth this land is — so frame on them rather than opening over a default city.
    if (!framedRef.current && points.length === 0) {
      const all = (others ?? []).flatMap((other) => other.points);
      if (all.length > 0) {
        framedRef.current = true;
        frameTerritory(all);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [others, selectedKey]);

  function drawHandles(current: TerritoryPoint[]) {
    const vertices = vertexGroupRef.current;
    const midpoints = midpointGroupRef.current;
    if (!vertices || !midpoints) return;

    vertices.clearLayers();
    midpoints.clearLayers();
    if (!editable) return;

    current.forEach((point, index) => {
      const marker = L.marker([point.lat, point.lng], {
        icon: VERTEX_ICON,
        draggable: true,
        keyboard: false,
        title: t('landTerritory.cornerHint'),
      });

      // A corner in flight would leave the handles between it and its neighbours behind, so they
      // are taken down for the duration and rebuilt from the finished outline.
      marker.on('dragstart', () => midpoints.clearLayers());
      marker.on('drag', () => shapeRef.current?.setLatLngs(withMoved(index, marker.getLatLng())));
      marker.on('dragend', () => {
        const { lat, lng } = marker.getLatLng();
        const next = [...pointsRef.current];
        next[index] = { lat, lng };
        onChangeRef.current?.(next);
      });
      marker.on('contextmenu', () => {
        onChangeRef.current?.(pointsRef.current.filter((_, i) => i !== index));
      });

      marker.addTo(vertices);
    });

    // One handle per edge, at its midpoint — the way to refine a boundary that is already closed,
    // where appending another corner at the end would cut across it instead.
    if (current.length < 2) return;
    // Two corners are a single line, not a shape that closes back on itself.
    const edgeCount = current.length === 2 ? 1 : current.length;
    for (let index = 0; index < edgeCount; index++) {
      const from = current[index];
      const to = current[(index + 1) % current.length];
      const middle: TerritoryPoint = { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };

      const marker = L.marker([middle.lat, middle.lng], {
        icon: MIDPOINT_ICON,
        keyboard: false,
        title: t('landTerritory.midpointHint'),
      });
      marker.on('click', (event: L.LeafletMouseEvent) => {
        // Without this the click carries on to the map, which would read it as "add a corner at
        // the end" on top of the insert that was actually asked for.
        L.DomEvent.stop(event.originalEvent);
        const next = [...pointsRef.current];
        next.splice(index + 1, 0, middle);
        onChangeRef.current?.(next);
      });
      marker.addTo(midpoints);
    }
  }

  /** The outline with one corner replaced — the shape as it looks mid-drag. */
  function withMoved(index: number, latlng: L.LatLng): L.LatLngTuple[] {
    return pointsRef.current.map((point, i) =>
      i === index ? ([latlng.lat, latlng.lng] as L.LatLngTuple) : ([point.lat, point.lng] as L.LatLngTuple),
    );
  }

  function frameTerritory(current: TerritoryPoint[]) {
    const map = mapRef.current;
    if (!map || current.length === 0) return;
    const bounds = L.latLngBounds(current.map((point) => [point.lat, point.lng] as L.LatLngTuple));
    if (current.length === 1) {
      map.setView(bounds.getCenter(), DEFAULT_ZOOM);
      return;
    }
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 19 });
  }

  function locate() {
    const map = mapRef.current;
    if (!map) return;
    setLocating(true);
    map
      .locate({ setView: true, maxZoom: 17 })
      .once('locationfound', () => setLocating(false))
      .once('locationerror', () => setLocating(false));
  }

  return (
    <div className={className ? `territory-map ${className}` : 'territory-map'}>
      <div ref={containerRef} className="territory-map-canvas" />

      <div className="territory-map-controls">
        <div className="territory-layer-switch">
          <button
            type="button"
            className={baseLayer === 'satellite' ? 'territory-layer-btn active' : 'territory-layer-btn'}
            onClick={() => setBaseLayer('satellite')}
          >
            {t('landTerritory.satellite')}
          </button>
          <button
            type="button"
            className={baseLayer === 'street' ? 'territory-layer-btn active' : 'territory-layer-btn'}
            onClick={() => setBaseLayer('street')}
          >
            {t('landTerritory.street')}
          </button>
        </div>

        {editable && (
          <button type="button" className="territory-locate-btn" onClick={locate} disabled={locating}>
            {locating ? '…' : t('landTerritory.locate')}
          </button>
        )}
      </div>
    </div>
  );
}
