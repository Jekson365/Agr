import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { PacketsModal } from '@/components/farm/packets-modal';
import { StockFormModal } from '@/components/farm/stock/stock-form-modal';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { deleteStock, getStock } from '@/services/stock-service';
import type { Stock } from '@/types/stock';

export function StockPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [stock, setStock] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Stock | null>(null);
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
      setStock(await getStock());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const atLimit = isAtLimit(user?.maxStockKinds, stock.length);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxStockKinds, stock.length);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.plantStock') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Stock) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.plantStock') }));
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
      await deleteStock(id);
      setStock((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: Stock, isNew: boolean) {
    setStock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.plantStock')}</h1>
        {/* Enabled even at the cap — clicking it answers with the available packets. */}
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('farm.addStock')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadErrorStock')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="list-card-grid">
          {stock.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            return (
              <div key={item.id} className="list-card">
                <Link to={`/farm/stock/${item.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={stockKindImage(item.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{title}</span>
                    {item.name.trim() && (
                      <>
                        <br />
                        <span className="list-card-subtitle">{typeLabel}</span>
                      </>
                    )}
                  </span>
                </Link>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: title })} />
              </div>
            );
          })}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.plantStock') })}</p>}

      <StockFormModal
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
