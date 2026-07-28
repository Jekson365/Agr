import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

// A harvest item/result belongs to exactly one of a Stock good or a TreeStock (fruit) good —
// this is one selectable row in the combined picker used by both.
export type HarvestTargetOption = {
  key: string;
  stockId: number | null;
  treeStockId: number | null;
  label: string;
  icon: string;
  /** The raw unit this good is stocked in (e.g. 'Kilogram') — the default a plan is written in. */
  unit: string;
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
      unit: s.unit,
    })),
    ...treeStocks.map((s) => ({
      key: `tree:${s.id}`,
      stockId: null,
      treeStockId: s.id,
      label: s.name.trim() || fruitTypeLabel(s.type, t),
      icon: fruitKindImage(s.type),
      unit: s.unit,
    })),
  ];
}

/** The option key for a harvest item/result's current target, or null if it has neither set. */
export function harvestTargetKey(stockId: number | null, treeStockId: number | null): string | null {
  if (stockId != null) return `stock:${stockId}`;
  if (treeStockId != null) return `tree:${treeStockId}`;
  return null;
}
