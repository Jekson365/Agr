import type { StockMovementSource } from '@/types/stock-movement';

export type TreeStockMovement = {
  id: number;
  treeStockId: number;
  delta: number;
  source: StockMovementSource;
  /** The listing a Market sale came from; deleting the movement restores it. */
  marketListingId: number | null;
  createdAt: string;
};
