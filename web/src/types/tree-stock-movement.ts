import type { StockMovementSource } from '@/types/stock-movement';

export type TreeStockMovement = {
  id: number;
  treeStockId: number;
  delta: number;
  source: StockMovementSource;
  /** The listing a Market sale came from; deleting the movement restores it. */
  marketListingId: number | null;
  /** What a manual movement was entered for, and the day it happened; null on the rest. */
  note: string | null;
  date: string | null;
  createdAt: string;
};
