import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/livestock/breeding/breeding.css';
import { DateField } from '@/components/ui/date-field';
import { formatLocalizedIsoDay, todayIsoDate } from '@/components/ui/date-utils';
import { Modal } from '@/components/ui/modal';
import { useLanguage } from '@/contexts/language-context';
import { ApiError } from '@/services/api-client';
import { getLivestockItem } from '@/services/livestock-service';
import {
  createLivestockMovement,
  deleteLivestockMovement,
  getLivestockMovements,
} from '@/services/livestock-movement-service';
import type { Livestock } from '@/types/livestock';
import {
  LIVESTOCK_MOVEMENT_SOURCES,
  type LivestockMovement,
  type LivestockMovementSource,
} from '@/types/livestock-movement';
import './livestock-movement-page.css';

const SOURCE_LABEL_KEY: Record<LivestockMovementSource, string> = {
  Manual: 'livestockMovement.sourceManual',
  Birth: 'livestockMovement.sourceBirth',
  Gift: 'livestockMovement.sourceGift',
  Purchase: 'livestockMovement.sourcePurchase',
  Realization: 'livestockMovement.sourceRealization',
};

/**
 * How a group came by the animals it has: every change to its head count, with what caused it.
 *
 * The count itself is one number and says nothing about where it came from. These entries are
 * written by the things that move it — the group's opening count, a breeding result, an animal
 * taken off the group, an animal realized — and by hand for the ways in that have no flow of their
 * own, so the ledger and the count cannot tell different stories.
 */
export function LivestockMovementPage() {
  const { t, language } = useLanguage();
  const { livestockId: livestockIdParam } = useParams<{ livestockId: string }>();
  const livestockId = Number(livestockIdParam);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [movements, setMovements] = useState<LivestockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [source, setSource] = useState<LivestockMovementSource>('Purchase');
  const [date, setDate] = useState(todayIsoDate);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; label: string } | null>(null);

  useEffect(() => {
    if (!livestockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [group, list] = await Promise.all([getLivestockItem(livestockId), getLivestockMovements(livestockId)]);
      setLivestock(group);
      setMovements(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setQuantityInput('1');
    setSource('Purchase');
    setDate(todayIsoDate());
    setNote('');
    setFormError(null);
    setFormOpen(true);
  }

  async function handleSubmit() {
    const quantity = Math.max(0, parseInt(quantityInput, 10) || 0);
    if (saving || quantity < 1 || !date) return;

    setSaving(true);
    setFormError(null);
    try {
      await createLivestockMovement({
        livestockId,
        // Only ways in are offered here, so this is always an addition. Animals leave by being
        // taken off the group one at a time, which writes its own entry.
        delta: quantity,
        source,
        date,
        note: note.trim() || null,
      });
      setFormOpen(false);
      // The group's count moved with it.
      await load();
    } catch (err) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? t('livestockMovement.tooMany')
          : t('livestockMovement.saveError')
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDeleteMovement() {
    if (!confirmDelete) return;
    try {
      await deleteLivestockMovement(confirmDelete.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setConfirmDelete(null);
    }
  }

  // What the entries add up to. Shown beside the group's count so the two can be read against each
  // other — they should agree, and a difference is worth seeing rather than hiding.
  const total = movements.reduce((sum, movement) => sum + movement.delta, 0);

  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">
            {t('livestockMovement.title')}
            {livestock ? ` · ${livestock.name}` : ''}
          </h1>
          {livestock && (
            <span className="page-header-count">
              {t('farm.count')}: {livestock.count}
            </span>
          )}
        </div>
        <button type="button" className="add-button" onClick={openAdd} disabled={loading}>
          + {t('livestockMovement.add')}
        </button>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('livestockMovement.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : movements.length === 0 ? (
        <p className="empty-state">{t('livestockMovement.empty')}</p>
      ) : (
        <>
          <div className="movement-list">
            {movements.map((movement) => (
              <div key={movement.id} className="movement-row">
                <span className={movement.delta < 0 ? 'movement-delta out' : 'movement-delta in'}>
                  {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                </span>

                <div className="movement-main">
                  <span className={`movement-source ${movement.source.toLowerCase()}`}>
                    {t(SOURCE_LABEL_KEY[movement.source])}
                  </span>
                  <span className="movement-date">{formatLocalizedIsoDay(movement.date, language)}</span>
                  {movement.note && <span className="movement-note">{movement.note}</span>}
                </div>

                {/* A realization's entry is not this page's to remove: it was written with the
                    animal's realization record and goes back with it, so removing it here would
                    raise the head count while the animal stayed realized. */}
                {movement.source !== 'Realization' && (
                  <CardMenu
                    onDelete={() =>
                      setConfirmDelete({
                        id: movement.id,
                        label: `${movement.delta > 0 ? '+' : ''}${movement.delta} · ${t(SOURCE_LABEL_KEY[movement.source])}`,
                      })
                    }
                  />
                )}
              </div>
            ))}
          </div>

          <p className="limit-hint">
            {t('livestockMovement.total')}: {total}
          </p>
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)}>
        <h2 className="form-title">{t('livestockMovement.add')}</h2>

        <div className="modal-form-grid">
          <div className="field">
            <label>{t('livestockMovement.quantity')}</label>
            <input
              type="number"
              min={1}
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
            />
          </div>

          <div className="field">
            <label>{t('livestockMovement.source')}</label>
            <select value={source} onChange={(e) => setSource(e.target.value as LivestockMovementSource)}>
              {LIVESTOCK_MOVEMENT_SOURCES.map((option) => (
                <option key={option} value={option}>
                  {t(SOURCE_LABEL_KEY[option])}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>{t('livestockMovement.date')}</label>
            <DateField value={date} onChange={(value) => setDate(value ?? '')} clearable={false} />
          </div>

          <div className="field">
            <label>{t('livestockMovement.note')}</label>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('livestockMovement.notePlaceholder')}
            />
          </div>

          {formError && <div className="error-banner field-full">{formError}</div>}
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>
            {t('common.cancel')}
          </button>
          <button type="button" className="btn" onClick={handleSubmit} disabled={saving}>
            {t('common.add')}
          </button>
        </div>
      </Modal>

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteMovement}
      />
    </div>
  );
}
