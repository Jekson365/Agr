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
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);

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
      setLivestock((prev) => prev.filter((i) => i.id !== id));
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
              <div key={item.id} className="entity-tile">
                <Link to={`/farm/livestock/${item.id}`} className="entity-tile-media">
                  <img src={livestockImage(item.type)} alt="" className="entity-tile-icon" />
                </Link>

                <div className="entity-tile-menu">
                  <CardMenu onEdit={() => openEdit(item)} onDelete={() => setConfirmDelete({ id: item.id, name: item.name })} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{item.name}</h2>

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

                  {/* Both destinations the old card offered, kept as a stack. */}
                  <div className="entity-tile-actions">
                    <Link to={`/farm/livestock/${item.id}/production`} className="entity-tile-details">
                      {t('production.title')}
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

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
