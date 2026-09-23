import { metresPerDegLng, toLatLng } from '@/config/orchard-geometry';
import { parseTerritory, type TerritoryPoint } from '@/config/territory';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import type { TreeStock } from '@/types/tree-stock';

/** The square a block starts as when there is no ground to copy: half a hectare, which is a
 *  believable orchard and small enough to be dragged outward rather than trimmed down. */
const SEED_HECTARES = 0.5;

/** The land an orchard is planted on, through the plot that names it. */
export function farmOf(orchard: TreeStock, plots: LandPlot[], farms: Farm[]): Farm | null {
  const plot = plots.find((row) => row.id === orchard.landPlotId);
  return farms.find((row) => row.id === plot?.farmId) ?? null;
}

/**
 * Where a brand-new block starts.
 *
 * The land's own outline first: it is real ground, already marked, and the orchard sits somewhere
 * inside it — so the shape only has to be dragged in rather than found. Failing that a square
 * around whatever position is known, which is a placeholder with the right coordinates rather than
 * a plan. Nothing known at all returns nothing, and the panel says so instead of inventing a field
 * in the sea off West Africa.
 */
export function seedOutline(farm: Farm | null, fallback: TerritoryPoint | null): TerritoryPoint[] {
  const marked = parseTerritory(farm?.boundary);
  if (marked.length >= 3) return marked;

  if (!fallback) return [];

  const half = Math.sqrt(SEED_HECTARES * 10_000) / 2;
  return [
    toLatLng({ x: -half, y: -half }, fallback),
    toLatLng({ x: half, y: -half }, fallback),
    toLatLng({ x: half, y: half }, fallback),
    toLatLng({ x: -half, y: half }, fallback),
  ];
}

/** Guards against a fallback that is not a usable position. */
export function locationOf(latitude: number | null, longitude: number | null): TerritoryPoint | null {
  if (latitude == null || longitude == null) return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude === 0 && longitude === 0) return null;
  return Number.isFinite(metresPerDegLng(latitude)) ? { lat: latitude, lng: longitude } : null;
}
