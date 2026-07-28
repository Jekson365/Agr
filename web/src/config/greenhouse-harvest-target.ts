import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

/**
 * The greenhouse counterpart to harvest-target.ts. Simpler than the field version: a greenhouse
 * has no orchard equivalent, so a planned item or result always targets GreenhouseStock — there is
 * no second branch to pick between.
 */
export type GreenhouseHarvestTargetOption = {
  key: string;
  greenhouseStockId: number;
  label: string;
  icon: string;
  /** The raw unit this good is stocked in — the default a plan is written in. */
  unit: string;
};

export function buildGreenhouseHarvestTargetOptions(
  stocks: GreenhouseStock[],
  t: (key: string) => string
): GreenhouseHarvestTargetOption[] {
  return stocks.map((s) => ({
    key: `stock:${s.id}`,
    greenhouseStockId: s.id,
    label: s.name.trim() || stockTypeLabel(s.type, t),
    icon: stockKindImage(s.type),
    unit: s.unit,
  }));
}

/** The option key for a planned item/result's current target. */
export function greenhouseHarvestTargetKey(greenhouseStockId: number): string {
  return `stock:${greenhouseStockId}`;
}
