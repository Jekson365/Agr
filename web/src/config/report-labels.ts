import { fruitKindImage, fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { PRODUCTION_TYPE_LABEL_KEY } from '@/config/production';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import type { ReportGoodKind } from '@/types/report';

/**
 * The report's numbers are totalled on the server, which sends raw names — a StockKind, a unit —
 * rather than display text. Turning those into a label and an icon stays here: the translations
 * and the artwork are both client-side, and duplicating either server-side would fork them.
 */

type Named = { name: string; typeName: string; kind: ReportGoodKind };

/** A row's display name: its own, falling back to its kind's translated label. */
export function reportLabel(row: Named, t: (key: string) => string): string {
  switch (row.kind) {
    case 'stock':
      return row.name.trim() || stockTypeLabel(row.typeName, t);
    case 'tree':
      return row.name.trim() || fruitTypeLabel(row.typeName, t);
    case 'treeProduct':
      // A tree product is a user-named catalog entry, so it has no translated fallback.
      return row.name.trim() || fruitTypeLabel(row.typeName, t);
    case 'seed':
      return seedTitle({ name: row.name, type: row.typeName }, t);
    case 'productionType':
      return t(PRODUCTION_TYPE_LABEL_KEY[row.typeName] ?? row.typeName);
    default:
      return row.name;
  }
}

/** The artwork for a row, or its catalog's generic fallback. */
export function reportIcon(row: Named): string {
  switch (row.kind) {
    case 'stock':
    case 'seed':
      return stockKindImage(row.typeName);
    case 'tree':
    case 'treeProduct':
      return fruitKindImage(row.typeName);
    default:
      return stockKindImage(row.typeName);
  }
}

/**
 * A unit's label. Each catalog measures in its own set, so the map depends on the row's kind —
 * production units already arrive as a short name and pass through.
 */
export function reportUnitLabel(kind: ReportGoodKind, unit: string, t: (key: string) => string): string {
  if (!unit) return '';
  switch (kind) {
    case 'stock':
      return t(STOCK_UNIT_LABEL_KEY[unit] ?? unit);
    case 'tree':
      return t(TREE_STOCK_UNIT_LABEL_KEY[unit] ?? unit);
    case 'treeProduct':
      return t(TREE_PRODUCT_UNIT_LABEL_KEY[unit] ?? unit);
    case 'seed':
      return t(SEED_UNIT_LABEL_KEY[unit] ?? unit);
    default:
      return unit;
  }
}
