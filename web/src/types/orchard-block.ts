import type { PlantingPattern } from '@/config/orchard-layout';

export type { PlantingPattern };

/** Where one orchard's trees stand: the outline of the planted area and the pattern filling it.
 *  The positions themselves are not stored — they are laid out from these, so changing a spacing
 *  redraws them rather than migrating a list of coordinates. */
export type OrchardBlock = {
  id: number;
  treeStockId: number;
  /** JSON `[[lat,lng],…]`, the same shape a farm's boundary keeps. */
  boundary: string;
  pattern: PlantingPattern;
  /** Metres between trees along a row. */
  treeSpacing: number;
  /** Metres between rows. Derived from the tree spacing for the triangular pattern. */
  rowSpacing: number;
  /** Which way the rows run, in degrees. */
  rotation: number;
  /** How many the plan comes to, so a list can report it without redoing the geometry. */
  treeCount: number;
  createdAt: string;
};

export type OrchardBlockInput = Omit<OrchardBlock, 'id' | 'createdAt'>;
