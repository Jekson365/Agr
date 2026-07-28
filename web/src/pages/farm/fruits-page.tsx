import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { PacketsModal } from '@/components/farm/packets-modal';
import { TreeStockFormModal } from '@/components/farm/tree-stock/tree-stock-form-modal';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { fruitKindImage, fruitTypeLabel, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
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
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);

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
        <div className="list-card-grid">
          {items.map((item) => {
            const typeLabel = fruitTypeLabel(item.type, t);
            const unitLabel = t(TREE_STOCK_UNIT_LABEL_KEY[item.unit]);
            const title = item.name.trim() || typeLabel;
            return (
              <div key={item.id} className="list-card">
                <Link to={`/farm/fruits/${item.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={fruitKindImage(item.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{title}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {item.name.trim() ? `${typeLabel} · ` : ''}
                      {item.amount} {unitLabel}
                    </span>
                  </span>
                </Link>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: title })} />
              </div>
            );
          })}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.fruits') })}</p>}

      <TreeStockFormModal
        open={formOpen}
        editingStock={editingItem}
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
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
