import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import type { GreenhouseSeed, GreenhouseStock } from '@/types/greenhouse-stock';

type Translate = (key: string) => string;

/** How a good is shown wherever it appears: its label, its icon and the unit it is kept in. */
export type TargetInfo = { label: string; icon: string; unitLabel: string };

/** Trims derived ratios to 2 decimals without printing trailing zeros (12.5, not 12.50). */
export function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** The raw unit a good is measured in, for the mixed-unit check. */
export function rawUnitFor(stocks: GreenhouseStock[], greenhouseStockId: number): string | null {
  return stocks.find((stock) => stock.id === greenhouseStockId)?.unit ?? null;
}

/** Label for a unit a plan was written in — it may differ from the good's own. Empty for a row
 * saved without one. */
export function unitLabelFor(unit: string | null, t: Translate): string {
  if (!unit) return '';
  const key = STOCK_UNIT_LABEL_KEY[unit];
  return key ? t(key) : unit;
}

export function targetFor(stocks: GreenhouseStock[], greenhouseStockId: number, t: Translate): TargetInfo | null {
  const stock = stocks.find((s) => s.id === greenhouseStockId);
  if (!stock) return null;
  return {
    label: stock.name.trim() || stockTypeLabel(stock.type, t),
    icon: stockKindImage(stock.type),
    unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
  };
}

/** A seed row's label and unit, for display in the "seeds used" list. */
export function seedInfoFor(seeds: GreenhouseSeed[], greenhouseSeedId: number, t: Translate): TargetInfo | null {
  const seed = seeds.find((s) => s.id === greenhouseSeedId);
  if (!seed) return null;
  return {
    label: seed.name.trim() || stockTypeLabel(seed.type, t),
    unitLabel: t(STOCK_UNIT_LABEL_KEY[seed.unit] ?? seed.unit),
    icon: stockKindImage(seed.type),
  };
}
