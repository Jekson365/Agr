import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import greenhousePlaceholder from '@/assets/icons/greenhouse-deafult.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseFormModal } from '@/components/farm/greenhouse/greenhouse-form-modal';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, resolveAssetUrl } from '@/services/api-client';
import { deleteGreenhouse, getGreenhouses } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';

/** Deliberately built on the land page's card classes — a greenhouse reads as the same kind of
 * thing as a farmland, so the two lists look identical. */
export function GreenhousePage() {
  const { t, language } = useLanguage();

  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Greenhouse | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setGreenhouses(await getGreenhouses());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Greenhouse) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteGreenhouse(id);
      setGreenhouses((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      // The server refuses while stock or harvests still point at it — they'd be left unreachable.
      setError(err instanceof ApiError && err.status === 409 ? t('greenhouse.inUse') : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(greenhouse: Greenhouse, isNew: boolean) {
    setGreenhouses((prev) => (isNew ? [...prev, greenhouse] : prev.map((g) => (g.id === greenhouse.id ? greenhouse : g))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.greenhouse')}</h1>
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('farm.addGreenhouse')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('greenhouse.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : greenhouses.length === 0 ? (
        <p className="empty-state">{t('greenhouse.empty')}</p>
      ) : (
        <div className="land-card-grid">
          {greenhouses.map((item) => (
            <div key={item.id} className="land-card">
              <div className="land-card-header">
                {/* Opening a greenhouse shows its own details; editing it stays on the card menu,
                    mirroring the land page. */}
                <Link to={`/farm/greenhouse/${item.id}`} className="land-card-body">
                  <div className="list-card-title">{item.name}</div>
                  <div className="list-card-subtitle">
                    {t('farm.area')} {item.area} {t('farm.areaUnit')}
                  </div>
                  {item.establishDate && (
                    <div className="list-card-subtitle">
                      {t('farm.establishDate')}: {formatLocalizedIsoDay(item.establishDate, language)}
                    </div>
                  )}
                  {item.location && (
                    <div className="list-card-subtitle">
                      {t('farm.location')}: {item.location}
                    </div>
                  )}
                </Link>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: item.name })} />
              </div>
              <Link to={`/farm/greenhouse/${item.id}`}>
                <img
                  src={item.imagePath ? resolveAssetUrl(item.imagePath) : greenhousePlaceholder}
                  alt=""
                  className="land-card-image"
                />
              </Link>
            </div>
          ))}
        </div>
      )}

      <GreenhouseFormModal
        open={formOpen}
        editingItem={editingItem}
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
