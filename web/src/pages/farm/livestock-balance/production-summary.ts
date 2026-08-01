import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import type { AnimalProduction } from '@/types/animal-production';
import type { Livestock } from '@/types/livestock';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';

type Translate = (key: string) => string;

/** One line of the by-product balance: a production type measured in one unit. */
export type ProductRow = {
  key: string;
  typeLabel: string;
  unitLabel: string;
  quantity: number;
  value: number;
  records: number;
};

/** One line of the by-livestock balance. */
export type GroupRow = {
  id: number;
  name: string;
  type: Livestock['type'];
  value: number;
  records: number;
  /**
   * Total quantity keyed by unit label. A group can produce milk in litres and eggs in pieces,
   * and those don't add up — so the column carries a figure per unit rather than one bogus sum.
   */
  quantityByUnit: Map<string, number>;
};

export type ProductionSummary = {
  products: ProductRow[];
  groups: GroupRow[];
  totalValue: number;
  /** The span the records cover, `YYYY-MM-DD`. Null when nothing carries a date. */
  earliest: string | null;
  latest: string | null;
};

export type SummarySource = {
  records: AnimalProduction[];
  movements: ProductionMovement[];
  livestock: Livestock[];
  productionTypes: ProductionType[];
  units: Unit[];
  /** animalId -> the livestock group it belongs to, for attributing single-animal records. */
  groupByAnimal: Map<number, number>;
};

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Everything both tables and the summary cards read, in one pass over the records: what each
 * product came to, what each group collected, the total value and the span it covers.
 */
export function buildProductionSummary(source: SummarySource, t: Translate): ProductionSummary {
  const { records, movements, livestock, productionTypes, units, groupByAnimal } = source;

  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));
  const groupById = new Map(livestock.map((l) => [l.id, l]));

  const typeLabel = (id: number) => {
    const type = typeById.get(id);
    return type ? t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name) : '';
  };
  const unitLabel = (id: number) => {
    const unit = unitById.get(id);
    return unit ? unit.shortName || t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '';
  };

  const products = new Map<string, ProductRow>();
  const groups = new Map<number, GroupRow>();
  let totalValue = 0;
  let earliest: string | null = null;
  let latest: string | null = null;

  for (const record of records) {
    // Fall back to quantity × unit price when a total wasn't entered directly.
    const value = record.totalPrice ?? (record.pricePerUnit != null ? record.quantity * record.pricePerUnit : 0);
    totalValue += value;

    // Quantities are only additive within one unit — a type logged in both litres and pieces
    // gets a line per unit rather than a meaningless combined total.
    const key = `${record.productionTypeId}:${record.unitId}`;
    let product = products.get(key);
    if (!product) {
      product = {
        key,
        typeLabel: typeLabel(record.productionTypeId),
        unitLabel: unitLabel(record.unitId),
        quantity: 0,
        value: 0,
        records: 0,
      };
      products.set(key, product);
    }
    product.quantity += record.quantity;
    product.value += value;
    product.records += 1;

    const groupId = record.livestockId ?? (record.animalId != null ? groupByAnimal.get(record.animalId) : undefined);
    const group = groupId != null ? groupById.get(groupId) : undefined;
    if (group) {
      let row = groups.get(group.id);
      if (!row) {
        row = { id: group.id, name: group.name, type: group.type, value: 0, records: 0, quantityByUnit: new Map() };
        groups.set(group.id, row);
      }
      row.value += value;
      row.records += 1;

      const unit = unitLabel(record.unitId);
      row.quantityByUnit.set(unit, (row.quantityByUnit.get(unit) ?? 0) + record.quantity);
    }

    const date = record.collectionDate;
    if (date) {
      if (earliest == null || date < earliest) earliest = date;
      if (latest == null || date > latest) latest = date;
    }
  }

  // Marketplace sales deduct from the product totals. They aren't attributed to a group, so
  // the per-group breakdown stays a record of what each group collected.
  for (const movement of movements) {
    const key = `${movement.productionTypeId}:${movement.unitId}`;
    const product = products.get(key);
    if (product) {
      product.quantity += movement.delta;
    } else {
      products.set(key, {
        key,
        typeLabel: typeLabel(movement.productionTypeId),
        unitLabel: unitLabel(movement.unitId),
        quantity: movement.delta,
        value: 0,
        records: 0,
      });
    }
  }

  return {
    products: [...products.values()].sort((a, b) => b.value - a.value || b.quantity - a.quantity),
    groups: [...groups.values()].sort((a, b) => b.value - a.value),
    totalValue,
    earliest,
    latest,
  };
}
