import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getFarm } from '@/services/farm-service';
import { getHarvestChemicals } from '@/services/harvest-chemical-service';
import { getHarvest, updateHarvest } from '@/services/harvest-service';
import { getHarvestItems } from '@/services/harvest-item-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvestSeeds } from '@/services/harvest-seed-service';
import { getHarvestTrees } from '@/services/harvest-tree-service';
import { getLandPlot } from '@/services/land-plot-service';
import { getSeeds } from '@/services/seed-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { HarvestSeed } from '@/types/harvest-seed';
import type { HarvestTree } from '@/types/harvest-tree';
import type { LandPlot } from '@/types/land-plot';
import type { Seed } from '@/types/seed';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

export function useHarvestDetail(harvestId: number) {
  const { t } = useLanguage();

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [items, setItems] = useState<HarvestItem[]>([]);
  const [results, setResults] = useState<HarvestResult[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [harvestSeeds, setHarvestSeeds] = useState<HarvestSeed[]>([]);
  const [harvestTrees, setHarvestTrees] = useState<HarvestTree[]>([]);
  const [plot, setPlot] = useState<LandPlot | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  /** Summed cost of the chemicals applied, loaded here rather than in the section that lists
   *  them: the money figures include it whether or not that section has been opened. */
  const [chemicalTotal, setChemicalTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!harvestId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list, resultList, stockList, treeStockList, seedUsage, seedList, treeUsage, chemicals] = await Promise.all([
        getHarvest(harvestId),
        getHarvestItems(harvestId),
        getHarvestResults(harvestId),
        // Removed goods included: this harvest's rows still name the stock, orchard and seed they
        // were recorded against, and a row whose good is gone from the list would read as blank.
        getStock(true),
        getTreeStock(true),
        getHarvestSeeds(harvestId),
        getSeeds(true),
        getHarvestTrees(harvestId),
        getHarvestChemicals(harvestId),
      ]);
      setHarvest(item);
      setItems(list);
      setResults(resultList);
      setStocks(stockList);
      setTreeStocks(treeStockList);
      setHarvestSeeds(seedUsage);
      setSeeds(seedList);
      setHarvestTrees(treeUsage);
      setChemicalTotal(chemicals.reduce((sum, chemical) => sum + chemical.cost, 0));

      setFarm(item.farmId != null ? await getFarm(item.farmId) : null);
      setPlot(item.landPlotId != null ? await getLandPlot(item.landPlotId) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function reloadSeeds() {
    getSeeds(true).then(setSeeds).catch(() => {});
  }

  async function changeStatus(status: HarvestStatus) {
    if (!harvest) return;
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateHarvest(harvest.id, { ...harvest, status });
      // Crossing the Harvested line rewrites what this harvest puts into stock, so reload rather
      // than patching the status in — the results and the goods they moved are the server's now.
      await load();
    } catch {
      setStatusError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
    }
  }

  return {
    harvest,
    items,
    results,
    catalogs: { stocks, treeStocks, seeds },
    harvestSeeds,
    harvestTrees,
    plot,
    farm,
    chemicalTotal,
    loading,
    error,
    statusSaving,
    statusError,
    setHarvest,
    setItems,
    setResults,
    setHarvestSeeds,
    setHarvestTrees,
    setError,
    setChemicalTotal,
    reloadSeeds,
    changeStatus,
    load,
  };
}
