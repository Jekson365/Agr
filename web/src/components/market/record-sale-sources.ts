import { fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { bottleLotLabel, loadBottleLots } from '@/pages/wine/wine-bottle-lots';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getProductionMovements, recordProductionSale } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getStock, recordStockSale } from '@/services/stock-service';
import { getTreeProductBalances, getTreeProducts, recordTreeProductSale } from '@/services/tree-product-service';
import { getTreeStock, recordTreeStockSale } from '@/services/tree-stock-service';
import { getUnits } from '@/services/unit-service';
import { getWineBatch } from '@/services/wine-batch-service';
import { recordWineSale } from '@/services/wine-movement-service';
import type { MarketListing } from '@/types/market-listing';

export type SaleSource = {
  kind: 'stock' | 'tree' | 'production' | 'treeProduct' | 'wineBottle' | 'wineBulk';
  id: number;
  productionTypeId?: number;
  unitId?: number;
  label: string;
  amount: number;
  unitLabel: string;
};

type Translate = (key: string) => string;

function bestOf(candidates: SaleSource[], title: string): SaleSource | null {
  if (candidates.length === 0) return null;
  const wanted = title.trim().toLowerCase();
  return (
    candidates.find((c) => c.label.toLowerCase() === wanted) ??
    candidates.reduce((best, c) => (c.amount > best.amount ? c : best))
  );
}

async function stockSource(itemType: string, title: string, t: Translate): Promise<SaleSource | null> {
  const rows = (await getStock())
    .filter((s) => s.type === itemType)
    .map<SaleSource>((s) => ({
      kind: 'stock',
      id: s.id,
      label: s.name.trim() || stockTypeLabel(s.type, t),
      amount: s.amount,
      unitLabel: t(STOCK_UNIT_LABEL_KEY[s.unit]),
    }));
  return bestOf(rows, title);
}

async function treeStockSource(itemType: string, title: string, t: Translate): Promise<SaleSource | null> {
  const rows = (await getTreeStock())
    .filter((s) => s.type === itemType)
    .map<SaleSource>((s) => ({
      kind: 'tree',
      id: s.id,
      label: s.name.trim() || fruitTypeLabel(s.type, t),
      amount: s.amount,
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[s.unit]),
    }));
  return bestOf(rows, title);
}

async function treeProductSource(itemType: string, title: string, t: Translate): Promise<SaleSource | null> {
  const [productList, balances] = await Promise.all([getTreeProducts(), getTreeProductBalances()]);
  const rows = productList
    .filter((p) => p.name === itemType || p.name === title.trim())
    .map<SaleSource>((p) => ({
      kind: 'treeProduct',
      id: p.id,
      label: p.name,
      amount: balances.get(p.id) ?? 0,
      unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[p.unit] ?? 'farm.unitKg'),
    }));
  return bestOf(rows, title);
}

async function productionSource(itemType: string, t: Translate): Promise<SaleSource | null> {
  const types = await getProductionTypes();
  const type = types.find((pt) => pt.name === itemType);
  if (!type) return null;

  const [records, movements, units] = await Promise.all([getAllAnimalProductions(), getProductionMovements(), getUnits()]);

  const byUnit = new Map<number, number>();
  for (const record of records) {
    if (record.productionTypeId !== type.id) continue;
    byUnit.set(record.unitId, (byUnit.get(record.unitId) ?? 0) + record.quantity);
  }
  if (byUnit.size === 0) return null;
  for (const movement of movements) {
    if (movement.productionTypeId !== type.id) continue;
    if (byUnit.has(movement.unitId)) byUnit.set(movement.unitId, byUnit.get(movement.unitId)! + movement.delta);
  }

  const [unitId, amount] = [...byUnit.entries()].reduce((best, entry) => (entry[1] > best[1] ? entry : best));
  const unit = units.find((u) => u.id === unitId);
  return {
    kind: 'production',
    id: type.id,
    productionTypeId: type.id,
    unitId,
    label: t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name),
    amount,
    unitLabel: unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '',
  };
}

async function wineSource(listing: MarketListing, t: Translate): Promise<SaleSource | null> {
  if ((listing.sourceKind !== 'WineBottle' && listing.sourceKind !== 'WineBulk') || listing.sourceId == null) return null;
  const batch = await getWineBatch(listing.sourceId);
  if (listing.sourceKind === 'WineBulk') {
    return { kind: 'wineBulk', id: batch.id, label: batch.name, amount: batch.liters, unitLabel: t('wine.unitLiter') };
  }
  const lot = (await loadBottleLots(batch.id)).find((row) => row.bottlingId === listing.sourceUnitId);
  if (!lot) return null;
  return {
    kind: 'wineBottle',
    id: batch.id,
    unitId: lot.bottlingId,
    label: bottleLotLabel(lot, t, batch.name),
    amount: lot.left,
    unitLabel: t('wine.unitBottle'),
  };
}

export async function resolveSaleSource(listing: MarketListing, t: Translate): Promise<SaleSource | null> {
  switch (listing.category) {
    case 'Stock':
      return stockSource(listing.itemType, listing.title, t);
    case 'TreeStock':
      return treeStockSource(listing.itemType, listing.title, t);
    case 'TreeProduct':
      return treeProductSource(listing.itemType, listing.title, t);
    case 'Wine':
      return wineSource(listing, t);
    default:
      return (await productionSource(listing.itemType, t)) ?? (await stockSource(listing.itemType, listing.title, t));
  }
}

export async function recordSale(source: SaleSource, quantity: number, listing: MarketListing): Promise<void> {
  switch (source.kind) {
    case 'production':
      await recordProductionSale(source.productionTypeId!, source.unitId!, quantity, listing.id);
      return;
    case 'treeProduct':
      await recordTreeProductSale(source.id, quantity);
      return;
    case 'tree':
      await recordTreeStockSale(source.id, quantity, listing.id);
      return;
    case 'wineBottle':
    case 'wineBulk':
      await recordWineSale(source.id, quantity, source.kind === 'wineBottle', listing.price * quantity, source.unitId ?? null);
      return;
    default:
      await recordStockSale(source.id, quantity, listing.id);
  }
}
