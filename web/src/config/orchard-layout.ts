import {
  centroidOf,
  contains,
  rotate,
  shoelaceArea,
  toLatLng,
  toLocal,
} from './orchard-geometry';
import type { TerritoryPoint } from './territory';

export type PlantingPattern = 'Square' | 'Staggered' | 'Triangular' | 'Hedgerow';

export type PlantingPlan = {
  /** Where each tree stands, in the order the rows were walked. */
  trees: TerritoryPoint[];
  /** Each unbroken run of trees along a row, for the layouts drawn as a continuous hedge. A
   *  concave outline splits a row into several runs, so this is a list per run, not per row. */
  runs: TerritoryPoint[][];
  /** The spacings actually used. They are what was asked for unless the outline held more trees
   *  than the orchard has, in which case they were widened — see {@link fitPlanting}. */
  treeSpacing: number;
  rowSpacing: number;
  /** True when the spacings were adjusted from the ones asked for, to land the plan on the
   *  orchard's own tree count. */
  fitted: boolean;
  /** The outline's area in square metres. */
  area: number;
  /** True when the outline and spacings would have produced more trees than can be laid out at
   *  once; the plan is then a partial one and the spacings want raising. */
  truncated: boolean;
};

/** Triangular is the one pattern that owns its row spacing: √3/2 of the tree spacing is what puts
 *  every tree the same distance from all six of its neighbours. */
export function effectiveRowSpacing(pattern: PlantingPattern, treeSpacing: number, rowSpacing: number): number {
  return pattern === 'Triangular' ? (treeSpacing * Math.sqrt(3)) / 2 : rowSpacing;
}

/** Whether the rows are offset by half a tree spacing on alternate rows. */
function isOffset(pattern: PlantingPattern): boolean {
  return pattern === 'Staggered' || pattern === 'Triangular';
}

/** Guards a spacing typed as a fraction of a metre over a field-sized outline: the walk below is
 *  bounded by the candidates it may test, not by the numbers it was handed. */
const MAX_CANDIDATES = 400_000;
const MAX_TREES = 20_000;

export const EMPTY_PLAN: PlantingPlan = {
  trees: [],
  runs: [],
  treeSpacing: 0,
  rowSpacing: 0,
  fitted: false,
  area: 0,
  truncated: false,
};

/**
 * Fills an outline with trees. The outline is projected to metres, turned so the rows run along
 * the x axis, walked as a grid, and every candidate that falls inside is kept and turned back
 * into a position on the map. The plan always takes the whole shape — how many trees that comes
 * to is the answer, not an input.
 */
export function buildPlanting(
  boundary: TerritoryPoint[],
  pattern: PlantingPattern,
  treeSpacing: number,
  rowSpacing: number,
  rotationDegrees: number
): PlantingPlan {
  const rows = effectiveRowSpacing(pattern, treeSpacing, rowSpacing);
  if (boundary.length < 3 || treeSpacing <= 0 || rows <= 0) return EMPTY_PLAN;

  const origin = centroidOf(boundary);
  const radians = (rotationDegrees * Math.PI) / 180;
  const polygon = boundary.map((point) => rotate(toLocal(point, origin), -radians));

  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const rowCount = Math.floor((maxY - minY) / rows) + 1;
  const columnCount = Math.floor((maxX - minX) / treeSpacing) + 1;
  if (rowCount * columnCount > MAX_CANDIDATES) {
    return { ...EMPTY_PLAN, treeSpacing, rowSpacing: rows, area: shoelaceArea(polygon), truncated: true };
  }

  const trees: TerritoryPoint[] = [];
  const runs: TerritoryPoint[][] = [];
  let truncated = false;

  for (let row = 0; row < rowCount; row += 1) {
    const y = minY + row * rows;
    const offset = isOffset(pattern) && row % 2 === 1 ? treeSpacing / 2 : 0;
    let run: TerritoryPoint[] = [];

    for (let column = 0; column < columnCount; column += 1) {
      const x = minX + offset + column * treeSpacing;
      if (x > maxX) break;

      if (!contains(polygon, x, y)) {
        if (run.length > 1) runs.push(run);
        run = [];
        continue;
      }

      if (trees.length >= MAX_TREES) {
        truncated = true;
        break;
      }


      const point = toLatLng(rotate({ x, y }, radians), origin);
      trees.push(point);
      run.push(point);
    }

    if (run.length > 1) runs.push(run);
    if (truncated) break;
  }

  return {
    trees,
    runs,
    treeSpacing,
    rowSpacing: rows,
    fitted: false,
    area: shoelaceArea(polygon),
    truncated,
  };
}
