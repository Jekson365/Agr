import type { PlantingPattern } from './orchard-layout';

export const PLANTING_PATTERNS: PlantingPattern[] = ['Square', 'Staggered', 'Triangular', 'Hedgerow'];

export const PLANTING_PATTERN_LABEL_KEY: Record<PlantingPattern, string> = {
  Square: 'positioning.patternSquare',
  Staggered: 'positioning.patternStaggered',
  Triangular: 'positioning.patternTriangular',
  Hedgerow: 'positioning.patternHedgerow',
};

export const PLANTING_PATTERN_HINT_KEY: Record<PlantingPattern, string> = {
  Square: 'positioning.patternSquareHint',
  Staggered: 'positioning.patternStaggeredHint',
  Triangular: 'positioning.patternTriangularHint',
  Hedgerow: 'positioning.patternHedgerowHint',
};

/** Spacings that suit each layout, applied when the pattern is picked so the plan is sensible
 *  before anything is typed. Metres: [between trees, between rows]. */
export const PLANTING_PATTERN_DEFAULTS: Record<PlantingPattern, { treeSpacing: number; rowSpacing: number }> = {
  Square: { treeSpacing: 4, rowSpacing: 4 },
  Staggered: { treeSpacing: 4, rowSpacing: 3.5 },
  Triangular: { treeSpacing: 4, rowSpacing: 3.46 },
  Hedgerow: { treeSpacing: 1.5, rowSpacing: 4 },
};

/** Whether the row is drawn as a line through its trees as well as the trees themselves — what
 *  makes a hedge read as one planting rather than as a tight row of separate ones. */
export function drawsRows(pattern: PlantingPattern): boolean {
  return pattern === 'Hedgerow';
}

/** Whether the row spacing is the farmer's to set, or the pattern's own. */
export function rowSpacingIsDerived(pattern: PlantingPattern): boolean {
  return pattern === 'Triangular';
}
