import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import greenhousePlaceholder from '@/assets/icons/greenhouse-deafult.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { GreenhouseFormModal } from '@/components/farm/greenhouse/greenhouse-form-modal';
import { CalendarIcon, ChevronRightIcon, LocationIcon, SquareIcon } from '@/components/icons/misc-icons';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { ApiError, resolveAssetUrl } from '@/services/api-client';
import { deleteGreenhouse, getGreenhouses } from '@/services/greenhouse-service';
import type { Greenhouse } from '@/types/greenhouse';

/** Built on the shared entity tile — the same card /harvest, /farm/seeds and /farm/stock use, with
 * the greenhouse's own photo standing in for their icon panel. */
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
        <div className="entity-tile-grid">
          {greenhouses.map((item) => (
            <div key={item.id} className="entity-tile">
              <Link to={`/farm/greenhouse/${item.id}`} className="entity-tile-media">
                <img
                  src={item.imagePath ? resolveAssetUrl(item.imagePath) : greenhousePlaceholder}
                  alt=""
                  className="entity-tile-photo"
                />
              </Link>

              {/* Sits over the photo rather than in the text, so the body below stays a clean
                  column. Editing the greenhouse itself stays on this menu. */}
              <div className="entity-tile-menu">
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: item.name })} />
              </div>

              <div className="entity-tile-body">
                <h2 className="entity-tile-title">{item.name}</h2>

                <div className="entity-tile-meta">
                  <div className="entity-tile-row">
                    <SquareIcon width={16} height={16} />
                    <span>
                      {t('farm.area')} {item.area} {t('farm.areaUnit')}
                    </span>
                  </div>
                  {item.establishDate && (
                    <div className="entity-tile-row">
                      <CalendarIcon width={16} height={16} />
                      <span>{formatLocalizedIsoDay(item.establishDate, language)}</span>
                    </div>
                  )}
                  {item.location && (
                    <div className="entity-tile-row">
                      <LocationIcon width={16} height={16} />
                      <span>{item.location}</span>
                    </div>
                  )}
                </div>

                <span className="entity-tile-divider" />

                {/* Opening a greenhouse shows its own details. */}
                <Link to={`/farm/greenhouse/${item.id}`} className="entity-tile-details">
                  {t('common.details')}
                  <ChevronRightIcon width={16} height={16} />
                </Link>
              </div>
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
