import { fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import { getLivestock } from '@/services/livestock-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getStock } from '@/services/stock-service';
import { getTreeProductBalances, getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import { getUnits } from '@/services/unit-service';
import type { ListingCategory, ListingSourceKind } from '@/types/market-listing';

export type ListingSource = {
  kind: ListingSourceKind;
  id: number;
  unitId?: number;
  category: ListingCategory;
  itemType: string;
  label: string;
  amount: number;
  unitLabel: string;
};

export const SOURCE_KIND_OPTIONS: { value: ListingSourceKind; labelKey: string }[] = [
  { value: 'Stock', labelKey: 'market.sourceStock' },
  { value: 'Livestock', labelKey: 'market.sourceLivestock' },
  { value: 'TreeStock', labelKey: 'market.sourceTreeStock' },
  { value: 'TreeProduct', labelKey: 'market.sourceTreeProduct' },
  { value: 'Production', labelKey: 'market.sourceProduction' },
  { value: 'GreenhouseStock', labelKey: 'market.sourceGreenhouseStock' },
];

type Translate = (key: string) => string;

async function stockSources(t: Translate): Promise<ListingSource[]> {
  return (await getStock()).map((s) => ({
    kind: 'Stock',
    id: s.id,
    category: 'Stock',
    itemType: s.type,
    label: s.name.trim() || stockTypeLabel(s.type, t),
    amount: s.amount,
    unitLabel: t(STOCK_UNIT_LABEL_KEY[s.unit] ?? s.unit),
  }));
}

async function greenhouseStockSources(t: Translate): Promise<ListingSource[]> {
  return (await getGreenhouseStock()).map((s) => ({
    kind: 'GreenhouseStock',
    id: s.id,
    category: 'Stock',
    itemType: s.type,
    label: s.name.trim() || stockTypeLabel(s.type, t),
    amount: s.amount,
    unitLabel: t(STOCK_UNIT_LABEL_KEY[s.unit] ?? s.unit),
  }));
}

async function treeStockSources(t: Translate): Promise<ListingSource[]> {
  return (await getTreeStock()).map((s) => ({
    kind: 'TreeStock',
    id: s.id,
    category: 'TreeStock',
    itemType: s.type,
    label: s.name.trim() || fruitTypeLabel(s.type, t),
    amount: s.amount,
    unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[s.unit] ?? s.unit),
  }));
}

async function treeProductSources(t: Translate): Promise<ListingSource[]> {
  const [products, balances] = await Promise.all([getTreeProducts(), getTreeProductBalances()]);
  return products.map((p) => ({
    kind: 'TreeProduct',
    id: p.id,
    category: 'TreeProduct',
    itemType: p.name,
    label: p.name,
    amount: balances.get(p.id) ?? 0,
    unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[p.unit] ?? 'farm.unitKg'),
  }));
}

async function livestockSources(t: Translate): Promise<ListingSource[]> {
  return (await getLivestock()).map((l) => ({
    kind: 'Livestock',
    id: l.id,
    category: 'Livestock',
    itemType: l.type,
    label: l.name.trim() || livestockTypeLabel(l.type, t),
    amount: l.count,
    unitLabel: '',
  }));
}

async function productionSources(t: Translate): Promise<ListingSource[]> {
  const [types, records, movements, units] = await Promise.all([
    getProductionTypes(),
    getAllAnimalProductions(),
    getProductionMovements(),
    getUnits(),
  ]);

  const balances = new Map<string, { typeId: number; unitId: number; amount: number }>();
  for (const record of records) {
    const key = `${record.productionTypeId}:${record.unitId}`;
    const current = balances.get(key);
    if (current) current.amount += record.quantity;
    else balances.set(key, { typeId: record.productionTypeId, unitId: record.unitId, amount: record.quantity });
  }
  for (const movement of movements) {
    const current = balances.get(`${movement.productionTypeId}:${movement.unitId}`);
    if (current) current.amount += movement.delta;
  }

  return [...balances.values()].map((balance) => {
    const type = types.find((pt) => pt.id === balance.typeId);
    const unit = units.find((u) => u.id === balance.unitId);
    const name = type?.name ?? '';
    return {
      kind: 'Production' as const,
      id: balance.typeId,
      unitId: balance.unitId,
      category: 'Other' as ListingCategory,
      itemType: name,
      label: t(PRODUCTION_TYPE_LABEL_KEY[name] ?? name),
      amount: balance.amount,
      unitLabel: unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '',
    };
  });
}

export function loadSources(kind: ListingSourceKind, t: Translate): Promise<ListingSource[]> {
  switch (kind) {
    case 'Stock':
      return stockSources(t);
    case 'GreenhouseStock':
      return greenhouseStockSources(t);
    case 'TreeStock':
      return treeStockSources(t);
    case 'TreeProduct':
      return treeProductSources(t);
    case 'Livestock':
      return livestockSources(t);
    case 'Production':
      return productionSources(t);
  }
}
