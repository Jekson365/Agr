import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

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
  isApplyingTransition,
  isDestructiveTransition,
} from '@/config/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import { getGreenhouse } from '@/services/greenhouse-service';
import { getGreenhouseHarvest, updateGreenhouseHarvest } from '@/services/greenhouse-harvest-service';
import { deleteGreenhouseHarvestSeed, getGreenhouseHarvestSeeds } from '@/services/greenhouse-harvest-seed-service';
import { deleteGreenhouseHarvestItem, getGreenhouseHarvestItems } from '@/services/greenhouse-harvest-item-service';
import { deleteGreenhouseHarvestResult, getGreenhouseHarvestResults } from '@/services/greenhouse-harvest-result-service';
import { getGreenhouseSeeds, getGreenhouseStock } from '@/services/greenhouse-stock-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { GreenhouseHarvestItem } from '@/types/greenhouse-harvest-item';
import type { GreenhouseHarvestResult } from '@/types/greenhouse-harvest-result';
import type { GreenhouseHarvestSeed } from '@/types/greenhouse-harvest-seed';
import type { GreenhouseSeed, GreenhouseStock } from '@/types/greenhouse-stock';
import type { HarvestStatus } from '@/types/harvest';
import { rawUnitFor, seedInfoFor, targetFor, unitLabelFor } from './greenhouse-harvest-lookups';
import { GreenhouseHarvestSummary } from './greenhouse-harvest-summary';
import { HarvestCardList, type HarvestCard } from './harvest-card-list';
import { YieldComparisonTable } from './yield-comparison-table';

/**
 * The greenhouse counterpart to HarvestDetailPage — the same planning → planting → harvested
 * workflow, minus the branches that don't apply here: no orchard/tree side (a greenhouse has no
 * picking-without-consuming equivalent), and no farm/plot (the harvest belongs to a greenhouse
 * instead).
 *
 * Owns the state and the server calls; the summary, the comparison and the three lists are in
 * this folder, and the lookups they share are in the module beside them.
 */
