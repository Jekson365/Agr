import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { ChemicalHistory } from '@/components/harvest/chemical-history';
import { HarvestExpensesModal } from '@/components/harvest/harvest-expenses-modal';
import { HarvestItemFormModal } from '@/components/harvest/harvest-item-form-modal';
import { HarvestResultFormModal } from '@/components/harvest/harvest-result-form-modal';
import '@/components/harvest/harvest.css';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import { cropLabel } from '@/config/crop';
import {
  buildYieldRows,
  computeEconomics,
  daysUntilExpected,
  isApplyingTransition,
  isDestructiveTransition,
  isOverdue,
  stockMovingRows,
  type YieldRow,
} from '@/config/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { getFarm } from '@/services/farm-service';
import { getHarvest, updateHarvest } from '@/services/harvest-service';
import { HarvestSeedFormModal } from '@/components/harvest/harvest-seed-form-modal';
import { HarvestTreeFormModal } from '@/components/harvest/harvest-tree-form-modal';
import { deleteHarvestTree, getHarvestTrees } from '@/services/harvest-tree-service';
import type { HarvestTree } from '@/types/harvest-tree';
import { SEED_UNIT_LABEL_KEY, seedTitle } from '@/config/seed-kinds';
import { deleteHarvestSeed, getHarvestSeeds } from '@/services/harvest-seed-service';
import { getSeeds } from '@/services/seed-service';
import type { HarvestSeed } from '@/types/harvest-seed';
import type { Seed } from '@/types/seed';
import { deleteHarvestItem, getHarvestItems } from '@/services/harvest-item-service';
import { deleteHarvestResult, getHarvestResults } from '@/services/harvest-result-service';
import { getLandPlot } from '@/services/land-plot-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Farm } from '@/types/farm';
import type { Harvest, HarvestStatus } from '@/types/harvest';
import type { HarvestItem } from '@/types/harvest-item';
import type { HarvestResult } from '@/types/harvest-result';
import type { LandPlot } from '@/types/land-plot';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';

type TargetInfo = { label: string; icon: string; unitLabel: string };

/** Trims derived ratios to 2 decimals without printing trailing zeros (12.5, not 12.50). */
function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

