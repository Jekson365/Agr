import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import type { AnimalProduction } from '@/types/animal-production';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import type { Livestock } from '@/types/livestock';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { Unit } from '@/types/unit';
import type { DeletedFilter, ProductBalance, Translate } from './product-balance';

// The API returns every movement grouped by product; summing each product's deltas here gives
// its current balance without a separate call to fetch stock directly. A row's key
// differentiates Stock from TreeStock since their ids come from separate sequences.
// `kind` selects which of the two the caller wants, so plant stock and fruit trees can be
// reported in separate columns.
export function balancesByProduct(
  rows: StockMovementReportRow[],
  kind: 'stock' | 'tree',
  t: Translate,
  deleted: DeletedFilter = 'exclude'
): ProductBalance[] {
  const balances: ProductBalance[] = [];
  const byKey = new Map<string, ProductBalance>();

  for (const row of rows) {
    const isTree = row.stockId == null;
    if (isTree !== (kind === 'tree')) continue;
    // A good taken off the list isn't part of what the farm holds any more, however its movements
    // still read in a report of the period they happened in — and in the removed holdings here.
    if (deleted === 'exclude' && row.isDeleted) continue;
    if (deleted === 'only' && !row.isDeleted) continue;

    const key = isTree ? `tree:${row.treeStockId}` : `stock:${row.stockId}`;
    let balance = byKey.get(key);
    if (!balance) {
      balance = {
        key,
        title: row.name.trim() || (isTree ? fruitTypeLabel(row.type, t) : stockTypeLabel(row.type, t)),
        unitLabel: isTree
          ? t(TREE_STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit)
          : t(STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit),
        balance: 0,
        // A removed good is not for sale — the server refuses, so no Sell is offered.
        market: row.isDeleted ? undefined : { category: isTree ? 'TreeStock' : 'Stock', itemType: row.type },
        adjust: row.isDeleted || row.stockId == null ? undefined : { kind: 'stock', stockId: row.stockId },
        removed: row.isDeleted || undefined,
      };
      byKey.set(key, balance);
      balances.push(balance);
    }
    balance.balance += row.delta;
  }

  return balances;
}

/**
 * The groups the farm has removed, by head count. A removed group is no longer part of the herd, so
 * it is off the livestock tab until the removed holdings are asked for — but what it held was real,
 * and this is where it reads back. Its production is not repeated here: that is already counted by
 * {@link balancesByProductionType}, which reads the records rather than the group, and those
 * outlive the group they were collected from.
 */
export function removedLivestockBalances(livestock: Livestock[], t: Translate): ProductBalance[] {
  return livestock
    .filter((group) => group.isDeleted)
    .map((group) => ({
      key: `livestock:${group.id}`,
      title: group.name.trim() || livestockTypeLabel(group.type, t),
      unitLabel: t('balance.unitHead'),
      balance: group.count,
      removed: true,
    }));
}

/**
 * Production records are append-only collections, so a type's balance is everything collected
 * plus the movements logged against that type/unit pair (marketplace sales carry a negative
 * delta). Keyed by unit since a type logged in both litres and pieces can't be summed.
 */
export function balancesByProductionType(
  records: AnimalProduction[],
  movements: ProductionMovement[],
  productionTypes: ProductionType[],
  units: Unit[],
  t: Translate
): ProductBalance[] {
  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  const balances: ProductBalance[] = [];
  const byKey = new Map<string, ProductBalance>();

  const balanceFor = (productionTypeId: number, unitId: number): ProductBalance => {
    const key = `production:${productionTypeId}:${unitId}`;
    let balance = byKey.get(key);
    if (!balance) {
      const type = typeById.get(productionTypeId);
      const unit = unitById.get(unitId);
      balance = {
        key,
        title: type ? t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name) : '',
        unitLabel: unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '',
        balance: 0,
        // Milk, eggs and wool aren't animals, land or equipment — they list under Other, with
        // the production type carried as the item type.
        market: { category: 'Other', itemType: type?.name ?? '' },
        adjust: { kind: 'production', productionTypeId, unitId },
      };
      byKey.set(key, balance);
      balances.push(balance);
    }
    return balance;
  };

  for (const record of records) {
    balanceFor(record.productionTypeId, record.unitId).balance += record.quantity;
  }
  for (const movement of movements) {
    balanceFor(movement.productionTypeId, movement.unitId).balance += movement.delta;
  }

  return balances;
}

/**
 * The fruits column reports the produce trees yield, not the trees themselves — a product's
 * balance is the sum of its movements (harvested adds, sales and manual adjustments can subtract).
 * Selling here lists under the TreeProduct category, keyed by product name, so the "on market"
 * total and the Sell button line up with the marketplace.
 */
export function balancesByTreeProduct(
  products: TreeProduct[],
  movements: TreeProductMovement[],
  t: Translate
): ProductBalance[] {
  const balanceByProduct = new Map<number, number>();
  for (const movement of movements) {
    balanceByProduct.set(movement.treeProductId, (balanceByProduct.get(movement.treeProductId) ?? 0) + movement.delta);
  }

  return products.map((product) => ({
    key: `treeProduct:${product.id}`,
    title: product.name,
    unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg'),
    balance: balanceByProduct.get(product.id) ?? 0,
    market: { category: 'TreeProduct', itemType: product.name },
    adjust: { kind: 'treeProduct', treeProductId: product.id },
  }));
}

/**
 * Greenhouse stock keeps a running `amount` on the row itself rather than a movement ledger, so a
 * crop's balance is simply what it holds — no deltas to sum. One row per stock record, matching how
 * the plant-stock column reports two stocks of the same kind separately.
 *
 * These rows carry no `market`: the marketplace has no greenhouse category, and there is no
 * greenhouse movement table for a sale to draw down, so the column is read-only until both exist.
 */
export function balancesByGreenhouseStock(stock: GreenhouseStock[], t: Translate): ProductBalance[] {
  return stock.map((item) => ({
    key: `greenhouse:${item.id}`,
    title: item.name.trim() || stockTypeLabel(item.type, t),
    unitLabel: t(STOCK_UNIT_LABEL_KEY[item.unit] ?? item.unit),
    balance: item.amount,
    adjust: { kind: 'greenhouseStock', greenhouseStockId: item.id },
  }));
}
