import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import landPlaceholder from '@/assets/properties/land.png';
import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LandFormModal } from '@/components/farm/land/land-form-modal';
import { PacketsModal } from '@/components/farm/packets-modal';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { deleteFarm, getFarms } from '@/services/farm-service';
import type { Farm } from '@/types/farm';

export function LandPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Farm | null>(null);
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
      setFarms(await getFarms());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const atLimit = isAtLimit(user?.maxLand, farms.length);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxLand, farms.length);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.land') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Farm) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.land') }));
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
      await deleteFarm(id);
      setFarms((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(farm: Farm, isNew: boolean) {
    setFarms((prev) => (isNew ? [...prev, farm] : prev.map((f) => (f.id === farm.id ? farm : f))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.land')}</h1>
        {/* Enabled even at the cap — clicking it answers with the available packets. */}
        <button type="button" className="add-button" onClick={openAdd}>
          + {t('farm.addFarmland')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="land-card-grid">
          {farms.map((item) => (
            <div key={item.id} className="land-card">
              <div className="land-card-header">
                {/* Opening a land shows its plots, mirroring the mobile app; editing the land
                    itself stays on the card menu. */}
                <Link to={`/farm/land/${item.id}`} className="land-card-body">
                  <div className="list-card-title">{item.name}</div>
                  <div className="list-card-subtitle">
                    {t('farm.area')} {item.area} {t('farm.areaUnit')}
                  </div>
                  <div className="list-card-subtitle">
                    {t('farm.location')}: {item.location}
                  </div>
                </Link>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: item.name })} />
              </div>
              <Link to={`/farm/land/${item.id}`}>
                <img
                  src={item.imagePath ? resolveAssetUrl(item.imagePath) : landPlaceholder}
                  alt=""
                  className="land-card-image"
                />
              </Link>
            </div>
          ))}
        </div>
      )}

      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.land') })}</p>}

      <LandFormModal
        open={formOpen}
        editingItem={editingItem}
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
