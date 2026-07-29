import type { HarvestStatus } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';

/** Just the fields buildYieldRows reads off a planned item — a GreenhouseHarvestItem (which has
 * no treeStockId) can be adapted to this shape without needing the rest of a `HarvestItem`. */
type PlannedRow = Pick<HarvestItem, 'stockId' | 'treeStockId' | 'amount' | 'unit'>;

/** Just the fields buildYieldRows reads off a recorded result. */
type ActualRow = Pick<HarvestResult, 'stockId' | 'treeStockId' | 'amount'>;

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
  /**
   * The unit every planned item for this good was written in, or null when nothing was planned
   * or the plans disagree. When null the `planned` sum spans units and means nothing on its own,
   * so callers must not show it as a single figure — the same rule HarvestEconomics.unit follows.
   */
  plannedUnit: string | null;
  /** Sum of the HarvestResult amounts for this good — what was actually recorded. */
  actual: number;
  /** actual - planned. Negative means a shortfall. Only meaningful when `plannedComparable`. */
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
export function buildYieldRows(items: PlannedRow[], results: ActualRow[]): YieldRow[] {
  const rows = new Map<TargetKey, YieldRow>();
  // Every unit each good was planned in, so a good planned twice in different units can be
  // reported as such instead of having its amounts silently added together.
  const plannedUnits = new Map<TargetKey, Set<string>>();

  const rowFor = (stockId: number | null, treeStockId: number | null): YieldRow => {
    const key = targetKey(stockId, treeStockId);
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        stockId,
        treeStockId,
        planned: 0,
        plannedUnit: null,
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
    const row = rowFor(item.stockId, item.treeStockId);
    row.planned += item.amount;
    if (item.unit) {
      const units = plannedUnits.get(row.key) ?? new Set<string>();
      units.add(item.unit);
      plannedUnits.set(row.key, units);
    }
  }
  for (const result of results) {
    rowFor(result.stockId, result.treeStockId).actual += result.amount;
  }

  for (const row of rows.values()) {
    const units = plannedUnits.get(row.key);
    row.plannedUnit = units?.size === 1 ? [...units][0] : null;
    row.variance = row.actual - row.planned;
    row.varianceRatio = row.planned > 0 ? row.variance / row.planned : null;
    row.unplanned = row.planned === 0 && row.actual > 0;
    row.missing = row.planned > 0 && row.actual === 0;
  }

  return [...rows.values()];
}

/**
 * The goods a harvest puts into stock while it is Harvested — what the status change is actually
 * about to write or reverse. Mirrors HarvestStockSync on the server: each good counts once, as its
 * recorded result where there is one and as its plan where there isn't, and a plan written in a
 * different unit than the good is stocked in isn't a number that can be added to its balance.
 */
export function stockMovingRows(rows: YieldRow[], unitFor: (row: YieldRow) => string | null): YieldRow[] {
  return rows.filter(
    (row) => row.actual > 0 || (row.planned > 0 && (row.plannedUnit == null || row.plannedUnit === unitFor(row)))
  );
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

/** Just the fields computeEconomics reads, so a greenhouse harvest — which has these but none of
 * the rest of a `Harvest` — can be measured the same way. */
type Costed = {
  equipmentCost: number | null;
  workersCost: number | null;
  fuelCost: number | null;
  otherCost: number | null;
  revenue: number | null;
};

export function computeEconomics(
  harvest: Costed,
  rows: YieldRow[],
  /** Resolves a row to the unit its good is measured in; null when the good is unknown. */
  unitFor: (row: YieldRow) => string | null,
  /** Land area backing this harvest, when a plot is attached. */
  area: number | null,
  /** Extra expenses recorded separately from the fixed fields (e.g. chemicals applied). */
  extraExpenses = 0
): HarvestEconomics {
  const totalExpenses =
    (harvest.equipmentCost ?? 0) + (harvest.workersCost ?? 0) + (harvest.fuelCost ?? 0) + (harvest.otherCost ?? 0) + extraExpenses;
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

/** Just the fields the two schedule helpers below read, so a greenhouse harvest — which has these
 * but none of the rest of a `Harvest` — can be measured the same way. */
type Scheduled = { status: HarvestStatus; expectedHarvestDate: string | null };

/**
 * A harvest is overdue when its expected pick date has passed and it still hasn't been
 * harvested. Comparison is lexicographic, which is exact for `YYYY-MM-DD`.
 */
export function isOverdue(harvest: Scheduled, today: string = todayIsoDate()): boolean {
  return harvest.status !== 'Harvested' && harvest.expectedHarvestDate != null && harvest.expectedHarvestDate < today;
}

/** Days until the expected pick date; negative when overdue. Null without an expected date. */
export function daysUntilExpected(harvest: Pick<Scheduled, 'expectedHarvestDate'>, today: string = todayIsoDate()): number | null {
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
