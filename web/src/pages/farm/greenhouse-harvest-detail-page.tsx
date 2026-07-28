import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseChemicalHistory } from '@/components/farm/greenhouse/greenhouse-chemical-history';
import { GreenhouseHarvestExpensesModal } from '@/components/farm/greenhouse/greenhouse-harvest-expenses-modal';
import { GreenhouseHarvestItemFormModal } from '@/components/farm/greenhouse/greenhouse-harvest-item-form-modal';
import { GreenhouseHarvestResultFormModal } from '@/components/farm/greenhouse/greenhouse-harvest-result-form-modal';
import { GreenhouseHarvestSeedFormModal } from '@/components/farm/greenhouse/greenhouse-harvest-seed-form-modal';
import '@/components/harvest/harvest.css';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  buildYieldRows,
  computeEconomics,
  daysUntilExpected,
  isApplyingTransition,
  isDestructiveTransition,
  isOverdue,
  type YieldRow,
} from '@/config/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { getGreenhouse } from '@/services/greenhouse-service';
import { getGreenhouseHarvest, updateGreenhouseHarvest } from '@/services/greenhouse-harvest-service';
import {
  deleteGreenhouseHarvestSeed,
  getGreenhouseHarvestSeeds,
} from '@/services/greenhouse-harvest-seed-service';
import { getGreenhouseSeeds } from '@/services/greenhouse-stock-service';
import {
  deleteGreenhouseHarvestItem,
  getGreenhouseHarvestItems,
} from '@/services/greenhouse-harvest-item-service';
import {
  deleteGreenhouseHarvestResult,
  getGreenhouseHarvestResults,
} from '@/services/greenhouse-harvest-result-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { GreenhouseHarvestItem } from '@/types/greenhouse-harvest-item';
import type { GreenhouseHarvestResult } from '@/types/greenhouse-harvest-result';
import type { GreenhouseHarvestSeed } from '@/types/greenhouse-harvest-seed';
import type { GreenhouseSeed, GreenhouseStock } from '@/types/greenhouse-stock';
import type { HarvestStatus } from '@/types/harvest';

type TargetInfo = { label: string; icon: string; unitLabel: string };

/** Trims derived ratios to 2 decimals without printing trailing zeros (12.5, not 12.50). */
function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/**
 * The greenhouse counterpart to HarvestDetailPage — the same planning → planting → harvested
 * workflow, minus the branches that don't apply here: no orchard/tree side (a greenhouse has no
 * picking-without-consuming equivalent), and no farm/plot (the harvest belongs to a greenhouse
 * instead).
 */
export function GreenhouseHarvestDetailPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const [harvest, setHarvest] = useState<GreenhouseHarvest | null>(null);
  const [greenhouse, setGreenhouse] = useState<Greenhouse | null>(null);
  const [items, setItems] = useState<GreenhouseHarvestItem[]>([]);
  const [results, setResults] = useState<GreenhouseHarvestResult[]>([]);
  const [stocks, setStocks] = useState<GreenhouseStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<HarvestStatus | null>(null);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [chemicalTotal, setChemicalTotal] = useState(0);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GreenhouseHarvestItem | null>(null);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState<{ id: number; label: string } | null>(null);

  // Seed sown for this harvest — the input side, recorded while planning.
  const [harvestSeeds, setHarvestSeeds] = useState<GreenhouseHarvestSeed[]>([]);
  const [seeds, setSeeds] = useState<GreenhouseSeed[]>([]);
  const [seedFormOpen, setSeedFormOpen] = useState(false);
  const [editingHarvestSeed, setEditingHarvestSeed] = useState<GreenhouseHarvestSeed | null>(null);
  const [confirmDeleteSeed, setConfirmDeleteSeed] = useState<{ id: number; label: string } | null>(null);

  const [resultFormOpen, setResultFormOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<GreenhouseHarvestResult | null>(null);
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
      const item = await getGreenhouseHarvest(harvestId);
      const [greenhouseItem, list, resultList, stockList, seedUsage, seedList] = await Promise.all([
        getGreenhouse(item.greenhouseId),
        getGreenhouseHarvestItems(harvestId),
        getGreenhouseHarvestResults(harvestId),
        getGreenhouseStock(item.greenhouseId),
        getGreenhouseHarvestSeeds(harvestId),
        getGreenhouseSeeds(item.greenhouseId),
      ]);
      setHarvest(item);
      setGreenhouse(greenhouseItem);
      setItems(list);
      setResults(resultList);
      setStocks(stockList);
      setHarvestSeeds(seedUsage);
      setSeeds(seedList);
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

    const updated: GreenhouseHarvest = { ...harvest, status: pendingStatus };
    setStatusSaving(true);
    setStatusError(null);
    try {
      await updateGreenhouseHarvest(harvest.id, updated);
      setHarvest(updated);
    } catch {
      setStatusError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
      setPendingStatus(null);
    }
  }

  /** The raw unit a good is measured in, for the mixed-unit check. */
  function rawUnitFor(greenhouseStockId: number): string | null {
    return stocks.find((s) => s.id === greenhouseStockId)?.unit ?? null;
  }

  function unitLabelFor(unit: string | null): string {
    if (!unit) return '';
    const key = STOCK_UNIT_LABEL_KEY[unit];
    return key ? t(key) : unit;
  }

  function targetFor(greenhouseStockId: number): TargetInfo | null {
    const stock = stocks.find((s) => s.id === greenhouseStockId);
    if (!stock) return null;
    return {
      label: stock.name.trim() || stockTypeLabel(stock.type, t),
      icon: stockKindImage(stock.type),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
    };
  }

  /** A seed row's label and unit, for display in the "seeds used" list. */
  function seedInfoFor(greenhouseSeedId: number): { label: string; unitLabel: string; icon: string } | null {
    const seed = seeds.find((s) => s.id === greenhouseSeedId);
    if (!seed) return null;
    return {
      label: seed.name.trim() || stockTypeLabel(seed.type, t),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[seed.unit] ?? seed.unit),
      icon: stockKindImage(seed.type),
    };
  }

  function openAddSeed() {
    setEditingHarvestSeed(null);
    setSeedFormOpen(true);
  }

  function openEditSeed(harvestSeed: GreenhouseHarvestSeed) {
    setEditingHarvestSeed(harvestSeed);
    setSeedFormOpen(true);
  }

  // Seed amounts on hand changed, so reload rather than patching them in by hand.
  function handleSeedSaved(harvestSeed: GreenhouseHarvestSeed, isNew: boolean) {
    setHarvestSeeds((prev) => (isNew ? [...prev, harvestSeed] : prev.map((s) => (s.id === harvestSeed.id ? harvestSeed : s))));
    if (harvest) getGreenhouseSeeds(harvest.greenhouseId).then(setSeeds).catch(() => {});
  }

  async function confirmDeleteSeedAction() {
    if (!confirmDeleteSeed) return;
    const { id } = confirmDeleteSeed;
    try {
      await deleteGreenhouseHarvestSeed(id);
      setHarvestSeeds((prev) => prev.filter((s) => s.id !== id));
      if (harvest) getGreenhouseSeeds(harvest.greenhouseId).then(setSeeds).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteSeed(null);
    }
  }

  function openAddItem() {
    setEditingItem(null);
    setItemFormOpen(true);
  }

  function openEditItem(item: GreenhouseHarvestItem) {
    setEditingItem(item);
    setItemFormOpen(true);
  }

  function handleItemSaved(item: GreenhouseHarvestItem, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  async function confirmDeleteItemAction() {
    if (!confirmDeleteItem) return;
    const { id } = confirmDeleteItem;
    try {
      await deleteGreenhouseHarvestItem(id);
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

  function openEditResult(result: GreenhouseHarvestResult) {
    setEditingResult(result);
    setResultFormOpen(true);
  }

  function handleResultSaved(result: GreenhouseHarvestResult, isNew: boolean) {
    setResults((prev) => (isNew ? [...prev, result] : prev.map((r) => (r.id === result.id ? result : r))));
  }

  async function confirmDeleteResultAction() {
    if (!confirmDeleteResult) return;
    const { id } = confirmDeleteResult;
    try {
      await deleteGreenhouseHarvestResult(id);
      setResults((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteResult(null);
    }
  }

  // Planned (GreenhouseHarvestItem) against actual (GreenhouseHarvestResult), paired by good.
  // buildYieldRows/rowFor key by stockId/treeStockId; a greenhouse result only ever has one side,
  // so treeStockId is always null here and every row keys off greenhouseStockId as "stockId".
  const yieldRows = useMemo(
    () =>
      buildYieldRows(
        items.map((item) => ({ stockId: item.greenhouseStockId, treeStockId: null, amount: item.amount, unit: item.unit })),
        results.map((result) => ({ stockId: result.greenhouseStockId, treeStockId: null, amount: result.amount }))
      ),
    [items, results]
  );
  const hasComparison = yieldRows.some((row) => row.actual > 0);
  // Planning is for setting the harvest up; what it's expected to yield is decided once the crop
  // is actually in the ground, so the planned items belong to Planting. Existing rows stay visible
  // in every status — a harvest moved back to Planning shouldn't appear to have lost its plan.
  const canPlan = harvest?.status === 'Planting';

  /** The crop kinds actually sown for this harvest — the only things a plan can cover. Seed and
   * greenhouse stock share the StockKind catalog, so a seed's type matches its produce's type. */
  const sownTypes = useMemo(() => {
    const seedById = new Map(seeds.map((s) => [s.id, s]));
    return [
      ...new Set(
        harvestSeeds.map((used) => seedById.get(used.greenhouseSeedId)?.type).filter((type): type is string => !!type)
      ),
    ];
  }, [harvestSeeds, seeds]);

  const economics = useMemo(
    () => (harvest ? computeEconomics(harvest, yieldRows, (row) => rawUnitFor(row.stockId ?? -1), null, chemicalTotal) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [harvest, yieldRows, stocks, chemicalTotal]
  );

  const totalExpenses = economics?.totalExpenses ?? 0;
  const revenue = economics?.revenue ?? 0;
  const netTotal = economics?.net ?? 0;

  // The unit label to show next to the aggregate figures, once the harvest resolves to one unit.
  const economicsUnitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row?.stockId != null ? (targetFor(row.stockId)?.unitLabel ?? '') : '';
  })();

  const overdue = harvest ? isOverdue(harvest) : false;
  const daysLeft = harvest ? daysUntilExpected(harvest) : null;

  // A status change that writes or reverses stock says so with real numbers, rather than the
  // generic "this will update the status" — reversing is the one move that silently rewrites
  // data outside this harvest.
  const recordedCount = results.length;
  const statusChangeBody = (() => {
    if (!harvest || pendingStatus == null) return t('harvest.statusConfirmBody');

    if (isApplyingTransition(harvest.status, pendingStatus)) {
      return recordedCount === 0
        ? t('harvest.statusConfirmBodyToHarvestedEmpty')
        : t('harvest.statusConfirmBodyToHarvestedCount', { count: recordedCount });
    }
    if (isDestructiveTransition(harvest.status, pendingStatus)) {
      return recordedCount === 0
        ? t('harvest.statusConfirmBodyFromHarvested')
        : t('harvest.statusConfirmBodyFromHarvestedCount', { count: recordedCount });
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
      <Link to="/farm/greenhouse/harvest" className="back-link">
        ← {t('greenhouse.harvestTitle')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{harvest?.title ?? t('greenhouse.harvestTitle')}</h1>
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
              {greenhouse && (
                <p className="limit-hint">
                  {t('farm.greenhouse')}: {greenhouse.name}
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
                <GreenhouseChemicalHistory greenhouseHarvestId={harvestId} onTotalChange={setChemicalTotal} />
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
                  const target = row.stockId != null ? targetFor(row.stockId) : null;
                  // Results are always recorded in the good's own unit, but a plan carries its
                  // own. Subtracting across two different units would be nonsense, so a variance
                  // is only shown when both sides are in the same one.
                  const comparable =
                    row.plannedUnit == null || row.plannedUnit === rawUnitFor(row.stockId ?? -1);
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

          <div className="field harvest-section-label">
            <label>{t('harvestSeed.title')}</label>
          </div>

          {harvestSeeds.length === 0 ? (
            <p className="empty-state">{t('harvestSeed.empty')}</p>
          ) : (
            <div className="list-card-grid harvest-compact-icons">
              {harvestSeeds.map((harvestSeed) => {
                const info = seedInfoFor(harvestSeed.greenhouseSeedId);
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

          <div className="field harvest-section-label">
            <label>{t('harvest.plannedTitle')}</label>
          </div>

          {items.length === 0 ? (
            <p className="empty-state">
              {harvest?.status === 'Planning' ? t('harvestItem.plantingOnly') : t('harvestItem.empty')}
            </p>
          ) : (
            <div className="list-card-grid harvest-compact-icons">
              {items.map((item) => {
                const target = targetFor(item.greenhouseStockId);
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
                    const target = targetFor(result.greenhouseStockId);
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

      {harvest && (
        <GreenhouseHarvestSeedFormModal
          open={seedFormOpen}
          greenhouseHarvestId={harvestId}
          greenhouseId={harvest.greenhouseId}
          editingSeed={editingHarvestSeed}
          onClose={() => setSeedFormOpen(false)}
          onSaved={handleSeedSaved}
        />
      )}

      <ConfirmDeleteModal
        open={!!confirmDeleteSeed}
        name={confirmDeleteSeed?.label ?? ''}
        body={t('harvestSeed.deleteBody')}
        onCancel={() => setConfirmDeleteSeed(null)}
        onConfirm={confirmDeleteSeedAction}
      />

      {harvest && (
        <GreenhouseHarvestItemFormModal
          open={itemFormOpen}
          greenhouseHarvestId={harvestId}
          greenhouseId={harvest.greenhouseId}
          editingItem={editingItem}
          sownTypes={sownTypes}
          onClose={() => setItemFormOpen(false)}
          onSaved={handleItemSaved}
        />
      )}

      <ConfirmDeleteModal
        open={!!confirmDeleteItem}
        name={confirmDeleteItem?.label ?? ''}
        onCancel={() => setConfirmDeleteItem(null)}
        onConfirm={confirmDeleteItemAction}
      />

      {harvest && (
        <GreenhouseHarvestResultFormModal
          open={resultFormOpen}
          greenhouseHarvestId={harvestId}
          greenhouseId={harvest.greenhouseId}
          editingResult={editingResult}
          plannedItems={items}
          onClose={() => setResultFormOpen(false)}
          onSaved={handleResultSaved}
        />
      )}

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
        <GreenhouseHarvestExpensesModal
          harvest={harvest}
          open={expensesOpen}
          onClose={() => setExpensesOpen(false)}
          onSaved={setHarvest}
        />
      )}
    </div>
  );
}
