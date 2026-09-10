import { useCallback, useEffect, useMemo, useState } from 'react';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { HarvestFormModal } from '@/components/harvest/harvest-form-modal';
import { isOverdue } from '@/config/harvest-analysis';
import { useLanguage } from '@/contexts/language-context';
import { deleteHarvest, getHarvests } from '@/services/harvest-service';
import { getHarvestItems } from '@/services/harvest-item-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvestTrees } from '@/services/harvest-tree-service';
import { getStock } from '@/services/stock-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Harvest, HarvestKind } from '@/types/harvest';
import type { Stock } from '@/types/stock';
import type { TreeStock } from '@/types/tree-stock';
import { buildHarvestGoods, replaceHarvestSources, type HarvestGoodSources } from './harvest-list-goods';
import { HarvestDetailPane } from './harvest-detail-pane';
import { HarvestListPanel } from './harvest-list-panel';
import { DEFAULT_HARVEST_FILTERS, filterHarvests, type HarvestFilters } from './harvest-list-filter';
import { loadListCollapsed, saveListCollapsed } from './harvest-list-collapse';
import './harvest-workspace.css';

type Props = {
  /** Which harvests this workspace covers. Crop is the plant-farming page; Fruit is the orchard's,
   *  which records its yield on the trees it picked rather than as a result. */
  kind?: HarvestKind;
};

export function HarvestWorkspacePage({ kind = 'Crop' }: Props) {
  const { t } = useLanguage();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [sources, setSources] = useState<HarvestGoodSources>({ items: [], results: [], trees: [] });
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<HarvestFilters>(DEFAULT_HARVEST_FILTERS);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(loadListCollapsed);

  const [formOpen, setFormOpen] = useState(false);
  const [editingHarvest, setEditingHarvest] = useState<Harvest | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Harvest | null>(null);

  // The two pages render this same component, so switching between them reuses the instance
  // rather than remounting — reload when `kind` flips so the list isn't the other page's.
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, items, results, trees, stockList, treeStockList] = await Promise.all([
        getHarvests(kind),
        getHarvestItems(),
        getHarvestResults(),
        getHarvestTrees(),
        getStock(true),
        getTreeStock(true),
      ]);
      setHarvests(list);
      setSources({ items, results, trees });
      setStocks(stockList);
      setTreeStocks(treeStockList);
      setSelectedId(filterHarvests(list, DEFAULT_HARVEST_FILTERS)[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const patchHarvest = useCallback((next: Harvest) => {
    setHarvests((prev) => prev.map((h) => (h.id === next.id ? next : h)));
  }, []);

  const patchGoods = useCallback((harvestId: number, next: HarvestGoodSources) => {
    setSources((prev) => replaceHarvestSources(prev, harvestId, next));
  }, []);

  function changeCollapsed(next: boolean) {
    setCollapsed(next);
    saveListCollapsed(next);
  }

  function handleSaved(harvest: Harvest, isNew: boolean) {
    setHarvests((prev) => (isNew ? [harvest, ...prev] : prev.map((h) => (h.id === harvest.id ? harvest : h))));
    setSelectedId(harvest.id);
  }

  async function confirmDeleteHarvest() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    setConfirmDelete(null);
    try {
      await deleteHarvest(id);
      const remaining = harvests.filter((h) => h.id !== id);
      setHarvests(remaining);
      if (selectedId === id) setSelectedId(filterHarvests(remaining, filters)[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const visible = filterHarvests(harvests, filters);
  const overdueCount = harvests.filter((h) => isOverdue(h)).length;

  const goods = useMemo(
    () => buildHarvestGoods(sources, { stocks, treeStocks, seeds: [], treeProducts: [] }, t),
    [sources, stocks, treeStocks, t]
  );

  return (
    <div className="hw-page">
      <div className="page-header">
        <h1 className="page-title">{t('harvest.title')}</h1>
        <button
          type="button"
          className="add-button"
          onClick={() => {
            setEditingHarvest(null);
            setFormOpen(true);
          }}
        >
          + {t('harvest.add')}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : (
        <div className={collapsed ? 'hw-split collapsed' : 'hw-split'}>
          <HarvestListPanel
            kind={kind}
            harvests={visible}
            goods={goods}
            total={harvests.length}
            overdueCount={overdueCount}
            filters={filters}
            onFilters={setFilters}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyText={harvests.length === 0 ? t('harvest.empty') : t('harvest.noResults')}
            collapsed={collapsed}
            onCollapsedChange={changeCollapsed}
          />

          {selectedId != null ? (
            <HarvestDetailPane
              key={selectedId}
              harvestId={selectedId}
              onEdit={(harvest) => {
                setEditingHarvest(harvest);
                setFormOpen(true);
              }}
              onDelete={setConfirmDelete}
              onHarvestChanged={patchHarvest}
              onGoodsChanged={patchGoods}
            />
          ) : (
            <div className="hw-pane">
              <p className="hd-empty">{t('harvest.empty')}</p>
            </div>
          )}
        </div>
      )}

      <HarvestFormModal
        open={formOpen}
        kind={kind}
        editingHarvest={editingHarvest}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.title ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteHarvest}
      />
    </div>
  );
}
