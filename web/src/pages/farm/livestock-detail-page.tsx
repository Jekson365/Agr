import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import '@/components/farm/farm-crud.css';
import { LivestockRealizationModal } from '@/components/farm/livestock/animal-production/livestock-realization-modal';
import { LivestockDetailFormModal } from '@/components/farm/livestock/livestock-detail-form-modal';
import { StockFeedRow } from '@/components/farm/livestock/stock-feed-row';
import { CalendarIcon, ChevronRightIcon, PawIcon } from '@/components/icons/misc-icons';
import { formatAge } from '@/config/age';
import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { resolveAssetUrl } from '@/services/api-client';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestockItem } from '@/services/livestock-service';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';

export function LivestockDetailPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const livestockId = Number(idParam);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [details, setDetails] = useState<LivestockDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingDetail, setEditingDetail] = useState<LivestockDetail | null>(null);
  /** The animal whose realization window is open, or null. One window for the page, opened from
   *  whichever card asked for it. */
  const [realizationFor, setRealizationFor] = useState<LivestockDetail | null>(null);
  /**
   * The animals of this group that have been realized. Read from the records rather than held on
   * the animal: a realization record is what marks one, so removing it takes the mark off again
   * without anything having to be kept in step.
   */
  const [realizedIds, setRealizedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!livestockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [livestockItem, detailList] = await Promise.all([
        getLivestockItem(livestockId),
        getLivestockDetails(livestockId),
      ]);
      setLivestock(livestockItem);
      setDetails(detailList);
      await loadRealized();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /** Which animals carry a realization record. Best effort: an animal wrongly shown as still on
   *  the farm is better than a list that won't render, and the server refuses a second
   *  realization — or an edit of a realized animal — either way. */
  async function loadRealized() {
    try {
      const productions = await getAllAnimalProductions();
      setRealizedIds(
        new Set(productions.filter((p) => p.isRealization && p.animalId != null).map((p) => p.animalId as number))
      );
    } catch {
      // Left as it was.
    }
  }

  function openAdd() {
    setEditingDetail(null);
    setFormOpen(true);
  }

  function openEdit(detail: LivestockDetail) {
    setEditingDetail(detail);
    setFormOpen(true);
  }

  function handleSaved(detail: LivestockDetail, isNew: boolean) {
    setDetails((prev) => (isNew ? [...prev, detail] : prev.map((d) => (d.id === detail.id ? detail : d))));
  }


  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{livestock?.name ?? t('farm.livestock')}</h1>
        <button type="button" className="add-button" onClick={openAdd} disabled={loading}>
          + {t('livestockDetail.add')}
        </button>
      </div>

      {/* Feed is tracked per group, so it lives on the group's page. */}
      {!loading && !error && (
        <>
          <p className="feed-section-title">{t('feed.title')}</p>
          <StockFeedRow livestockId={livestockId} />
        </>
      )}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('livestockDetail.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : details.length === 0 ? (
        <p className="empty-state">{t('livestockDetail.empty')}</p>
      ) : (
        <div className="entity-tile-grid">
          {details.map((detail) => {
            const age = formatAge(detail.bornDate, t);
            const genderLabel = detail.gender ? t(detail.gender === 'Male' ? 'livestockDetail.male' : 'livestockDetail.female') : null;
            const animalHref = `/farm/livestock/${livestockId}/animal/${detail.id}`;
            // Realized: taken off the farm for its meat. Its record is closed — nothing to edit
            // and nothing further to add — so the card shows what it was and stops there.
            const realized = realizedIds.has(detail.id);
            const media = (
              <>
                {/* An animal's own photo fills the panel the way a land's does; the kind's
                    artwork is a flat mark, so it stays contained on the muted green. */}
                {detail.imagePath ? (
                  <img src={resolveAssetUrl(detail.imagePath)} alt="" className="entity-tile-photo" />
                ) : livestock ? (
                  <img src={livestockImage(livestock.type)} alt="" className="entity-tile-icon" />
                ) : null}
              </>
            );
            return (
              <div key={detail.id} className={realized ? 'entity-tile realized' : 'entity-tile'}>
                {realized ? (
                  <div className="entity-tile-media">{media}</div>
                ) : (
                  <Link to={animalHref} className="entity-tile-media">
                    {media}
                  </Link>
                )}

                <div className="entity-tile-menu">
                  {/* Edit only, and a realized animal keeps its record as it stands — so that one
                      has no menu at all. */}
                  <CardMenu onEdit={realized ? undefined : () => openEdit(detail)} />
                </div>

                <div className="entity-tile-body">
                  <h2 className="entity-tile-title">{detail.code}</h2>

                  {realized && (
                    <div className="entity-tile-badges">
                      <span className="entity-tile-realized">{t('production.realizedBadge')}</span>
                    </div>
                  )}

                  {(age || genderLabel) && (
                    <div className="entity-tile-meta">
                      {age && (
                        <div className="entity-tile-row">
                          <CalendarIcon width={16} height={16} />
                          <span>
                            {t('farm.age')}: {age}
                          </span>
                        </div>
                      )}
                      {genderLabel && (
                        <div className="entity-tile-row">
                          <PawIcon width={16} height={16} />
                          <span>{genderLabel}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <span className="entity-tile-divider" />

                  {/* A realized animal has neither: its details are closed, and it cannot be
                      realized twice. The line in their place says why the card ends here. */}
                  {realized ? (
                    <p className="limit-hint">{t('production.realizedBlocked')}</p>
                  ) : (
                    <div className="entity-tile-actions">
                      <Link to={animalHref} className="entity-tile-details">
                        {t('common.details')}
                        <ChevronRightIcon width={16} height={16} />
                      </Link>
                      {/* One animal at a time: a realization covers the animal whose card it was
                          started from, which is why it is offered per card and not once for the
                          herd. */}
                      <button
                        type="button"
                        className="entity-tile-details secondary"
                        onClick={() => setRealizationFor(detail)}
                      >
                        {t('production.realization')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <LivestockDetailFormModal
        open={formOpen}
        livestockId={livestockId}
        editingDetail={editingDetail}
        onClose={() => setFormOpen(false)}
        onSaved={handleSaved}
      />

      {/* Keyed by animal so the window starts fresh for each one it is opened from, rather than
          carrying the last animal's half-filled form. */}
      <LivestockRealizationModal
        key={realizationFor?.id ?? 'none'}
        open={realizationFor != null}
        animalId={realizationFor?.id ?? 0}
        livestockId={livestockId}
        onClose={() => setRealizationFor(null)}
        onSaved={loadRealized}
      />
    </div>
  );
}
