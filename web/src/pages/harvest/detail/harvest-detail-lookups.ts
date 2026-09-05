import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import type { HarvestKind } from '@/types/harvest';
import type { Seed } from '@/types/seed';
import type { TreeProduct } from '@/types/tree-product';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type Translate = (key: string) => string;

/** `isDeleted`: the good behind this row has been removed from the farm. The row is still shown
 *  and still editable — the harvest is a record of what happened — but it is marked as removed. */
export type TargetInfo = { label: string; icon: string; unitLabel: string; isDeleted: boolean };

export type Catalogs = { stocks: Stock[]; treeStocks: TreeStock[]; seeds: Seed[]; treeProducts: TreeProduct[] };

/** What an orchard yields, when it has been given a product. A fruit harvest's amounts are in
 *  this unit — kilograms of apples — not in the orchard's own, which counts trees. */
function produceOf(catalogs: Catalogs, treeStockId: number): TreeProduct | null {
  const treeStock = catalogs.treeStocks.find((s) => s.id === treeStockId);
  if (!treeStock || treeStock.treeProductId == null) return null;
  return catalogs.treeProducts.find((p) => p.id === treeStock.treeProductId) ?? null;
}

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

/**
 * The unit a harvest's yield is measured in. A crop's is the good's own; a fruit harvest's is the
 * orchard's produce, since what was picked is weighed in kilograms while the orchard itself is
 * counted in trees. Falls back to the orchard's unit for one with no product named yet.
 */
export function yieldRawUnitFor(
  catalogs: Catalogs,
  kind: HarvestKind,
  stockId: number | null,
  treeStockId: number | null
): string | null {
  if (kind === 'Fruit' && treeStockId != null) {
    const produce = produceOf(catalogs, treeStockId);
    if (produce) return produce.unit;
  }
  return rawUnitFor(catalogs, stockId, treeStockId);
}

/** {@link targetFor} with the same correction: a fruit row is labelled in its produce's unit. */
export function yieldTargetFor(
  catalogs: Catalogs,
  kind: HarvestKind,
  stockId: number | null,
  treeStockId: number | null,
  t: Translate
): TargetInfo | null {
  const target = targetFor(catalogs, stockId, treeStockId, t);
  if (target == null || kind !== 'Fruit' || treeStockId == null) return target;
  const produce = produceOf(catalogs, treeStockId);
  return produce ? { ...target, unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[produce.unit] ?? '') } : target;
}
