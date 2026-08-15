import type { StockMovementSource } from '@/types/stock-movement';

/** One row of the plant/fruit stock-movement report — a movement joined with the product it
 * changed. Belongs to exactly one of stockId (a plant-stock good) or treeStockId (a fruit-tree
 * good). Mirrors the server's Server.Models.Reports.StockMovementReportRow. */
export type StockMovementReportRow = {
  id: number;
  stockId: number | null;
  treeStockId: number | null;
  name: string;
  type: string;
  unit: string;
  delta: number;
  source: StockMovementSource;
  /** Whether the good has since been removed from stock. The movement still happened, so a report
   *  of a period keeps it; a balance of what is held now leaves it out. Always false for fruit. */
  isDeleted: boolean;
  createdAt: string;
};
