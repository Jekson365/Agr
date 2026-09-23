import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import { landContents, plotsOf, soilPath } from '@/components/farm/land/land-contents';
import { LandFormModal } from '@/components/farm/land/land-form-modal';
import { LandSoilPlotModal } from '@/components/farm/land/land-soil-plot-modal';
import { LandTile } from '@/components/farm/land/land-tile';
import { PacketsModal } from '@/components/farm/packets-modal';
import { isAtLimit, isOverLimit, isPlanLimitError } from '@/config/plan-benefits';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { deleteFarm, restoreFarm } from '@/services/farm-service';
import type { Farm } from '@/types/farm';
import type { LandPlot } from '@/types/land-plot';
import { useLandPage } from './use-land-page';

export function LandPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { farms, setFarms, plots, livestock, loading, error, setError, load } = useLandPage();

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Farm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  /** Non-null while the packet list is up; holds the cap message that raised it. */
  const [packetsMessage, setPacketsMessage] = useState<string | null>(null);
  /** Non-null while a land's plots are being picked between for its soil investigations. */
  const [soilPicker, setSoilPicker] = useState<{ farmId: number; plots: LandPlot[] } | null>(null);

  /* Removed land is out of use, so it doesn't count against the plan — which is also what the
     server counts, and what makes restoring a piece worth refusing when there is no room. */
  const activeCount = farms.filter((farm) => !farm.isRemoved).length;
  const atLimit = isAtLimit(user?.maxLand, activeCount);
  // Only a downgrade can leave the count past the cap; that is also where the server stops edits.
  const overLimit = isOverLimit(user?.maxLand, activeCount);

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

  /* Removing land marks it rather than dropping it, so the card stays put and turns disabled —
     everything recorded on this land still points at it, and a card that vanished would take the
     explanation for all of it with it. */
  async function confirmDeleteItem() {
    if (!confirmDelete) return;
    const { id } = confirmDelete;
    try {
      await deleteFarm(id);
      setFarms((prev) => prev.map((f) => (f.id === id ? { ...f, isRemoved: true } : f)));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  async function handleRestore(farm: Farm) {
    try {
      await restoreFarm(farm.id);
      setFarms((prev) => prev.map((f) => (f.id === farm.id ? { ...f, isRemoved: false } : f)));
    } catch (err) {
      // The server refuses when the plan has no room for it any more, which is the packets case
      // rather than an error to print over the page.
      if (isPlanLimitError(err)) {
        setPacketsMessage(t('plans.limitReached', { resource: t('farm.land') }));
        return;
      }
      setError(err instanceof Error ? err.message : String(err));
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
        <div className="page-header-actions">
          {/* Enabled even at the cap — clicking it answers with the available packets. */}
          <button type="button" className="add-button" onClick={openAdd}>
            + {t('farm.addFarmland')}
          </button>
        </div>
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
        <div className="land-tile-grid">
          {farms.map((item) => {
            const farmPlots = plotsOf(item.id, plots);

            return (
              <LandTile
                key={item.id}
                farm={item}
                contents={landContents(item.id, plots, livestock, t)}
                soilTo={farmPlots.length === 1 ? soilPath(item.id, farmPlots[0].id) : undefined}
                onSoil={
                  farmPlots.length > 1 ? () => setSoilPicker({ farmId: item.id, plots: farmPlots }) : undefined
                }
                onEdit={() => openEdit(item)}
                onDelete={() => setConfirmDelete({ id: item.id, name: item.name })}
                onRestore={() => handleRestore(item)}
              />
            );
          })}
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

      <LandSoilPlotModal
        open={soilPicker != null}
        plots={soilPicker?.plots ?? []}
        onClose={() => setSoilPicker(null)}
        onSelect={(plotId) => {
          if (soilPicker) navigate(soilPath(soilPicker.farmId, plotId));
        }}
      />

      {/* Removing land disables it rather than dropping it — say so, since the standard "cannot be
          undone" line overstates what happens to the plots, herds and harvests on it. */}
      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.name ?? ''}
        body={t('farm.removeLandBody')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteItem}
      />
    </div>
  );
}
