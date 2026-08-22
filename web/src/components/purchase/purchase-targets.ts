import { fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { SEED_UNIT_LABEL_KEY } from '@/config/seed-kinds';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getEquipment } from '@/services/equipment-service';
import { getLivestock } from '@/services/livestock-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getSeeds } from '@/services/seed-service';
import { getStock } from '@/services/stock-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import { getUnits } from '@/services/unit-service';
import type { PurchaseItemKind } from '@/types/purchase';

type Translate = (key: string) => string;

export const PURCHASE_KIND_LABEL_KEY: Record<PurchaseItemKind, string> = {
  Livestock: 'purchase.kindLivestock',
  LivestockProduction: 'purchase.kindLivestockProduction',
  TreeStock: 'purchase.kindTreeStock',
  TreeProduct: 'purchase.kindTreeProduct',
  Stock: 'purchase.kindStock',
  Seed: 'purchase.kindSeed',
  Equipment: 'purchase.kindEquipment',
};

export const PURCHASE_KIND_ORDER: PurchaseItemKind[] = [
  'Livestock',
  'LivestockProduction',
  'TreeStock',
  'TreeProduct',
  'Stock',
  'Seed',
  'Equipment',
];

const maybe = <T,>(on: boolean, load: () => Promise<T[]>): Promise<T[]> =>
  on ? load().catch(() => []) : Promise.resolve([]);

/** A blank row for a kind, pointing at that kind's first target. */

export type PurchaseTarget = {
  targetId: number;
  unitId: number | null;
  label: string;
  unitLabel: string;
};

export type PurchaseTargets = Record<PurchaseItemKind, PurchaseTarget[]>;

export const EMPTY_TARGETS: PurchaseTargets = {
  Livestock: [],
  LivestockProduction: [],
  TreeStock: [],
  TreeProduct: [],
  Stock: [],
  Seed: [],
  Equipment: [],
};

export type PurchaseAreas = {
  livestock: boolean;
  fruits: boolean;
  crops: boolean;
  equipment: boolean;
};

export async function loadPurchaseTargets(t: Translate, areas: PurchaseAreas): Promise<PurchaseTargets> {
  const [groups, productions, movements, productionTypes, units, orchards, treeProducts, stock, seeds, equipment] =
    await Promise.all([
      maybe(areas.livestock, () => getLivestock()),
      maybe(areas.livestock, () => getAllAnimalProductions()),
      maybe(areas.livestock, () => getProductionMovements()),
      maybe(areas.livestock, () => getProductionTypes()),
      maybe(areas.livestock, () => getUnits()),
      maybe(areas.fruits, () => getTreeStock()),
      maybe(areas.fruits, () => getTreeProducts()),
      maybe(areas.crops, () => getStock()),
      maybe(areas.crops, () => getSeeds()),
      maybe(areas.equipment, () => getEquipment()),
    ]);

  const typeById = new Map(productionTypes.map((type) => [type.id, type]));
  const unitById = new Map(units.map((unit) => [unit.id, unit]));
  const pairs = new Map<string, PurchaseTarget>();
  const addPair = (productionTypeId: number, unitId: number) => {
    const key = `${productionTypeId}:${unitId}`;
    if (pairs.has(key)) return;
    const type = typeById.get(productionTypeId);
    const unit = unitById.get(unitId);
    if (!type || !unit) return;
    pairs.set(key, {
      targetId: productionTypeId,
      unitId,
      label: t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name),
      unitLabel: t(UNIT_LABEL_KEY[unit.name] ?? unit.name),
    });
  };
  for (const record of productions) addPair(record.productionTypeId, record.unitId);
  for (const movement of movements) addPair(movement.productionTypeId, movement.unitId);

  return {
    Livestock: groups.map((group) => ({
      targetId: group.id,
      unitId: null,
      label: group.name.trim() || livestockTypeLabel(group.type, t),
      unitLabel: t('balance.unitHead'),
    })),
    LivestockProduction: [...pairs.values()],
    TreeStock: orchards.map((orchard) => ({
      targetId: orchard.id,
      unitId: null,
      label: orchard.name.trim() || fruitTypeLabel(orchard.type, t),
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[orchard.unit] ?? 'farm.unitPlant'),
    })),
    TreeProduct: treeProducts.map((product) => ({
      targetId: product.id,
      unitId: null,
      label: product.name,
      unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg'),
    })),
    Stock: stock.map((item) => ({
      targetId: item.id,
      unitId: null,
      label: item.name.trim() || stockTypeLabel(item.type, t),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[item.unit] ?? item.unit),
    })),
    Seed: seeds.map((seed) => ({
      targetId: seed.id,
      unitId: null,
      label: seed.name.trim() || stockTypeLabel(seed.type, t),
      unitLabel: t(SEED_UNIT_LABEL_KEY[seed.unit] ?? seed.unit),
    })),
    Equipment: equipment.map((item) => ({
      targetId: item.id,
      unitId: null,
      label: item.name,
      unitLabel: t('purchase.unitPiece'),
    })),
  };
}
