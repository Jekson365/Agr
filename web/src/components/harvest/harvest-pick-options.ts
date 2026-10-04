import { fruitKindImage, fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { getStock } from '@/services/stock-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { HarvestKind } from '@/types/harvest';
import type { HarvestTree } from '@/types/harvest-tree';

type Translate = (key: string) => string;

export type PickOption = {
  id: number;
  label: string;
  icon: string;
  amount: number;
  unitLabel: string;
  harvestedUnitLabel: string;
  isDeleted: boolean;
};

export function pickKeyPrefix(kind: HarvestKind): string {
  return kind === 'Wine' ? 'harvestVine' : 'harvestTree';
}

export function pickTargetId(kind: HarvestKind, tree: Pick<HarvestTree, 'stockId' | 'treeStockId'>): number | null {
  return kind === 'Wine' ? tree.stockId : tree.treeStockId;
}

export function pickTarget(kind: HarvestKind, id: number): Pick<HarvestTree, 'stockId' | 'treeStockId'> {
  return kind === 'Wine' ? { stockId: id, treeStockId: null } : { stockId: null, treeStockId: id };
}

export async function loadPickOptions(kind: HarvestKind, t: Translate): Promise<PickOption[]> {
  if (kind === 'Wine') {
    const stocks = await getStock(true, 'Wine');
    return stocks.map((stock) => {
      const type = stockTypeLabel(stock.type, t);
      return {
        id: stock.id,
        label: stock.name.trim() ? `${type} · ${stock.name}` : type,
        icon: stockKindImage(stock.type),
        amount: stock.amount,
        unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit] ?? 'farm.unitPlant'),
        harvestedUnitLabel: t('farm.unitKg'),
        isDeleted: stock.isDeleted,
      };
    });
  }

  const [treeStocks, products] = await Promise.all([getTreeStock(true), getTreeProducts()]);
  return treeStocks.map((treeStock) => {
    const fruit = fruitTypeLabel(treeStock.type, t);
    const product = products.find((p) => p.id === treeStock.treeProductId);
    return {
      id: treeStock.id,
      label: treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit,
      icon: fruitKindImage(treeStock.type),
      amount: treeStock.amount,
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit] ?? 'farm.unitPlant'),
      harvestedUnitLabel: t(product ? TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg' : 'farm.unitKg'),
      isDeleted: treeStock.isDeleted,
    };
  });
}
