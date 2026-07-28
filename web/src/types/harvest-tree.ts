/** How many trees of an orchard were picked for a harvest. Picking moves no balance — the trees
 * are still standing — so this is a record of what was picked, nothing more. */
export type HarvestTree = {
  id: number;
  harvestId: number;
  treeStockId: number;
  /** Number of trees picked, in the orchard's own count unit. */
  amount: number;
  /** How much produce came off those trees, in the tree stock's assigned product unit. */
  harvestedAmount: number;
};

export type HarvestTreeInput = Omit<HarvestTree, 'id'>;
