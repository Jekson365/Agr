import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { HarvestTree } from '@/types/harvest-tree';
import { targetFor, type Catalogs, type TargetInfo } from '../detail/harvest-detail-lookups';

export type HarvestGoodSources = {
  items: HarvestItem[];
  results: HarvestResult[];
  trees: HarvestTree[];
};

type Translate = (key: string) => string;

function add(map: Map<number, Set<string>>, harvestId: number, stockId: number | null, treeStockId: number | null) {
  if (stockId == null && treeStockId == null) return;
  const keys = map.get(harvestId) ?? new Set<string>();
  keys.add(`${stockId ?? ''}:${treeStockId ?? ''}`);
  map.set(harvestId, keys);
}

export function buildHarvestGoods(
  { items, results, trees }: HarvestGoodSources,
  catalogs: Catalogs,
  t: Translate
): Map<number, TargetInfo[]> {
  const picked = new Map<number, Set<string>>();
  const planned = new Map<number, Set<string>>();

  for (const row of results) add(picked, row.harvestId, row.stockId, row.treeStockId);
  for (const row of trees) add(picked, row.harvestId, null, row.treeStockId);
  for (const row of items) add(planned, row.harvestId, row.stockId, row.treeStockId);

  const goods = new Map<number, TargetInfo[]>();
  for (const harvestId of new Set([...picked.keys(), ...planned.keys()])) {
    const keys = picked.get(harvestId) ?? planned.get(harvestId);
    if (!keys) continue;
    const infos = [...keys]
      .map((key) => {
        const [stock, treeStock] = key.split(':');
        return targetFor(catalogs, stock ? Number(stock) : null, treeStock ? Number(treeStock) : null, t);
      })
      .filter((info): info is TargetInfo => info != null);
    if (infos.length > 0) goods.set(harvestId, infos);
  }
  return goods;
}

export function replaceHarvestSources(
  previous: HarvestGoodSources,
  harvestId: number,
  next: HarvestGoodSources
): HarvestGoodSources {
  return {
    items: [...previous.items.filter((row) => row.harvestId !== harvestId), ...next.items],
    results: [...previous.results.filter((row) => row.harvestId !== harvestId), ...next.results],
    trees: [...previous.trees.filter((row) => row.harvestId !== harvestId), ...next.trees],
  };
}
