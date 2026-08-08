import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { PacketsModal } from '@/components/farm/packets-modal';
import { TreeStockFormModal } from '@/components/farm/tree-stock/tree-stock-form/tree-stock-form-modal';
import { BoxIcon, ChevronRightIcon, LeafIcon } from '@/components/icons/misc-icons';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { fruitKindImage, fruitTypeLabel, treeStockLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { getUsedTreeStockIds } from '@/services/land-plot-service';
import { deleteTreeStock, getTreeStock } from '@/services/tree-stock-service';
import type { TreeStock } from '@/types/tree-stock';

export function FruitsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [items, setItems] = useState<TreeStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TreeStock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  /** Which fruits are planted on a plot — deleting one of those takes its plot with it. */
  const [plantedIds, setPlantedIds] = useState<Set<number>>(new Set());
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [list, planted] = await Promise.all([getTreeStock(), getUsedTreeStockIds()]);
      setItems(list);
      setPlantedIds(new Set(planted));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const atLimit = isAtLimit(user?.maxFruitKinds, items.length);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxFruitKinds, items.length);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.fruits') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: TreeStock) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.fruits') }));
      return;
    }
    setEditingItem(item);
    setFormOpen(true);
  }

  /* The client checks above run on a possibly stale user/plan, so the server has the last word —
     when it answers 402 the packets go up just the same. */
  function handleLimitReached(message: string) {
    setFormOpen(false);
    setPacketsMessage(message);
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteTreeStock(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: TreeStock, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  /** What else goes with the fruit: the product it yields always, its plot when it has one. */
  function deleteBody(id: number): string {
    return t(plantedIds.has(id) ? 'treeStock.deletePlanted' : 'treeStock.deleteProduct');
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.fruits')}</h1>
        {/* Enabled even at the cap — clicking it answers with the available packets. */}
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('treeStock.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('treeStock.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="entity-tile-grid">
          {items.map((item) => {
            const typeLabel = fruitTypeLabel(item.type, t);
            const unitLabel = t(TREE_STOCK_UNIT_LABEL_KEY[item.unit]);
            const title = treeStockLabel(item, t);
            return (
              <div key={item.id} className="entity-tile">
                <Link to={`/farm/fruits/${item.id}`} className="entity-tile-media">
                  <img src={fruitKindImage(item.type)} alt="" className="entity-tile-icon" />
                </Link>

                <div className="entity-tile-menu">
                  <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: title })} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <BoxIcon width={16} height={16} />
                      <span>
                        {item.amount} {unitLabel}
                      </span>
                    </div>
                    {/* The kind only needs spelling out when a custom name replaced it above. */}
                    {item.name.trim() && (
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{typeLabel}</span>
                      </div>
                    )}
                  </div>

                  <span className="entity-tile-divider" />

                  <Link to={`/farm/fruits/${item.id}`} className="entity-tile-details">
                    {t('common.details')}
                    <ChevronRightIcon width={16} height={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.fruits') })}</p>}

      <TreeStockFormModal
        open={formOpen}
        editingStock={editingItem}
        existingItems={items}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onLimitReached={handleLimitReached}
      />

      <PacketsModal
        open={packetsMessage != null}
        message={packetsMessage ?? ''}
        onClose={() => setPacketsMessage(null)}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={confirmDelete ? deleteBody(confirmDelete.id) : undefined}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
