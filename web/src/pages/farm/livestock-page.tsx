import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LivestockFormModal } from '@/components/farm/livestock/livestock-form-modal';
import { ChevronRightIcon, LocationIcon, PawIcon } from '@/components/icons/misc-icons';
import { livestockImage } from '@/config/livestock-kinds';
import { isAtLimit } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
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
  const [confirmDelete, setConfirmDelete] = useState<Livestock | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [livestockList, farmList] = await Promise.all([getLivestock(showDeleted), getFarms()]);
      setLivestock(livestockList);
      setFarms(farmList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  // Removed groups stop counting against the plan, so the cap is read off the live ones — which
  // is also the count the server enforces when the list is being shown with the removed included.
  const activeCount = livestock.filter((item) => !item.isDeleted).length;
  const atLimit = isAtLimit(user?.maxLivestockKinds, activeCount);

  function openAdd() {
    if (atLimit) return;
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Livestock) {
    setEditingItem(item);
    setFormOpen(true);
  }

  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteLivestock(id);
      setLivestock((prev) =>
        showDeleted ? prev.map((i) => (i.id === id ? { ...i, isDeleted: true } : i)) : prev.filter((i) => i.id !== id)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
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
          <label className="field-checkbox livestock-removed-toggle">
            <input type="checkbox" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
            {t('balance.showRemoved')}
          </label>
             {/* <Link to="/farm/livestock/balance" className="secondary-button">
            {t('productionBalance.short')}
          </Link> */}
          <button type="button" className="add-button" onClick={openAdd} disabled={atLimit}>
            + {t('farm.addLivestock')}
          </button>
        </div>
      </div>

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
        <div className="entity-tile-grid">
          {livestock.map((item) => {
            const farmName = farms.find((f) => f.id === item.farmId)?.name;
            return (
              <div key={item.id} className={item.isDeleted ? 'entity-tile is-removed' : 'entity-tile'}>
                <Link to={`/farm/livestock/${item.id}`} className="entity-tile-media">
                  <img src={livestockImage(item.type)} alt="" className="entity-tile-icon" />
                </Link>

                {/* A removed group takes no edits — the server refuses them — and cannot be removed
                    twice, so it carries no menu at all. */}
                {!item.isDeleted && (
                  <div className="entity-tile-menu">
                    <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete(item)} />
                  </div>
                )}

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">
                    {item.name}
                    {item.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
                  </h2>

                  <div className="entity-tile-meta">
                    <div className="entity-tile-row">
                      <PawIcon width={16} height={16} />
                      <span>
                        {t('farm.count')}: {item.count}
                      </span>
                    </div>
                    {farmName && (
                      <div className="entity-tile-row">
                        <LocationIcon width={16} height={16} />
                        <span>
                          {t('farm.farm')}: {farmName}
                        </span>
                      </div>
                    )}
                  </div>

                  <span className="entity-tile-divider" />

                  <div className="entity-tile-actions">
                    {/* What the herd yields and how it grows are a pair, so they share a row. */}
                    <div className="entity-tile-actions-row">
                      <Link to={`/farm/livestock/${item.id}/production`} className="entity-tile-details">
                        {t('production.title')}
                      </Link>
                      <Link to={`/farm/livestock/${item.id}/breeding`} className="entity-tile-details breeding">
                        {t('farm.breeding')}
                      </Link>
                    </div>
                    <Link to={`/farm/livestock/${item.id}/movement`} className="entity-tile-details secondary">
                      {t('livestockMovement.title')}
                    </Link>
                    <Link to={`/farm/livestock/${item.id}`} className="entity-tile-details secondary">
                      {t('farm.individualAnimals')}
                      <ChevronRightIcon width={16} height={16} />
                    </Link>
                  </div>
                </div>
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
      />

      {/* Removing a group marks it rather than dropping it: its animals, production and movement
          ledger all cascade off the row, so the default "cannot be undone" line would overstate
          what happens here. */}
      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('farm.deleteLivestockBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
