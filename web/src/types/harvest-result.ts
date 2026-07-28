// Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree good).
export type HarvestResult = {
  id: number;
  harvestId: number;
  stockId: number | null;
  treeStockId: number | null;
  amount: number;
};

export type HarvestResultInput = Omit<HarvestResult, 'id'>;
