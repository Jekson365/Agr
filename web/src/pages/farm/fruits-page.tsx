import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/narrow-tile-grid.css';
import { PacketsModal } from '@/components/farm/packets-modal';
import { LimitCounter } from '@/components/farm/plan/limit-counter';
import { UpgradeTile } from '@/components/farm/plan/upgrade-tile';
import { usePlanLimit } from '@/components/farm/plan/use-plan-limit';
import { TreeStockFormModal } from '@/components/farm/tree-stock/tree-stock-form/tree-stock-form-modal';
import { BoxIcon, ChevronRightIcon, LeafIcon } from '@/components/icons/misc-icons';
import { fruitKindImage, fruitTypeLabel, treeStockLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
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

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setItems(await getTreeStock());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const limit = usePlanLimit(user?.maxFruitKinds, items.length, t('farm.fruits'));

  function openAdd() {
    if (limit.blocksAdd()) return;
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: TreeStock) {
    if (limit.blocksEdit()) return;
    setEditingItem(item);
    setFormOpen(true);
  }

  /* The client checks above run on a possibly stale user/plan, so the server has the last word —
     when it answers 402 the packets go up just the same. */
  function handleLimitReached(message: string) {
    setFormOpen(false);
    limit.showPackets(message);
  }

  function handleSaved(item: TreeStock, isNew: boolean) {
    setItems((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
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

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.fruits')}</h1>
        <div className="page-header-actions">
          <LimitCounter count={limit.count} max={limit.max} onClick={() => limit.showPackets()} />
          {/* Enabled even at the cap — clicking it answers with the available packets. */}
          <button type="button" className="add-button" onClick={openAdd}>
            + {t('treeStock.add')}
          </button>
        </div>
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
        <div className="entity-tile-grid narrow-tiles">
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
          {limit.atLimit && <UpgradeTile resource={t('farm.fruits')} onClick={() => limit.showPackets()} />}
        </div>
      )}

      <TreeStockFormModal
        open={formOpen}
        editingStock={editingItem}
        existingItems={items}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onLimitReached={handleLimitReached}
      />

      <PacketsModal
        open={limit.packetsMessage != null}
        message={limit.packetsMessage ?? ''}
        onClose={limit.closePackets}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('farm.deleteFruitBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
