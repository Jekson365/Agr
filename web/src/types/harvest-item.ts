// Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree good).
export type HarvestItem = {
  id: number;
  harvestId: number;
  stockId: number | null;
  treeStockId: number | null;
  amount: number;
  /** The unit the plan is expressed in — a StockUnit or TreeStockUnit name. May differ from the
   * unit the target good is stocked in, so it's stored per row. */
  unit: string;
};

export type HarvestItemInput = Omit<HarvestItem, 'id'>;