export function GreenhouseHarvestDetailPage() {
  const { t } = useLanguage();
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
        // Every greenhouse's goods and seed, not just this harvest's: a harvest may name any of
        // them, and these lists are what its rows are labelled and measured from.
        getGreenhouseStock(),
        getGreenhouseHarvestSeeds(harvestId),
        getGreenhouseSeeds(),
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

  function openAddSeed() {
    setEditingHarvestSeed(null);
    setSeedFormOpen(true);
  }

  // Seed amounts on hand changed, so reload rather than patching them in by hand.
  function handleSeedSaved(harvestSeed: GreenhouseHarvestSeed, isNew: boolean) {
    setHarvestSeeds((prev) => (isNew ? [...prev, harvestSeed] : prev.map((s) => (s.id === harvestSeed.id ? harvestSeed : s))));
    getGreenhouseSeeds().then(setSeeds).catch(() => {});
  }

  async function confirmDeleteSeedAction() {
    if (!confirmDeleteSeed) return;
    const { id } = confirmDeleteSeed;
    try {
      await deleteGreenhouseHarvestSeed(id);
      setHarvestSeeds((prev) => prev.filter((s) => s.id !== id));
      getGreenhouseSeeds().then(setSeeds).catch(() => {});
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
  const isHarvested = harvest?.status === 'Harvested';

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
    () =>
      harvest ? computeEconomics(harvest, yieldRows, (row) => rawUnitFor(stocks, row.stockId ?? -1), null, chemicalTotal) : null,
    [harvest, yieldRows, stocks, chemicalTotal]
  );

  // The unit label to show next to the aggregate figures, once the harvest resolves to one unit.
  const economicsUnitLabel = (() => {
    const row = yieldRows.find((r) => r.actual > 0);
    return row?.stockId != null ? (targetFor(stocks, row.stockId, t)?.unitLabel ?? '') : '';
  })();

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

  // The three lists, each as cards. Seed rows are fixed once the harvest is in; planned rows only
  // while it is being planted; results are always editable, since they only exist once harvested.
  const seedCards: HarvestCard[] = harvestSeeds.map((harvestSeed) => {
    const info = seedInfoFor(seeds, harvestSeed.greenhouseSeedId, t);
    return {
      id: harvestSeed.id,
      label: info?.label ?? '',
      icon: info?.icon,
      detail: `${harvestSeed.amount} ${info?.unitLabel ?? ''}`,
      editable: !isHarvested,
    };
  });

  const itemCards: HarvestCard[] = items.map((item) => {
    const target = targetFor(stocks, item.greenhouseStockId, t);
    return {
      id: item.id,
      label: target?.label ?? '',
      icon: target?.icon,
      detail: `${item.amount} ${unitLabelFor(item.unit, t) || (target?.unitLabel ?? '')}`,
      editable: canPlan,
    };
  });

  const resultCards: HarvestCard[] = results.map((result) => {
    const target = targetFor(stocks, result.greenhouseStockId, t);
    return {
      id: result.id,
      label: target?.label ?? '',
      icon: target?.icon,
      detail: `${result.amount} ${target?.unitLabel ?? ''}`,
      editable: true,
    };
  });

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
                <GreenhouseHarvestSummary
                  harvest={harvest}
                  greenhouseName={greenhouse?.name ?? null}
                  economics={economics}
                  unitLabel={economicsUnitLabel}
                  statusSaving={statusSaving}
                  statusError={statusError}
                  onRequestStatusChange={requestStatusChange}
                  onOpenExpenses={() => setExpensesOpen(true)}
                />
              </div>
              <div className="harvest-top-cell">
                <GreenhouseChemicalHistory greenhouseHarvestId={harvestId} onTotalChange={setChemicalTotal} />
              </div>
            </div>
          )}

          {hasComparison && <YieldComparisonTable rows={yieldRows} stocks={stocks} />}

          <HarvestCardList
            title={t('harvestSeed.title')}
            cards={seedCards}
            emptyLabel={t('harvestSeed.empty')}
            onEdit={(id) => {
              const harvestSeed = harvestSeeds.find((s) => s.id === id);
              if (harvestSeed) {
                setEditingHarvestSeed(harvestSeed);
                setSeedFormOpen(true);
              }
            }}
            onDelete={(card) => setConfirmDeleteSeed({ id: card.id, label: card.label })}
            add={isHarvested ? undefined : { label: t('harvestSeed.add'), onClick: openAddSeed }}
          />

          <HarvestCardList
            title={t('harvest.plannedTitle')}
            cards={itemCards}
            emptyLabel={harvest?.status === 'Planning' ? t('harvestItem.plantingOnly') : t('harvestItem.empty')}
            onEdit={(id) => {
              const item = items.find((i) => i.id === id);
              if (item) {
                setEditingItem(item);
                setItemFormOpen(true);
              }
            }}
            onDelete={(card) => setConfirmDeleteItem({ id: card.id, label: card.label })}
            add={canPlan ? { label: t('harvestItem.add'), onClick: openAddItem } : undefined}
          />

          {/* Final results belong to a finished harvest — the whole section stays out of the
              way while it's still being planned or grown. */}
          {isHarvested && (
            <HarvestCardList
              title={t('harvestResult.title')}
              cards={resultCards}
              emptyLabel={t('harvestResult.empty')}
              onEdit={(id) => {
                const result = results.find((r) => r.id === id);
                if (result) {
                  setEditingResult(result);
                  setResultFormOpen(true);
                }
              }}
              onDelete={(card) => setConfirmDeleteResult({ id: card.id, label: card.label })}
              add={{ label: t('harvestResult.add'), onClick: openAddResult }}
            />
          )}
        </>
      )}

      {harvest && (
        <GreenhouseHarvestSeedFormModal
          open={seedFormOpen}
          greenhouseHarvestId={harvestId}
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
          editingResult={editingResult}
          plannedItems={items}
          existingResults={results}
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
