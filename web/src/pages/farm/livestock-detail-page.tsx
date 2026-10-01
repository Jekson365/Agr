import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { AnimalTile } from '@/components/farm/livestock/animal-tile';
import { LivestockRealizationModal } from '@/components/farm/livestock/animal-production/livestock-realization-modal';
import { LivestockDetailFormModal } from '@/components/farm/livestock/livestock-detail-form-modal';
import { StockFeedRow } from '@/components/farm/livestock/stock-feed-row';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
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

  function closedRank(detail: LivestockDetail): number {
    if (detail.marketOrderId != null) return 2;
    return realizedIds.has(detail.id) ? 1 : 0;
  }

  const sortedDetails = [...details].sort((a, b) => closedRank(a) - closedRank(b));

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
          {sortedDetails.map((detail) => (
            <AnimalTile
              key={detail.id}
              detail={detail}
              livestock={livestock}
              realized={realizedIds.has(detail.id)}
              onEdit={openEdit}
              onRealize={setRealizationFor}
            />
          ))}
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
