import type { TerritoryPoint } from './territory';

/** A point on the ground in metres east and north of an origin. */
export type Local = { x: number; y: number };

const METRES_PER_DEG_LAT = 110574;

export function metresPerDegLng(lat: number): number {
  return 111320 * Math.cos((lat * Math.PI) / 180);
}

export function centroidOf(points: TerritoryPoint[]): TerritoryPoint {
  const lat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const lng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
  return { lat, lng };
}

/**
 * Latitude and longitude as metres east and north of an origin inside the outline. An
 * equirectangular projection: wrong over a continent, exact enough over a field, and it keeps the
 * spacings the farmer types in the units they typed them in.
 */
export function toLocal(point: TerritoryPoint, origin: TerritoryPoint): Local {
  return {
    x: (point.lng - origin.lng) * metresPerDegLng(origin.lat),
    y: (point.lat - origin.lat) * METRES_PER_DEG_LAT,
  };
}

export function toLatLng(local: Local, origin: TerritoryPoint): TerritoryPoint {
  return {
    lat: origin.lat + local.y / METRES_PER_DEG_LAT,
    lng: origin.lng + local.x / metresPerDegLng(origin.lat),
  };
}

export function rotate(point: Local, radians: number): Local {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

/** Ray casting: a point is inside when a ray to the east crosses an odd number of edges. */
export function contains(polygon: Local[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i];
    const b = polygon[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) {
      inside = !inside;
    }
  }
  return inside;
}

export function shoelaceArea(polygon: Local[]): number {
  let total = 0;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    total += polygon[j].x * polygon[i].y - polygon[i].x * polygon[j].y;
  }
  return Math.abs(total) / 2;
}
