// Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree good).
export type HarvestItem = {
  id: number;
  harvestId: number;
  stockId: number | null;
  treeStockId: number | null;
  amount: number;
};

export type HarvestItemInput = Omit<HarvestItem, 'id'>;
