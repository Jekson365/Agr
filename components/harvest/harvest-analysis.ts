import type { Harvest, HarvestStatus } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';

/**
 * Derived views over a harvest — planned-vs-actual yield and the normalized economics.
 * Kept out of the pages so the web and mobile detail screens can't drift apart on the maths.
 */

/** Stable identity for "the same good", so a planned item pairs with its recorded result. */
export type TargetKey = string;

export function targetKey(stockId: number | null, treeStockId: number | null): TargetKey {
  return stockId != null ? `stock:${stockId}` : `tree:${treeStockId}`;
}

export type YieldRow = {
  key: TargetKey;
  stockId: number | null;
  treeStockId: number | null;
  /** Sum of the HarvestItem amounts for this good — what was planned. */
  planned: number;
  /** Sum of the HarvestResult amounts for this good — what was actually recorded. */
  actual: number;
  /** actual - planned. Negative means a shortfall. */
  variance: number;
  /** variance as a fraction of planned, or null when nothing was planned (no baseline). */
  varianceRatio: number | null;
  /** True when the good was recorded but never planned. */
  unplanned: boolean;
  /** True when the good was planned but has no result recorded. */
  missing: boolean;
};

/**
 * Pairs planned items against recorded results by good, so a harvest can be read as
 * "planned 500, got 380, -24%". Goods appearing on only one side still get a row — an
 * unplanned result and an unfulfilled plan are both things worth seeing.
 */
export function buildYieldRows(items: HarvestItem[], results: HarvestResult[]): YieldRow[] {
  const rows = new Map<TargetKey, YieldRow>();

  const rowFor = (stockId: number | null, treeStockId: number | null): YieldRow => {
    const key = targetKey(stockId, treeStockId);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        stockId,
        treeStockId,
        planned: 0,
        actual: 0,
        variance: 0,
        varianceRatio: null,
        unplanned: false,
        missing: false,
      };
      rows.set(key, row);
    }
    return row;
  };

  for (const item of items) {
    rowFor(item.stockId, item.treeStockId).planned += item.amount;
  }
  for (const result of results) {
    rowFor(result.stockId, result.treeStockId).actual += result.amount;
  }

  for (const row of rows.values()) {
    row.variance = row.actual - row.planned;
    row.varianceRatio = row.planned > 0 ? row.variance / row.planned : null;
    row.unplanned = row.planned === 0 && row.actual > 0;
    row.missing = row.planned > 0 && row.actual === 0;
  }

  return [...rows.values()];
}

export type HarvestEconomics = {
  totalExpenses: number;
  revenue: number;
  net: number;
  /** Total recorded yield. Only meaningful when every result shares one unit — see `unit`. */
  totalYield: number;
  /**
   * The single unit every recorded result is measured in, or null when the harvest mixes units
   * (e.g. kilograms and boxes). Summing across units would be meaningless, so the per-unit
   * figures below are null in that case rather than quietly wrong.
   */
  unit: string | null;
  /** Total expenses per unit of yield — the number to compare against a selling price. */
  costPerUnit: number | null;
  /** Revenue per unit of yield. */
  revenuePerUnit: number | null;
  /** Yield per unit of land area — the KPI that makes two differently-sized harvests comparable. */
  yieldPerArea: number | null;
  /** Net profit per unit of land area. */
  netPerArea: number | null;
};

export function computeEconomics(
  harvest: Harvest,
  rows: YieldRow[],
  /** Resolves a row to the unit its good is measured in; null when the good is unknown. */
  unitFor: (row: YieldRow) => string | null,
  /** Land area backing this harvest, when a plot is attached. */
  area: number | null
): HarvestEconomics {
  const totalExpenses =
    (harvest.equipmentCost ?? 0) + (harvest.workersCost ?? 0) + (harvest.fuelCost ?? 0) + (harvest.otherCost ?? 0);
  const revenue = harvest.revenue ?? 0;

  const recorded = rows.filter((row) => row.actual > 0);
  const units = new Set(recorded.map(unitFor).filter((u): u is string => u != null));
  // Unknown goods (unitFor returned null) would silently shrink the total, so treat the harvest
  // as mixed unless every recorded row resolved to the same single unit.
  const resolvedAll = recorded.every((row) => unitFor(row) != null);
  const unit = units.size === 1 && resolvedAll ? [...units][0] : null;

  const totalYield = recorded.reduce((sum, row) => sum + row.actual, 0);
  const canDivide = unit != null && totalYield > 0;

  return {
    totalExpenses,
    revenue,
    net: revenue - totalExpenses,
    totalYield,
    unit,
    costPerUnit: canDivide && totalExpenses > 0 ? totalExpenses / totalYield : null,
    revenuePerUnit: canDivide && revenue > 0 ? revenue / totalYield : null,
    yieldPerArea: canDivide && area != null && area > 0 ? totalYield / area : null,
    netPerArea: area != null && area > 0 && (revenue > 0 || totalExpenses > 0) ? (revenue - totalExpenses) / area : null,
  };
}

/** Local `YYYY-MM-DD` for today, matching how the API serializes dates (no timezone shift). */
export function todayIsoDate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

/**
 * A harvest is overdue when its expected pick date has passed and it still hasn't been
 * harvested. Comparison is lexicographic, which is exact for `YYYY-MM-DD`.
 */
export function isOverdue(harvest: Harvest, today: string = todayIsoDate()): boolean {
  return harvest.status !== 'Harvested' && harvest.expectedHarvestDate != null && harvest.expectedHarvestDate < today;
}

/** Days until the expected pick date; negative when overdue. Null without an expected date. */
export function daysUntilExpected(harvest: Harvest, today: string = todayIsoDate()): number | null {
  if (harvest.expectedHarvestDate == null) return null;
  const ms = new Date(`${harvest.expectedHarvestDate}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/**
 * Whether moving to `next` reverses stock that was already applied. Stock is only ever written
 * when a harvest reaches Harvested (see HarvestRepository), so leaving Harvested undoes it —
 * the one transition that silently rewrites data outside the harvest itself.
 */
export function isDestructiveTransition(current: HarvestStatus, next: HarvestStatus): boolean {
  return current === 'Harvested' && next !== 'Harvested';
}

/** Whether moving to `next` writes the recorded results into stock for the first time. */
export function isApplyingTransition(current: HarvestStatus, next: HarvestStatus): boolean {
  return current !== 'Harvested' && next === 'Harvested';
}
