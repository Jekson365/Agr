import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import type { Seed } from '@/types/seed';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Translate = (key: string) => string;

/** `isDeleted`: the good behind this row has been removed from the farm. The row is still shown
 *  and still editable — the harvest is a record of what happened — but it is marked as removed. */
export type TargetInfo = { label: string; icon: string; unitLabel: string; isDeleted: boolean };

export type Catalogs = { stocks: Stock[]; treeStocks: TreeStock[]; seeds: Seed[] };

export function targetFor(
  catalogs: Catalogs,
  stockId: number | null,
  treeStockId: number | null,
  t: Translate
): TargetInfo | null {
  if (stockId != null) {
    const stock = catalogs.stocks.find((s) => s.id === stockId);
    if (!stock) return null;
    return {
      label: stock.name.trim() || stockTypeLabel(stock.type, t),
      icon: stockKindImage(stock.type),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
      isDeleted: stock.isDeleted,
    };
  }
  if (treeStockId != null) {
    const treeStock = catalogs.treeStocks.find((s) => s.id === treeStockId);
    if (!treeStock) return null;
    return {
      label: treeStock.name.trim() || fruitTypeLabel(treeStock.type, t),
      icon: fruitKindImage(treeStock.type),
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit]),
      isDeleted: treeStock.isDeleted,
    };
  }
  return null;
}

export function seedInfoFor(catalogs: Catalogs, seedId: number, t: Translate): TargetInfo | null {
  const seed = catalogs.seeds.find((s) => s.id === seedId);
  if (!seed) return null;
  return {
    label: seedTitle(seed, t),
    unitLabel: t(SEED_UNIT_LABEL_KEY[seed.unit]),
    icon: stockKindImage(seed.type),
    isDeleted: seed.isDeleted,
  };
}

export function treeInfoFor(catalogs: Catalogs, treeStockId: number, t: Translate): TargetInfo | null {
  const treeStock = catalogs.treeStocks.find((s) => s.id === treeStockId);
  if (!treeStock) return null;
  const fruit = fruitTypeLabel(treeStock.type, t);
  return {
    label: treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit,
    unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit] ?? 'farm.unitPlant'),
    icon: fruitKindImage(treeStock.type),
    isDeleted: treeStock.isDeleted,
  };
}

/** The raw unit a good is measured in (e.g. 'Kilogram'), for the mixed-unit check. */
export function rawUnitFor(catalogs: Catalogs, stockId: number | null, treeStockId: number | null): string | null {
  if (stockId != null) return catalogs.stocks.find((s) => s.id === stockId)?.unit ?? null;
  if (treeStockId != null) return catalogs.treeStocks.find((s) => s.id === treeStockId)?.unit ?? null;
  return null;
}

/** Label for a unit a plan was written in — it may come from either catalog, so both maps are
 *  consulted before falling back to the raw name. Empty for a row saved without one. */
export function unitLabelFor(unit: string | null, t: Translate): string {
  if (!unit) return '';
  const key = STOCK_UNIT_LABEL_KEY[unit] ?? TREE_STOCK_UNIT_LABEL_KEY[unit];
  return key ? t(key) : unit;
}

/** Trims derived ratios to 2 decimals without printing trailing zeros (12.5, not 12.50). */
export function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}
