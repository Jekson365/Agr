import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';

type Translate = (key: string) => string;

/** How a harvested tree is shown: its label, the unit the trees are counted in and its icon. */
export type TreeInfo = { label: string; unitLabel: string; icon: string };

/** Resolves a harvest row's tree stock for display. Null when the stock has since been deleted. */
export function treeInfoFor(treeStocks: TreeStock[], treeStockId: number, t: Translate): TreeInfo | null {
  const treeStock = treeStocks.find((s) => s.id === treeStockId);
  if (!treeStock) return null;
  const fruit = fruitTypeLabel(treeStock.type, t);
  return {
    label: treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit,
    unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit] ?? 'farm.unitPlant'),
    icon: fruitKindImage(treeStock.type),
  };
}

/**
 * The produce unit for a tree stock's assigned product, shown next to its harvested amount — the
 * trees are counted in plants or rows, but what comes off them is weighed in its own unit.
 */
export function harvestedUnitFor(
  treeStocks: TreeStock[],
  products: TreeProduct[],
  treeStockId: number,
  t: Translate
): string {
  const treeStock = treeStocks.find((s) => s.id === treeStockId);
  const product = treeStock ? products.find((p) => p.id === treeStock.treeProductId) : null;
  return product ? t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg') : '';
}
