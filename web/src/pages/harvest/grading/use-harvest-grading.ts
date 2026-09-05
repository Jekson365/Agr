import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getAssessmentCriteria } from '@/services/assessment-criteria-service';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { getHarvest } from '@/services/harvest-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvestTrees } from '@/services/harvest-tree-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Harvest } from '@/types/harvest';
import type { AssessmentCriteria } from '@/types/assessment-criteria';
import type { HarvestAssessment } from '@/types/harvest-assessment';
import type { HarvestResult } from '@/types/harvest-result';
import { targetFor, type Catalogs } from '@/pages/harvest/detail/harvest-detail-lookups';

/** A good this harvest brought in: what the tabs name, and what one sheet is written against. */
export type GradedGood = {
  key: string;
  stockId: number | null;
  treeStockId: number | null;
  label: string;
  icon: string;
  unitLabel: string;
  /** How much of it the harvest recorded, to read the graded quantities against. */
  harvested: number;
};

export function useHarvestGrading(harvestId: number) {
  const { t } = useLanguage();

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [results, setResults] = useState<HarvestResult[]>([]);
  const [catalogs, setCatalogs] = useState<Catalogs>({ stocks: [], treeStocks: [], seeds: [], treeProducts: [] });
  const [assessments, setAssessments] = useState<HarvestAssessment[]>([]);
  const [criteria, setCriteria] = useState<AssessmentCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!harvestId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, resultList, stockList, treeStockList, assessmentList, treeList] = await Promise.all([
        getHarvest(harvestId),
        getHarvestResults(harvestId),
        // Removed goods included: a harvest still names what it recorded, and a row whose good is
        // gone from the list would read as a blank tab.
        getStock(true),
        getTreeStock(true),
        getHarvestAssessments({ harvestId }),
        getHarvestTrees(harvestId).catch(() => []),
      ]);

      // What an orchard picked is recorded on its trees rather than as a result, so the goods a
      // fruit harvest grades are read from there. Each row keeps its tree's id, which is only
      // ever an identity within this sheet — grading writes assessments, never results.
      const rows: HarvestResult[] =
        item.kind === 'Fruit'
          ? treeList
              .filter((tree) => tree.harvestedAmount > 0)
              .map((tree) => ({
                id: tree.id,
                harvestId: tree.harvestId,
                stockId: null,
                treeStockId: tree.treeStockId,
                amount: tree.harvestedAmount,
              }))
          : resultList;

      setHarvest(item);
      setResults(rows);
      setCatalogs({ stocks: stockList, treeStocks: treeStockList, seeds: [], treeProducts: [] });
      setAssessments(assessmentList);

      // Each good's standard is read after its results, since the results are what name the goods.
      const goodIds = rows.map((result) =>
        result.stockId != null ? { stockId: result.stockId } : { treeStockId: result.treeStockId ?? 0 }
      );
      const unique = goodIds.filter(
        (good, index) =>
          goodIds.findIndex(
            (other) => other.stockId === good.stockId && other.treeStockId === good.treeStockId
          ) === index
      );
      const standards = await Promise.all(
        unique.map((good) => getAssessmentCriteria(good).catch(() => []))
      );
      setCriteria(standards.flat());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /** One entry per good the harvest recorded, with its results summed — several result rows can
   *  name the same good, and the sheet grades the good rather than the row. */
  const goods: GradedGood[] = [];
  for (const result of results) {
    const key = result.stockId != null ? `stock:${result.stockId}` : `tree:${result.treeStockId}`;
    const found = goods.find((good) => good.key === key);
    if (found) {
      found.harvested += result.amount;
      continue;
    }
    const target = targetFor(catalogs, result.stockId, result.treeStockId, t);
    goods.push({
      key,
      stockId: result.stockId,
      treeStockId: result.treeStockId,
      label: target?.label ?? '',
      icon: target?.icon ?? '',
      unitLabel: target?.unitLabel ?? '',
      harvested: result.amount,
    });
  }

  function criteriaFor(good: GradedGood) {
    return criteria.filter(
      (row) => row.stockId === good.stockId && row.treeStockId === good.treeStockId
    );
  }

  function linesFor(good: GradedGood) {
    return assessments.filter(
      (row) => row.stockId === good.stockId && row.treeStockId === good.treeStockId
    );
  }

  function applySaved(good: GradedGood, saved: HarvestAssessment[]) {
    setAssessments((prev) => [
      ...prev.filter((row) => !(row.stockId === good.stockId && row.treeStockId === good.treeStockId)),
      ...saved,
    ]);
  }

  return { harvest, goods, loading, error, load, linesFor, criteriaFor, applySaved };
}
