import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { ChemicalHistory } from '@/components/harvest/chemical-history';
import { HarvestExpensesModal } from '@/components/harvest/harvest-expenses-modal';
import { HarvestTreeFormModal } from '@/components/harvest/harvest-tree-form-modal';
import '@/components/harvest/harvest.css';
import { useLanguage } from '@/contexts/language-context';
import { getHarvest, updateHarvest } from '@/services/harvest-service';
import { deleteHarvestTree, getHarvestTrees } from '@/services/harvest-tree-service';
import { getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Harvest } from '@/types/harvest';
import type { HarvestTree } from '@/types/harvest-tree';
import type { TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';
import { FruitHarvestSummary } from './fruit-harvest-summary';
import { HarvestTreeList } from './harvest-tree-list';

/**
 * A fruit harvest: pick the trees you plan to harvest, then once it's marked harvested, record
 * how much each tree's product actually yielded. Deliberately simpler than the crop harvest —
 * an orchard has no sowing or growing stage, so it's just "not harvested" or "harvested".
 *
 * This file owns the data and the modals; the summary block and the tree list sit beside it.
 */
export function FruitHarvestDetailPage() {
  const { t } = useLanguage();
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
              <FruitHarvestSummary
                harvest={harvest}
                chemicalTotal={chemicalTotal}
                statusSaving={statusSaving}
                onToggleHarvested={toggleHarvested}
                onOpenExpenses={() => setExpensesOpen(true)}
              />
            </div>
            <div className="harvest-top-cell">
              <ChemicalHistory harvestId={harvestId} onTotalChange={setChemicalTotal} />
            </div>
          </div>

          <HarvestTreeList
            trees={trees}
            treeStocks={treeStocks}
            products={products}
            onEdit={(tree) => {
              setEditingTree(tree);
              setTreeFormOpen(true);
            }}
            onDelete={(tree, label) => setConfirmDeleteTree({ id: tree.id, label })}
            onAdd={() => {
              setEditingTree(null);
              setTreeFormOpen(true);
            }}
          />

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
