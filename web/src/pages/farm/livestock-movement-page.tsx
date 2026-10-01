import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ConfirmDeleteModal } from '@/components/farm/confirm-delete-modal';
import '@/components/farm/farm-crud.css';
import '@/components/farm/livestock/breeding/breeding.css';
import { MovementFormModal } from '@/components/farm/livestock/movement-form-modal';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import {
  LIVESTOCK_MOVEMENT_SOURCE_LABEL_KEY as SOURCE_LABEL_KEY,
  LOCKED_MOVEMENT_SOURCES,
} from '@/config/livestock-movement';
import { useLanguage } from '@/contexts/language-context';
import { getLivestockItem } from '@/services/livestock-service';
import { deleteLivestockMovement, getLivestockMovements } from '@/services/livestock-movement-service';
import type { Livestock } from '@/types/livestock';
import type { LivestockMovement } from '@/types/livestock-movement';
import './livestock-movement-page.css';

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
        <button type="button" className="add-button" onClick={() => setFormOpen(true)} disabled={loading}>
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
                {!LOCKED_MOVEMENT_SOURCES.includes(movement.source) && (
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

      <MovementFormModal
        open={formOpen}
        livestockId={livestockId}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <ConfirmDeleteModal
        open={!!confirmDelete}
        name={confirmDelete?.label ?? ''}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteMovement}
      />
    </div>
  );
}
