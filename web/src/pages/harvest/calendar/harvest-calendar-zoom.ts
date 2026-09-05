const LEVELS = [60, 80, 100, 130, 160];

const BASE_HOUR_HEIGHT = 76;
const BASE_MONTH_ROW = 122;

export const DEFAULT_ZOOM = LEVELS.indexOf(100);
export const MIN_ZOOM = 0;
export const MAX_ZOOM = LEVELS.length - 1;

export function clampZoom(level: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, level));
}

export function zoomPercent(level: number): number {
  return LEVELS[clampZoom(level)];
}

export function hourHeightFor(level: number): number {
  return Math.round((BASE_HOUR_HEIGHT * zoomPercent(level)) / 100);
}

export function monthRowHeightFor(level: number): number {
  return Math.round((BASE_MONTH_ROW * zoomPercent(level)) / 100);
}
