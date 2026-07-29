import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { ChemicalHistory } from '@/components/harvest/chemical-history';
import { HarvestExpensesModal } from '@/components/harvest/harvest-expenses-modal';
import { HarvestTreeFormModal } from '@/components/harvest/harvest-tree-form-modal';
import '@/components/harvest/harvest.css';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import {
  fruitKindImage,
  fruitTypeLabel,
  TREE_PRODUCT_UNIT_LABEL_KEY,
  TREE_STOCK_UNIT_LABEL_KEY,
} from '@/config/fruit-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { getHarvest, updateHarvest } from '@/services/harvest-service';
import { deleteHarvestTree, getHarvestTrees } from '@/services/harvest-tree-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Harvest } from '@/types/harvest';
import type { HarvestTree } from '@/types/harvest-tree';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';

/**
 * A fruit harvest: pick the trees you plan to harvest, then once it's marked harvested, record
 * how much each tree's product actually yielded. Deliberately simpler than the crop harvest —
 * an orchard has no sowing or growing stage, so it's just "not harvested" or "harvested".
 */
export function FruitHarvestDetailPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const [harvest, setHarvest] = useState<Harvest | null>(null);
  const [trees, setTrees] = useState<HarvestTree[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusSaving, setStatusSaving] = useState(false);

  const [treeFormOpen, setTreeFormOpen] = useState(false);
  const [editingTree, setEditingTree] = useState<HarvestTree | null>(null);
  const [confirmDeleteTree, setConfirmDeleteTree] = useState<{ id: number; label: string } | null>(null);

  const [expensesOpen, setExpensesOpen] = useState(false);
  const [chemicalTotal, setChemicalTotal] = useState(0);

  useEffect(() => {
    if (!harvestId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvestId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, treeList, treeStockList, productList] = await Promise.all([
        getHarvest(harvestId),
        getHarvestTrees(harvestId),
        getTreeStock(),
        getTreeProducts(),
      ]);
      setHarvest(item);
      setTrees(treeList);
      setTreeStocks(treeStockList);
      setProducts(productList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const isHarvested = harvest?.status === 'Harvested';

  const totalExpenses = harvest
    ? (harvest.equipmentCost ?? 0) + (harvest.workersCost ?? 0) + (harvest.fuelCost ?? 0) + (harvest.otherCost ?? 0) + chemicalTotal
    : 0;
  const revenue = harvest?.revenue ?? 0;
  const net = revenue - totalExpenses;

  /** Only two states here: Planning stands in for "not harvested yet". */
  async function toggleHarvested(next: boolean) {
    if (!harvest || statusSaving) return;
    const updated: Harvest = { ...harvest, status: next ? 'Harvested' : 'Planning' };
    setStatusSaving(true);
    setError(null);
    try {
      await updateHarvest(harvest.id, updated);
      setHarvest(updated);
    } catch {
      setError(t('farm.saveError'));
    } finally {
      setStatusSaving(false);
    }
  }

  function treeInfo(treeStockId: number): { label: string; unitLabel: string; icon: string } | null {
    const treeStock = treeStocks.find((s) => s.id === treeStockId);
    if (!treeStock) return null;
    const fruit = fruitTypeLabel(treeStock.type, t);
    return {
      label: treeStock.name.trim() ? `${fruit} · ${treeStock.name}` : fruit,
      unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit] ?? 'farm.unitPlant'),
      icon: fruitKindImage(treeStock.type),
    };
  }

  // The produce unit for a tree stock's assigned product, shown next to its harvested amount.
  function harvestedUnitFor(treeStockId: number): string {
    const treeStock = treeStocks.find((s) => s.id === treeStockId);
    const product = treeStock ? products.find((p) => p.id === treeStock.treeProductId) : null;
    return product ? t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg') : '';
  }

  async function confirmDeleteTreeAction() {
    if (!confirmDeleteTree) return;
    try {
      await deleteHarvestTree(confirmDeleteTree.id);
      setTrees((prev) => prev.filter((h) => h.id !== confirmDeleteTree.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDeleteTree(null);
    }
  }

  return (
    <div>
      <Link to="/farm/fruits/harvest" className="back-link">
        ← {t('dashboard.harvest')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{harvest?.title ?? t('dashboard.harvest')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error && !harvest ? (
        <div className="state-box">
          <span>{t('harvest.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="harvest-top-grid">
            <div className="harvest-top-cell">
          <p className="limit-hint">{formatLocalizedIsoDay(harvest?.date, language)}</p>

          {/* Two states only — an orchard isn't sown, so it's either picked or it isn't. */}
          <div className="field harvest-section-label">
            <label>{t('harvest.statusLabel')}</label>
          </div>
          <div className="kind-row">
            <button
              type="button"
              className={!isHarvested ? 'kind-chip active' : 'kind-chip'}
              onClick={() => toggleHarvested(false)}
              disabled={statusSaving}
            >
              <span>{t('fruitHarvest.notHarvested')}</span>
            </button>
            <button
              type="button"
              className={isHarvested ? 'kind-chip active' : 'kind-chip'}
              onClick={() => toggleHarvested(true)}
              disabled={statusSaving}
            >
              <span>{t('fruitHarvest.harvested')}</span>
            </button>
            {isHarvested && (
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

          {isHarvested && (revenue > 0 || totalExpenses > 0) && (
            <div className="harvest-kpi-grid">
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
              <div className="harvest-kpi">
                <span className="harvest-kpi-label">{t('harvest.netTotal')}</span>
                <span className={net < 0 ? 'harvest-kpi-value negative' : 'harvest-kpi-value positive'}>{formatPrice(net)}</span>
              </div>
            </div>
          )}
            </div>
            <div className="harvest-top-cell">
              <ChemicalHistory harvestId={harvestId} onTotalChange={setChemicalTotal} />
            </div>
          </div>

          <div className="field harvest-section-label">
            <label>{t('harvestTree.title')}</label>
          </div>

          {trees.length === 0 ? (
            <p className="empty-state">{t('harvestTree.empty')}</p>
          ) : (
            <div className="list-card-grid">
              {trees.map((tree) => {
                const info = treeInfo(tree.treeStockId);
                return (
                  <div key={tree.id} className="list-card">
                    <div className="list-card-body">
                      <span className="list-card-icon-wrap">{info && <img src={info.icon} alt="" />}</span>
                      <span className="list-card-info">
                        <span className="list-card-title">{info?.label ?? ''}</span>
                        <br />
                        <span className="list-card-subtitle">
                          {t('harvestTree.amountPicked')}: {tree.amount} {info?.unitLabel ?? ''}
                        </span>
                        {tree.harvestedAmount > 0 && (
                          <>
                            <br />
                            <span className="list-card-subtitle">
                              {t('harvestTree.amountHarvested')}: {tree.harvestedAmount} {harvestedUnitFor(tree.treeStockId)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <CardMenu
                      onEdit={() => {
                        setEditingTree(tree);
                        setTreeFormOpen(true);
                      }}
                      onDelete={() => setConfirmDeleteTree({ id: tree.id, label: info?.label ?? '' })}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <button
            type="button"
            className="add-button"
            onClick={() => {
              setEditingTree(null);
              setTreeFormOpen(true);
            }}
          >
            + {t('harvestTree.add')}
          </button>

          {error && <div className="error-banner">{error}</div>}
        </>
      )}

      <HarvestTreeFormModal
        open={treeFormOpen}
        harvestId={harvestId}
        editingTree={editingTree}
        existingTrees={trees}
        onClose={() => setTreeFormOpen(false)}
        onSaved={(tree, isNew) =>
          setTrees((prev) => (isNew ? [...prev, tree] : prev.map((h) => (h.id === tree.id ? tree : h))))
        }
      />

      <ConfirmDeleteModal
        open={!!confirmDeleteTree}
        name={confirmDeleteTree?.label ?? ''}
        onCancel={() => setConfirmDeleteTree(null)}
        onConfirm={confirmDeleteTreeAction}
      />

      {harvest && (
        <HarvestExpensesModal harvest={harvest} open={expensesOpen} onClose={() => setExpensesOpen(false)} onSaved={setHarvest} />
      )}
    </div>
  );
}
