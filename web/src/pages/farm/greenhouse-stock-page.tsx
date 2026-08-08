import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseStockFormModal } from '@/components/farm/greenhouse/greenhouse-stock-form-modal';
import { LeafIcon, LocationIcon } from '@/components/icons/misc-icons';
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
        <div className="entity-tile-grid">
          {stock.map((item) => {
            const typeLabel = stockTypeLabel(item.type, t);
            const title = item.name.trim() || typeLabel;
            return (
              <div key={item.id} className="entity-tile">
                {/* Greenhouse stock has no page of its own, so the panel is a plain frame rather
                    than a link and the card ends at its facts — no details button to offer. */}
                <div className="entity-tile-media">
                  <img src={stockKindImage(item.type)} alt="" className="entity-tile-icon" />
                </div>

                <div className="entity-tile-menu">
                  <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: title })} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{title}</h2>

                  <div className="entity-tile-meta">
                    {/* The crop only needs spelling out when a custom name replaced it above. */}
                    {item.name.trim() && (
                      <div className="entity-tile-row">
                        <LeafIcon width={16} height={16} />
                        <span>{typeLabel}</span>
                      </div>
                    )}
                    <div className="entity-tile-row">
                      <LocationIcon width={16} height={16} />
                      <span>{greenhouseName(item.greenhouseId)}</span>
                    </div>
                  </div>
                </div>
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
