import { stockKindImage, stockTypeLabel } from '@/components/farm/stock/stock';
import { fruitKindImage, fruitTypeLabel } from '@/components/farm/tree-stock/tree-stock';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

// A harvest item/result belongs to exactly one of a Stock good or a TreeStock (fruit) good —
// this is one selectable row in the combined picker used by both.
export type HarvestTargetOption = {
  key: string;
  stockId: number | null;
  treeStockId: number | null;
  label: string;
  icon: number;
};

export function buildHarvestTargetOptions(
  stocks: Stock[],
  treeStocks: TreeStock[],
  t: (key: string) => string
): HarvestTargetOption[] {
  return [
    ...stocks.map((s) => ({
      key: `stock:${s.id}`,
      stockId: s.id,
      treeStockId: null,
      label: s.name.trim() || stockTypeLabel(s.type, t),
      icon: stockKindImage(s.type),
    })),
    ...treeStocks.map((s) => ({
      key: `tree:${s.id}`,
      stockId: null,
      treeStockId: s.id,
      label: s.name.trim() || fruitTypeLabel(s.type, t),
      icon: fruitKindImage(s.type),
    })),
  ];
}

/** The option key for a harvest item/result's current target, or null if it has neither set. */
export function harvestTargetKey(stockId: number | null, treeStockId: number | null): string | null {
  if (stockId != null) return `stock:${stockId}`;
  if (treeStockId != null) return `tree:${treeStockId}`;
  return null;
}
