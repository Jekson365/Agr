import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseStockFormModal } from '@/components/farm/greenhouse/greenhouse-stock-form-modal';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { deleteGreenhouseStock, getGreenhouseStock } from '@/services/greenhouse-stock-service';
import { getGreenhouses } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';
import type { GreenhouseStock } from '@/types/greenhouse-stock';

/**
 * Stock grown under glass. Its own table, so the field's list and this one never mix — but typed
 * by the same crop catalog, so a crop reads the same in both.
 */
export function GreenhouseStockPage() {
  const { t } = useLanguage();

  const [stock, setStock] = useState<GreenhouseStock[]>([]);
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GreenhouseStock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [stockList, greenhouseList] = await Promise.all([getGreenhouseStock(), getGreenhouses()]);
      setStock(stockList);
      setGreenhouses(greenhouseList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function greenhouseName(id: number): string {
    return greenhouses.find((house) => house.id === id)?.name ?? '';
  }

  function openAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: GreenhouseStock) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteGreenhouseStock(id);
      setStock((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: GreenhouseStock, isNew: boolean) {
    setStock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  return (
    <div>
      <Link to="/farm/greenhouse" className="back-link">
        ← {t('farm.greenhouse')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('greenhouse.stockTitle')}</h1>
        <button type="button" className="add-button" onClick={openAdd} disabled={greenhouses.length === 0}>
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
      ) : greenhouses.length === 0 ? (
        <p className="empty-state">{t('greenhouse.addFirst')}</p>
      ) : stock.length === 0 ? (
        <p className="empty-state">{t('greenhouse.stockEmpty')}</p>
      ) : (
        <div className="list-card-grid">
          {stock.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            return (
              <div key={item.id} className="list-card">
                <div className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={stockKindImage(item.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{title}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {item.name.trim() ? `${typeLabel} · ` : ''}
                      {greenhouseName(item.greenhouseId)}
                    </span>
                  </span>
                </div>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: title })} />
              </div>
            );
          })}
        </div>
      )}

      <GreenhouseStockFormModal
        open={formOpen}
        editingStock={editingItem}
        greenhouses={greenhouses}
        existingItems={stock}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
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
