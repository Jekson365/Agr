import { fruitTypeLabel } from '@/config/fruit-kinds';
import { stockTypeLabel } from '@/config/stock-kinds';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { HarvestTree } from '@/types/harvest-tree';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';
import type { TimelineHarvest } from './harvest-timeline-spans';

export type TargetRows = {
  items: HarvestItem[];
  results: HarvestResult[];
  trees: HarvestTree[];
  stocks: Stock[];
  treeStocks: TreeStock[];
};

export type TargetGroup = 'stock' | 'tree';

export type TargetOption = { value: string; label: string; group: TargetGroup };

export function emptyTargetRows(): TargetRows {
  return { items: [], results: [], trees: [], stocks: [], treeStocks: [] };
}

function targetOf(stockId: number | null, treeStockId: number | null): string | null {
  if (stockId != null) return `stock:${stockId}`;
  if (treeStockId != null) return `tree:${treeStockId}`;
  return null;
}

export function buildTargets(rows: TargetRows, harvests: TimelineHarvest[]): Map<string, Set<string>> {
  const keyById = new Map<number, string>();
  for (const harvest of harvests) {
    if (harvest.source === 'greenhouse') continue;
    keyById.set(Number(harvest.key.split('-')[1]), harvest.key);
  }

  const targets = new Map<string, Set<string>>();

  function add(harvestId: number, target: string | null) {
    const key = keyById.get(harvestId);
    if (key == null || target == null) return;
    const set = targets.get(key) ?? new Set<string>();
    set.add(target);
    targets.set(key, set);
  }

  for (const row of rows.items) add(row.harvestId, targetOf(row.stockId, row.treeStockId));
  for (const row of rows.results) add(row.harvestId, targetOf(row.stockId, row.treeStockId));
  for (const row of rows.trees) add(row.harvestId, `tree:${row.treeStockId}`);

  return targets;
}

export function buildTargetOptions(
  rows: TargetRows,
  targets: Map<string, Set<string>>,
  t: (key: string) => string
): TargetOption[] {
  const used = new Set<string>();
  for (const set of targets.values()) {
    for (const value of set) used.add(value);
  }

  const options: TargetOption[] = [];

  for (const stock of rows.stocks) {
    const value = `stock:${stock.id}`;
    if (!used.has(value)) continue;
    options.push({ value, label: stock.name.trim() || stockTypeLabel(stock.type, t), group: 'stock' });
  }

  for (const stock of rows.treeStocks) {
    const value = `tree:${stock.id}`;
    if (!used.has(value)) continue;
    options.push({ value, label: stock.name.trim() || fruitTypeLabel(stock.type, t), group: 'tree' });
  }

  return options.sort((a, b) => a.label.localeCompare(b.label));
}
