import type { Farm } from '@/types/farm';
import type { NeighbourTerritory } from '@/types/neighbour';

/** A point on the outline of a marked territory. */
export type TerritoryPoint = { lat: number; lng: number };

/** Whose land an outline is, which is what decides how prominently the map draws it. */
export type TerritoryOwner = 'own' | 'neighbour' | 'other';

/** Land other than the one in hand, drawn behind it for context. */
export type OtherTerritory = {
  /** Stable across redraws — two farms nearby can share a name. */
  key: string;
  /** Shown on the outline itself, so it's clear whose land it is. */
  label: string;
  /** One letter for the pin that marks the land — the owner's, or the field's for your own. */
  initial: string;
  points: TerritoryPoint[];
  owner: TerritoryOwner;
};

/** Turns what the server says about the land around you into outlines a map can draw. Land whose
 *  outline no longer encloses anything is dropped rather than drawn as a stray line. */
export function toOtherTerritories(territories: NeighbourTerritory[]): OtherTerritory[] {
  return territories
    .map((territory) => ({
      key: `${territory.userId}-${territory.farmId}`,
      label: [territory.name, territory.farmName].filter(Boolean).join(' · '),
      // Whose land it is — the pin stands in for the owner when the field itself is too small to see.
      initial: initialOf(territory.name || territory.farmName),
      points: parseTerritory(territory.boundary),
      owner: (territory.isNeighbour ? 'neighbour' : 'other') as TerritoryOwner,
    }))
    .filter((entry) => entry.points.length >= 3);
}

/**
 * Your own other land, for drawing behind whichever piece is in hand — the land being marked out
 * or looked at is passed as `exceptFarmId`, since it is already on the map as itself.
 */
export function toOwnTerritories(farms: Farm[], exceptFarmId?: number | null): OtherTerritory[] {
  return farms
    .filter((farm) => farm.id !== exceptFarmId)
    .map((farm) => ({
      key: `own-${farm.id}`,
      label: farm.name,
      // Your own land is all yours, so the pin names the field rather than the owner.
      initial: initialOf(farm.name),
      points: parseTerritory(farm.boundary),
      owner: 'own' as TerritoryOwner,
    }))
    .filter((entry) => entry.points.length >= 3);
}

/** The one letter a pin carries. Empty for a nameless field — the pin still marks the spot. */
export function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

/**
 * The middle of an outline, where its pin sits. The plain average of the corners rather than a
 * true area centroid: at the size of a field the two are a few metres apart, and this one can't
 * divide by zero on a degenerate shape.
 */
export function territoryCenter(points: TerritoryPoint[]): TerritoryPoint | null {
  if (points.length === 0) return null;
  const total = points.reduce(
    (sum, point) => ({ lat: sum.lat + point.lat, lng: sum.lng + point.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: total.lat / points.length, lng: total.lng / points.length };
}

/** WGS84 equatorial radius, in metres — the sphere the area below is measured on. */
const EARTH_RADIUS = 6378137;

const SQUARE_METRES_PER_HECTARE = 10000;

/**
 * Reads a farm's stored boundary — a JSON array of `[latitude, longitude]` pairs. Anything that
 * isn't that shape (an old row, a hand-edited value) reads as "no territory" rather than throwing:
 * the map is a drawing surface, and refusing to open it over one bad value helps nobody.
 */
export function parseTerritory(boundary: string | null | undefined): TerritoryPoint[] {
  if (!boundary) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(boundary);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const points: TerritoryPoint[] = [];
  for (const entry of raw) {
    if (!Array.isArray(entry) || entry.length < 2) continue;
    const [lat, lng] = entry;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    points.push({ lat, lng });
  }
  return points;
}

/** The storage form of a marked territory. An empty outline serialises to `[]` — that is the
 *  difference between "cleared it" and the null the server reads as "said nothing about it". */
export function serializeTerritory(points: TerritoryPoint[]): string {
  return JSON.stringify(points.map((point) => [round6(point.lat), round6(point.lng)]));
}

/** Six decimals is ~11cm at the equator — far finer than anyone can point at on a map, and it
 *  keeps a stored outline short. */
function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

/**
 * The area enclosed by the outline, in hectares. Measured on a sphere (the same spherical-excess
 * sum mapping libraries use) rather than on the flat projection, so a field near the poles isn't
 * reported several times its real size. Fewer than three points enclose nothing.
 */
export function territoryAreaHectares(points: TerritoryPoint[]): number {
  if (points.length < 3) return 0;

  let sum = 0;
  const count = points.length;
  for (let i = 0; i < count; i++) {
    const previous = points[(i - 1 + count) % count];
    const current = points[i];
    const next = points[(i + 1) % count];
    sum += toRadians(next.lng - previous.lng) * Math.sin(toRadians(current.lat));
  }

  const squareMetres = Math.abs((sum * EARTH_RADIUS * EARTH_RADIUS) / 2);
  return squareMetres / SQUARE_METRES_PER_HECTARE;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Rounds an area for display: 2 decimals, without trailing zeros (2.5, not 2.50). */
export function formatArea(hectares: number): string {
  return String(Math.round(hectares * 100) / 100);
}
