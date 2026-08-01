import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LivestockFormModal } from '@/components/farm/livestock/livestock-form-modal';
import { PacketsModal } from '@/components/farm/packets-modal';
import { livestockImage } from '@/config/livestock-kinds';
import { isAtLimit, isOverLimit } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { getFarms } from '@/services/farm-service';
import { deleteLivestock, getLivestock } from '@/services/livestock-service';
import type { Farm } from '@/types/farm';
import type { Livestock } from '@/types/livestock';

export function LivestockPage() {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Livestock | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  /** A refused delete. Kept apart from `error`, which stands for "the list didn't load" and
   *  replaces the list with a retry — no use for a group that is simply not deletable. */
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [livestockList, farmList] = await Promise.all([getLivestock(), getFarms()]);
      setLivestock(livestockList);
      setFarms(farmList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const atLimit = isAtLimit(user?.maxLivestockKinds, livestock.length);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxLivestockKinds, livestock.length);

  function openAdd() {
    if (atLimit) {
      setPacketsMessage(t('plans.limitReached', { resource: t('farm.livestock') }));
      return;
    }
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Livestock) {
    if (overLimit) {
      setPacketsMessage(t('plans.overLimit', { resource: t('farm.livestock') }));
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
    setDeleteError(null);
    try {
      await deleteLivestock(id);
      setLivestock((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      // The server refuses while production records still hang off the group — its own, or any
      // recorded on one of its animals. Deleting it would take that history with it.
      setDeleteError(
        err instanceof ApiError && err.status === 409
          ? t('farm.deleteHasProduction')
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setConfirmDelete(null);
    }
  }

  function handleSaved(item: Livestock, isNew: boolean) {
    setLivestock((prev) => (isNew ? [...prev, item] : prev.map((i) => (i.id === item.id ? item : i))));
  }

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.livestock')}</h1>
        <div className="page-header-actions">
          {/* <Link to="/farm/livestock/balance" className="secondary-button">
            {t('productionBalance.short')}
          </Link> */}
          {/* Enabled even at the cap — clicking it answers with the available packets. */}
          <button type="button" className="add-button" onClick={openAdd}>
            + {t('farm.addLivestock')}
          </button>
        </div>
      </div>

      {deleteError && <div className="error-banner">{deleteError}</div>}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('farm.loadErrorLivestock')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="list-card-grid two-col">
          {livestock.map((item) => {
            const farmName = farms.find((f) => f.id === item.farmId)?.name;
            return (
              <div key={item.id} className="list-card">
                <Link to={`/farm/livestock/${item.id}`} className="list-card-body">
                  <span className="list-card-icon-wrap">
                    <img src={livestockImage(item.type)} alt="" />
                  </span>
                  <span className="list-card-info">
                    <span className="list-card-title">{item.name}</span>
                    <br />
                    <span className="list-card-subtitle">
                      {t('farm.count')}: {item.count}
                      {farmName ? ` · ${t('farm.farm')}: ${farmName}` : ''}
                    </span>
                  </span>
                </Link>
                <Link to={`/farm/livestock/${item.id}/production`} className="list-card-production-link primary">
                  {t('production.title')}
                </Link>
                <Link to={`/farm/livestock/${item.id}`} className="list-card-production-link">
                  {t('farm.individualAnimals')}
                </Link>
                <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: item.name })} />
              </div>
            );
          })}
        </div>
      )}

      {farms.length === 0 && <p className="limit-hint">{t('farm.noFarmland')}</p>}
      {atLimit && <p className="limit-hint">{t('plans.limitReached', { resource: t('farm.livestock') })}</p>}

      <LivestockFormModal
        open={formOpen}
        editingItem={editingItem}
        farms={farms}
        existingItems={livestock}
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