export function HarvestDetailPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [items, setItems] = useState<HarvestItem[]>([]);
  const [results, setResults] = useState<HarvestResult[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [plot, setPlot] = useState<LandPlot | null>(null);
  const [farm, setFarm] = useState<Farm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<HarvestStatus | null>(null);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [chemicalTotal, setChemicalTotal] = useState(0);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HarvestItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: number; label: string } | null>(null);

  // Seed sown for this harvest — the input side, recorded while planning.
  const [harvestSeeds, setHarvestSeeds] = useState<HarvestSeed[]>([]);
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [seedFormOpen, setSeedFormOpen] = useState(false);
  const [editingHarvestSeed, setEditingHarvestSeed] = useState<HarvestSeed | null>(null);
  const [confirmDeleteSeed, setConfirmDeleteSeed] = useState<{ id: number; label: string } | null>(null);

  // Which orchards were picked for this harvest — the fruit-side input.
  const [harvestTrees, setHarvestTrees] = useState<HarvestTree[]>([]);
  const [treeFormOpen, setTreeFormOpen] = useState(false);
  const [editingHarvestTree, setEditingHarvestTree] = useState<HarvestTree | null>(null);
  const [confirmDeleteTree, setConfirmDeleteTree] = useState<{ id: number; label: string } | null>(null);

  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<HarvestResult | null>(null);
  const [confirmDeleteResult, setConfirmDeleteResult] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    if (!harvestId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, list, resultList, stockList, treeStockList, seedUsage, seedList, treeUsage] = await Promise.all([
        getHarvest(harvestId),
        getHarvestItems(harvestId),
        getHarvestResults(harvestId),
        getStock(),
        getTreeStock(),
        getHarvestSeeds(harvestId),
        getSeeds(),
        getHarvestTrees(harvestId),
      ]);
      setHarvest(item);
      setItems(list);
      setResults(resultList);
      setStocks(stockList);
      setTreeStocks(treeStockList);
      setHarvestSeeds(seedUsage);
      setSeeds(seedList);
      setHarvestTrees(treeUsage);

      setFarm(item.farmId != null ? await getFarm(item.farmId) : null);
      setPlot(item.landPlotId != null ? await getLandPlot(item.landPlotId) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function requestStatusChange(status: HarvestStatus) {
    if (!harvest || status === harvest.status || statusSaving) return;
    setPendingStatus(status);
  }

  async function confirmStatusChange() {
    if (!harvest || pendingStatus == null) return;

    const updated: Harvest = { ...harvest, status: pendingStatus };
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateHarvest(harvest.id, updated);
      // Crossing the Harvested line rewrites what this harvest puts into stock, so reload rather
      // than patching the status in — the results and the goods they moved are the server's now.
      await load();
    } catch {
      setStatusError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
      setPendingStatus(null);
    }
  }

  /** The raw unit a good is measured in (e.g. 'Kilogram'), for the mixed-unit check. */
  function rawUnitFor(stockId: number | null, treeStockId: number | null): string | null {
    if (stockId != null) return stocks.find((s) => s.id === stockId)?.unit ?? null;
    if (treeStockId != null) return treeStocks.find((s) => s.id === treeStockId)?.unit ?? null;
    return null;
  }

  /** Label for a unit a plan was written in — it may come from either catalog, so both maps are
   * consulted before falling back to the raw name. Empty for a row saved without one. */
  function unitLabelFor(unit: string | null): string {
    if (!unit) return '';
    const key = STOCK_UNIT_LABEL_KEY[unit] ?? TREE_STOCK_UNIT_LABEL_KEY[unit];
    return key ? t(key) : unit;
  }

  function targetFor(stockId: number | null, treeStockId: number | null): TargetInfo | null {
    if (stockId != null) {
      const stock = stocks.find((s) => s.id === stockId);
      if (!stock) return null;
      return {
        label: stock.name.trim() || stockTypeLabel(stock.type, t),
        icon: stockKindImage(stock.type),
        unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
      };
    }
    if (treeStockId != null) {
      const treeStock = treeStocks.find((s) => s.id === treeStockId);
      if (!treeStock) return null;
      return {
        label: treeStock.name.trim() || fruitTypeLabel(treeStock.type, t),
        icon: fruitKindImage(treeStock.type),
        unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit]),
      };
    }
    return null;
  }

  /** A seed row's label and unit, for display in the "seeds used" list. */
  function seedInfoFor(seedId: number): { label: string; unitLabel: string; icon: string } | null {
    const seed = seeds.find((s) => s.id === seedId);
    if (!seed) return null;
    return {
      label: seedTitle(seed, t),
      unitLabel: t(SEED_UNIT_LABEL_KEY[seed.unit]),
      icon: stockKindImage(seed.type),
    };
  }

  function openAddSeed() {
    setEditingHarvestSeed(null);
    setSeedFormOpen(true);
  }

  function openEditSeed(harvestSeed: HarvestSeed) {
    setEditingHarvestSeed(harvestSeed);
    setSeedFormOpen(true);
  }

  // Seed amounts on hand changed, so reload rather than patching them in by hand.
  function handleSeedSaved(harvestSeed: HarvestSeed, isNew: boolean) {
    setHarvestSeeds((prev) => (isNew ? [...prev, harvestSeed] : prev.map((s) => (s.id === harvestSeed.id ? harvestSeed : s))));
    getSeeds().then(setSeeds).catch(() => {});
  }

  async function confirmDeleteSeedAction() {
    if (!confirmDeleteSeed) return;
    const { id } = confirmDeleteSeed;
    try {
      await deleteHarvestSeed(id);
      setHarvestSeeds((prev) => prev.filter((s) => s.id !== id));
      getSeeds().then(setSeeds).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteSeed(null);
    }
  }

  /** An orchard row's label, unit and icon for the "trees picked" list. */
  function treeInfoFor(treeStockId: number): { label: string; unitLabel: string; icon: string } | null {
    const treeStock = treeStocks.find((s) => s.id === treeStockId);
    if (!treeStock) return null;
    const fruit = fruitTypeLabel(treeStock.type, t);
    return {
      label: treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit,
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit] ?? 'farm.unitPlant'),
      icon: fruitKindImage(treeStock.type),
    };
  }

  function openAddTree() {
    setEditingHarvestTree(null);
    setTreeFormOpen(true);
  }

  function openEditTree(harvestTree: HarvestTree) {
    setEditingHarvestTree(harvestTree);
    setTreeFormOpen(true);
  }

  function handleTreeSaved(harvestTree: HarvestTree, isNew: boolean) {
    setHarvestTrees((prev) =>
      isNew ? [...prev, harvestTree] : prev.map((h) => (h.id === harvestTree.id ? harvestTree : h))
    );
  }

  async function confirmDeleteTreeAction() {
    if (!confirmDeleteTree) return;
    const { id } = confirmDeleteTree;
    try {
      await deleteHarvestTree(id);
      setHarvestTrees((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteTree(null);
    }
  }

  function openAddItem() {
    setEditingItem(null);
    setItemFormOpen(true);
  }

  function openEditItem(item: HarvestItem) {
    setEditingItem(item);
    setItemFormOpen(true);
  }

  function handleItemSaved(item: HarvestItem, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  async function confirmDeleteItemAction() {
    if (!confirmDeleteItem) return;
    const { id } = confirmDeleteItem;
    try {
      await deleteHarvestItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteItem(null);
    }
  }

  function openAddResult() {
    setEditingResult(null);
    setResultFormOpen(true);
  }

  function openEditResult(result: HarvestResult) {
    setEditingResult(result);
    setResultFormOpen(true);
  }

  function handleResultSaved(result: HarvestResult, isNew: boolean) {
    setResults((prev) => (isNew ? [...prev, result] : prev.map((r) => (r.id === result.id ? result : r))));
  }

  async function confirmDeleteResultAction() {
    if (!confirmDeleteResult) return;
    const { id } = confirmDeleteResult;
    try {
      await deleteHarvestResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteResult(null);
    }
  }

  // Planned (HarvestItem) against actual (HarvestResult), paired by good.
  const yieldRows = useMemo(() => buildYieldRows(items, results), [items, results]);
  const hasComparison = yieldRows.some((row) => row.actual > 0);
  const isFruit = harvest?.kind === 'Fruit';
  // Planning is for setting the harvest up; what it's expected to yield is decided once the crop
  // is actually in the ground, so the planned items belong to Planting. Existing rows stay visible
  // in every status — a harvest moved back to Planning shouldn't appear to have lost its plan.
  const canPlan = harvest?.status === 'Planting';

  /** The crop kinds actually sown for this harvest — the only things a plan can cover. Seed and
   * plant stock share the StockKind catalog, so a seed's type matches its produce's type. */
  const sownTypes = useMemo(() => {
    const seedById = new Map(seeds.map((s) => [s.id, s]));
    return [
      ...new Set(
        harvestSeeds.map((used) => seedById.get(used.seedId)?.type).filter((type): type is string => !!type)
      ),
    ];
  }, [harvestSeeds, seeds]);

  const economics = useMemo(
    () =>
      harvest
        ? computeEconomics(harvest, yieldRows, (row) => rawUnitFor(row.stockId, row.treeStockId), plot?.area ?? null, chemicalTotal)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [harvest, yieldRows, stocks, treeStocks, plot, chemicalTotal]
  );

  const totalExpenses = economics?.totalExpenses ?? 0;
  const revenue = economics?.revenue ?? 0;
  const netTotal = economics?.net ?? 0;

  // The unit label to show next to the aggregate figures, once the harvest resolves to one unit.
  const economicsUnitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row ? (targetFor(row.stockId, row.treeStockId)?.unitLabel ?? '') : '';
  })();

  const overdue = harvest ? isOverdue(harvest) : false;
  const daysLeft = harvest ? daysUntilExpected(harvest) : null;

  // A status change that writes or reverses stock says so with real numbers, rather than the
  // generic "this will update the status" — reversing is the one move that silently rewrites
  // data outside this harvest.
  // One entry per good that the change is actually about to write into — or take back out of —
  // stock: its recorded result where there is one, its plan where there isn't. Counting the
  // results alone would have promised nothing for a harvest whose yield is still only planned.
  const movingCount = stockMovingRows(yieldRows, (row) => rawUnitFor(row.stockId, row.treeStockId)).length;
  const statusChangeBody = (() => {
    if (!harvest || pendingStatus == null) return t('harvest.statusConfirmBody');

    if (isApplyingTransition(harvest.status, pendingStatus)) {
      return movingCount === 0
        ? t('harvest.statusConfirmBodyToHarvestedEmpty')
        : t('harvest.statusConfirmBodyToHarvestedCount', { count: movingCount });
    }
    if (isDestructiveTransition(harvest.status, pendingStatus)) {
      return movingCount === 0
        ? t('harvest.statusConfirmBodyFromHarvested')
        : t('harvest.statusConfirmBodyFromHarvestedCount', { count: movingCount });
    }
    return t('harvest.statusConfirmBody');
  })();

  const statusChangeDestructive = harvest != null && pendingStatus != null && isDestructiveTransition(harvest.status, pendingStatus);

  function variancePctLabel(row: YieldRow): string {
    if (row.varianceRatio == null) return '—';
    const pct = Math.round(row.varianceRatio * 100);
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }

  return (
    <div>
      <Link to="/harvest" className="back-link">
        ← {t('harvest.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{harvest?.title ?? t('harvest.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('harvestItem.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          {harvest && (
            <div className="harvest-top-grid">
              <div className="harvest-top-cell">
                <div className="harvest-info-block">
              <p className="limit-hint">
                {t('harvest.date')}: {formatLocalizedIsoDate(harvest.date, language)}
              </p>
              {harvest.expectedHarvestDate && (
                <p className="limit-hint">
                  {t('harvest.expectedDate')}: {formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}
                  {overdue ? (
                    <span className="harvest-overdue-badge">{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</span>
                  ) : harvest.status !== 'Harvested' && daysLeft != null ? (
                    <span className="harvest-due-hint">{t('harvest.dueIn', { days: daysLeft })}</span>
                  ) : null}
                </p>
              )}
              {farm && (
                <p className="limit-hint">
                  {t('harvest.landLabel')}: {farm.name}
                  {plot ? ` · ${cropLabel(plot.crop, t)} (${plot.area} ${t('farm.areaUnit')})` : ''}
                </p>
              )}

              {economics && (revenue > 0 || totalExpenses > 0 || economics.totalYield > 0) && (
                <div className="harvest-kpi-grid">
                  {economics.totalYield > 0 && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.kpiTotalYield')}</span>
                      <span className="harvest-kpi-value">
                        {economics.unit
                          ? `${round2(economics.totalYield)} ${economicsUnitLabel}`
                          : t('harvest.kpiMixedUnits')}
                      </span>
                    </div>
                  )}
                  {economics.yieldPerArea != null && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.kpiYieldPerArea')}</span>
                      <span className="harvest-kpi-value">
                        {round2(economics.yieldPerArea)} {economicsUnitLabel}/{t('farm.areaUnit')}
                      </span>
                    </div>
                  )}
                  {revenue > 0 && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.revenueLabel')}</span>
                      <span className="harvest-kpi-value">{formatPrice(revenue)}</span>
                    </div>
                  )}
                  {totalExpenses > 0 && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.expensesTotal')}</span>
                      <span className="harvest-kpi-value">{formatPrice(totalExpenses)}</span>
                    </div>
                  )}
                  {(revenue > 0 || totalExpenses > 0) && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.netTotal')}</span>
                      <span className={netTotal < 0 ? 'harvest-kpi-value negative' : 'harvest-kpi-value positive'}>
                        {formatPrice(netTotal)}
                      </span>
                    </div>
                  )}
                  {economics.costPerUnit != null && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.kpiCostPerUnit', { unit: economicsUnitLabel })}</span>
                      <span className="harvest-kpi-value">{formatPrice(economics.costPerUnit)}</span>
                    </div>
                  )}
                  {economics.revenuePerUnit != null && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.kpiRevenuePerUnit', { unit: economicsUnitLabel })}</span>
                      <span className="harvest-kpi-value">{formatPrice(economics.revenuePerUnit)}</span>
                    </div>
                  )}
                  {economics.netPerArea != null && (
                    <div className="harvest-kpi">
                      <span className="harvest-kpi-label">{t('harvest.kpiNetPerArea', { unit: t('farm.areaUnit') })}</span>
                      <span className={economics.netPerArea < 0 ? 'harvest-kpi-value negative' : 'harvest-kpi-value positive'}>
                        {formatPrice(economics.netPerArea)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {economics && economics.unit == null && economics.totalYield > 0 && (
                <p className="limit-hint">{t('harvest.kpiMixedUnitsHint')}</p>
              )}

              <div className="field">
                <label>{t('harvest.statusLabel')}</label>
                <div className="kind-row">
                  {HARVEST_STATUSES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      disabled={statusSaving}
                      className={harvest.status === option ? 'kind-chip active' : 'kind-chip'}
                      onClick={() => requestStatusChange(option)}
                    >
                      <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
                    </button>
                  ))}
                  {harvest.status === 'Harvested' && (
                    <button
                      type="button"
                      className="harvest-expenses-button"
                      onClick={() => setExpensesOpen(true)}
                      aria-label={t('harvest.expensesTitle')}
                    >
                      $
                    </button>
                  )}
                </div>
                {statusError && <div className="error-banner">{statusError}</div>}
              </div>
                </div>
              </div>
              <div className="harvest-top-cell">
                <ChemicalHistory harvestId={harvestId} onTotalChange={setChemicalTotal} />
              </div>
            </div>
          )}

          {hasComparison && (
            <>
              <div className="field harvest-section-label">
                <label>{t('harvest.comparisonTitle')}</label>
              </div>
              <div className="harvest-comparison">
                <div className="harvest-comparison-row header">
                  <span className="harvest-comparison-good">{t('harvest.comparisonGood')}</span>
                  <span className="harvest-comparison-num">{t('harvest.comparisonPlanned')}</span>
                  <span className="harvest-comparison-num">{t('harvest.comparisonActual')}</span>
                  <span className="harvest-comparison-num">{t('harvest.comparisonVariance')}</span>
                </div>
                {yieldRows.map((row) => {
                  const target = targetFor(row.stockId, row.treeStockId);
                  // Results are always recorded in the good's own unit, but a plan carries its
                  // own. Subtracting across two different units would be nonsense, so a variance
                  // is only shown when both sides are in the same one.
                  const comparable =
                    row.plannedUnit == null || row.plannedUnit === rawUnitFor(row.stockId, row.treeStockId);
                  const varianceClass =
                    !comparable
                      ? 'harvest-comparison-num'
                      : row.variance > 0
                        ? 'harvest-comparison-num variance-up'
                        : row.variance < 0
                          ? 'harvest-comparison-num variance-down'
                          : 'harvest-comparison-num';

                  return (
                    <div key={row.key} className="harvest-comparison-row">
                      <span className="harvest-comparison-good">
                        {target && <img src={target.icon} alt="" />}
                        <span>{target?.label ?? ''}</span>
                        {row.unplanned && <span className="harvest-comparison-tag">{t('harvest.comparisonUnplanned')}</span>}
                        {row.missing && <span className="harvest-comparison-tag missing">{t('harvest.comparisonMissing')}</span>}
                      </span>
                      <span className="harvest-comparison-num">
                        {row.planned > 0
                          ? `${round2(row.planned)} ${unitLabelFor(row.plannedUnit) || (target?.unitLabel ?? '')}`
                          : '—'}
                      </span>
                      <span className="harvest-comparison-num">
                        {row.actual > 0 ? `${round2(row.actual)} ${target?.unitLabel ?? ''}` : '—'}
                      </span>
                      <span className={varianceClass}>
                        {row.planned === 0 && row.actual === 0
                          ? '—'
                          : !comparable
                            ? t('harvest.kpiMixedUnits')
                            : `${row.variance > 0 ? '+' : ''}${round2(row.variance)} (${variancePctLabel(row)})`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Which orchards were picked — fruit harvests only. Editable in any status: unlike
              sowing, picking happens at harvest time, so it's usually recorded once done. */}
          {isFruit && (
            <>
          <div className="field harvest-section-label">
            <label>{t('harvestTree.title')}</label>
          </div>

          {harvestTrees.length === 0 ? (
            <p className="empty-state">{t('harvestTree.empty')}</p>
          ) : (
            <div className="list-card-grid">
              {harvestTrees.map((harvestTree) => {
                const info = treeInfoFor(harvestTree.treeStockId);
                return (
                  <div key={harvestTree.id} className="list-card">
                    <div className="list-card-body">
                      <span className="list-card-icon-wrap">{info && <img src={info.icon} alt="" />}</span>
                      <span className="list-card-info">
                        <span className="list-card-title">{info?.label ?? ''}</span>
                        <br />
                        <span className="list-card-subtitle">
                          {harvestTree.amount} {info?.unitLabel ?? ''}
                        </span>
                      </span>
                    </div>
                    <CardMenu
                      onEdit={() => openEditTree(harvestTree)}
                      onDelete={() => setConfirmDeleteTree({ id: harvestTree.id, label: info?.label ?? '' })}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <button type="button" className="add-button" onClick={openAddTree}>
            + {t('harvestTree.add')}
          </button>
            </>
          )}

          {/* What went into the ground — crop harvests only; the fruit equivalent is the
              trees picked above. */}
          {!isFruit && (
            <>
          <div className="field harvest-section-label">
            <label>{t('harvestSeed.title')}</label>
          </div>

          {harvestSeeds.length === 0 ? (
            <p className="empty-state">{t('harvestSeed.empty')}</p>
          ) : (
            <div className="list-card-grid harvest-compact-icons">
              {harvestSeeds.map((harvestSeed) => {
                const info = seedInfoFor(harvestSeed.seedId);
                const canEdit = harvest?.status !== 'Harvested';
                return (
                  <div key={harvestSeed.id} className="list-card">
                    <div className="list-card-body">
                      <span className="list-card-icon-wrap">{info && <img src={info.icon} alt="" />}</span>
                      <span className="list-card-info">
                        <span className="list-card-title">{info?.label ?? ''}</span>
                        <br />
                        <span className="list-card-subtitle">
                          {harvestSeed.amount} {info?.unitLabel ?? ''}
                        </span>
                      </span>
                    </div>
                    {canEdit && (
                      <CardMenu
                        onEdit={() => openEditSeed(harvestSeed)}
                        onDelete={() => setConfirmDeleteSeed({ id: harvestSeed.id, label: info?.label ?? '' })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {harvest?.status !== 'Harvested' && (
            <button type="button" className="add-button" onClick={openAddSeed}>
              + {t('harvestSeed.add')}
            </button>
          )}
            </>
          )}

          <div className="field harvest-section-label">
            <label>{t('harvest.plannedTitle')}</label>
          </div>

          {/* The plan is what this harvest is taken to have yielded until a result says otherwise,
              so it is what moves stock — worth saying where the amounts are entered. */}
          {items.length > 0 && <p className="limit-hint">{t('harvestItem.movesStock')}</p>}

          {items.length === 0 ? (
            <p className="empty-state">
              {harvest?.status === 'Planning' ? t('harvestItem.plantingOnly') : t('harvestItem.empty')}
            </p>
          ) : (
            <div className="list-card-grid harvest-compact-icons">
              {items.map((item) => {
                const target = targetFor(item.stockId, item.treeStockId);
                const canEdit = canPlan;
                return (
                  <div key={item.id} className="list-card">
                    <div className="list-card-body">
                      <span className="list-card-icon-wrap">{target && <img src={target.icon} alt="" />}</span>
                      <span className="list-card-info">
                        <span className="list-card-title">{target?.label ?? ''}</span>
                        <br />
                        <span className="list-card-subtitle">
                          {item.amount} {unitLabelFor(item.unit) || (target?.unitLabel ?? '')}
                        </span>
                      </span>
                    </div>
                    {canEdit && (
                      <CardMenu
                        onEdit={() => openEditItem(item)}
                        onDelete={() => setConfirmDeleteItem({ id: item.id, label: target?.label ?? '' })}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {canPlan && (
            <button type="button" className="add-button" onClick={openAddItem}>
              + {t('harvestItem.add')}
            </button>
          )}

          {/* Final results belong to a finished harvest — the whole section stays out of the
              way while it's still being planned or grown. */}
          {harvest?.status === 'Harvested' && (
            <>
              <div className="field harvest-section-label">
                <label>{t('harvestResult.title')}</label>
              </div>

              {results.length === 0 ? (
                <p className="empty-state">{t('harvestResult.empty')}</p>
              ) : (
                <div className="list-card-grid harvest-compact-icons">
                  {results.map((result) => {
                    const target = targetFor(result.stockId, result.treeStockId);
                    return (
                      <div key={result.id} className="list-card">
                        <div className="list-card-body">
                          <span className="list-card-icon-wrap">{target && <img src={target.icon} alt="" />}</span>
                          <span className="list-card-info">
                            <span className="list-card-title">{target?.label ?? ''}</span>
                            <br />
                            <span className="list-card-subtitle">
                              {result.amount} {target?.unitLabel ?? ''}
                            </span>
                          </span>
                        </div>
                        <CardMenu
                          onEdit={() => openEditResult(result)}
                          onDelete={() => setConfirmDeleteResult({ id: result.id, label: target?.label ?? '' })}
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <button type="button" className="add-button" onClick={openAddResult}>
                + {t('harvestResult.add')}
              </button>
            </>
          )}
        </>
      )}

      <HarvestTreeFormModal
        open={treeFormOpen}
        harvestId={harvestId}
        editingTree={editingHarvestTree}
        existingTrees={harvestTrees}
        onClose={() => setTreeFormOpen(false)}
        onSaved={handleTreeSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteTree}
        name={confirmDeleteTree?.label ?? ''}
        onCancel={() => setConfirmDeleteTree(null)}
        onConfirm={confirmDeleteTreeAction}
      />

      <HarvestSeedFormModal
        open={seedFormOpen}
        harvestId={harvestId}
        editingSeed={editingHarvestSeed}
        onClose={() => setSeedFormOpen(false)}
        onSaved={handleSeedSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteSeed}
        name={confirmDeleteSeed?.label ?? ''}
        body={t('harvestSeed.deleteBody')}
        onCancel={() => setConfirmDeleteSeed(null)}
        onConfirm={confirmDeleteSeedAction}
      />

      <HarvestItemFormModal
        open={itemFormOpen}
        harvestId={harvestId}
        editingItem={editingItem}
        sownTypes={sownTypes}
        onClose={() => setItemFormOpen(false)}
        onSaved={handleItemSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteItem}
        name={confirmDeleteItem?.label ?? ''}
        onCancel={() => setConfirmDeleteItem(null)}
        onConfirm={confirmDeleteItemAction}
      />

      <HarvestResultFormModal
        open={resultFormOpen}
        harvestId={harvestId}
        editingResult={editingResult}
        plannedItems={items}
        onClose={() => setResultFormOpen(false)}
        onSaved={handleResultSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteResult}
        name={confirmDeleteResult?.label ?? ''}
        onCancel={() => setConfirmDeleteResult(null)}
        onConfirm={confirmDeleteResultAction}
      />

      <ConfirmModal
        open={pendingStatus != null}
        title={t('harvest.statusConfirmTitle', { status: pendingStatus ? t(HARVEST_STATUS_LABEL_KEY[pendingStatus]) : '' })}
        body={statusChangeBody}
        destructive={statusChangeDestructive}
        onCancel={() => setPendingStatus(null)}
        onConfirm={confirmStatusChange}
      />

      {harvest && (
        <HarvestExpensesModal harvest={harvest} open={expensesOpen} onClose={() => setExpensesOpen(false)} onSaved={setHarvest} />
      )}
    </div>
  );
}
