import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { LivestockFormModal } from '@/components/farm/livestock/livestock-form-modal';
import { LivestockTile } from '@/components/farm/livestock/livestock-tile';
import { PacketsModal } from '@/components/farm/packets-modal';
import { LimitCounter } from '@/components/farm/plan/limit-counter';
import { UpgradeTile } from '@/components/farm/plan/upgrade-tile';
import { usePlanLimit } from '@/components/farm/plan/use-plan-limit';
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
  const limit = usePlanLimit(user?.maxLivestockKinds, activeCount, t('farm.livestock'));

  function openAdd() {
    if (limit.blocksAdd()) return;
    setEditingItem(null);
    setFormOpen(true);
  }

  function openEdit(item: Livestock) {
    if (limit.blocksEdit()) return;
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
          <LimitCounter count={limit.count} max={limit.max} onClick={() => limit.showPackets()} />
          <button type="button" className="add-button" onClick={openAdd}>
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
          {livestock.map((item) => (
            <LivestockTile
              key={item.id}
              item={item}
              farmName={farms.find((f) => f.id === item.farmId)?.name}
              onEdit={() => openEdit(item)}
              onDelete={() => setConfirmDelete(item)}
            />
          ))}
          {limit.atLimit && <UpgradeTile resource={t('farm.livestock')} onClick={() => limit.showPackets()} />}
        </div>
      )}

      {farms.length === 0 && <p className="limit-hint">{t('farm.noFarmland')}</p>}

      <LivestockFormModal
        open={formOpen}
        editingItem={editingItem}
        farms={farms}
        existingItems={livestock}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
        onLimitReached={(message) => {
          setFormOpen(false);
          limit.showPackets(message);
        }}
      />

      <PacketsModal
        open={limit.packetsMessage != null}
        message={limit.packetsMessage ?? ''}
        onClose={limit.closePackets}
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
