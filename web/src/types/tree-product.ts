export type TreeProductUnit = 'Kilogram' | 'Box' | 'Quantity';

/** A kind of produce a tree yields — a standalone catalog entry, assigned to trees. */
export type TreeProduct = {
  id: number;
  name: string;
  unit: TreeProductUnit;
};

export type TreeProductInput = Omit<TreeProduct, 'id'>;

/** How much of a tree product one harvest yielded. */
export type HarvestProduct = {
  id: number;
  harvestId: number;
  treeProductId: number;
  amount: number;
};

export type HarvestProductInput = Omit<HarvestProduct, 'id'>;

export type TreeProductMovementSource = 'Manual' | 'Harvest' | 'Market';

/** A single change to a product's balance — positive when harvested, negative when drawn down. */
export type TreeProductMovement = {
  id: number;
  treeProductId: number;
  harvestProductId: number | null;
  delta: number;
  source: TreeProductMovementSource;
  createdAt: string;
  /** The date of the harvest behind this movement, `YYYY-MM-DD`. What the history is dated by:
   *  `createdAt` is only when the row was written. Absent on manual and market adjustments, and
   *  on the movement a POST hands back — neither of which comes from a harvest. */
  harvestDate?: string | null;
};
