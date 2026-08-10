import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/history-columns.css';
import { AnimalFamilyTree } from '@/components/farm/livestock/animal-family-tree';
import { AnimalProductionTotals } from '@/components/farm/livestock/animal-production-totals';
import { AnimalProductionView } from '@/components/farm/livestock/animal-production/animal-production-view';
import { MedicalRecordsView } from '@/components/farm/livestock/medical-records/medical-records-view';
import { StockFeedRow } from '@/components/farm/livestock/stock-feed-row';
import { StockHistoryView } from '@/components/farm/livestock/stock-history-view';
import './animal-history-page.css';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import {
  getAllLivestockDetails,
  getLivestockDetailItem,
  updateLivestockDetail,
  uploadLivestockDetailImage,
} from '@/services/livestock-detail-service';
import { getLivestock } from '@/services/livestock-service';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';

/**
 * One of the wide columns, with its heading as the fold. The body is hidden rather than unmounted,
 * so what it holds — filters, a half-typed form, records already fetched — is still there on the
 * way back, and folding costs nothing to undo.
 */
function FoldableColumn({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);

  return (
    <div className={open ? 'history-column animal-history-wide-column' : 'history-column animal-history-wide-column folded'}>
      <button
        type="button"
        className="history-column-title history-column-fold"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        {title}
        <span className="history-column-chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      <div className={open ? 'history-column-body' : 'history-column-body folded'}>{children}</div>
    </div>
  );
}

/**
 * The animal's photo, and the one place it can be replaced without going back to the group's list
 * to open the edit form. The file is uploaded before the animal is saved, so an upload that fails
 * leaves the record still pointing at the picture it already had.
 */
function AnimalHeroImage({
  detail,
  onChanged,
}: {
  detail: LivestockDetail;
  onChanged: (detail: LivestockDetail) => void;
}) {
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeImage(file: File) {
    setSaving(true);
    setError(null);
    try {
      const imagePath = await uploadLivestockDetailImage(file);
      const updated: LivestockDetail = { ...detail, imagePath };
      await updateLivestockDetail(updated.id, updated);
      onChanged(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('farm.saveError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="history-hero">
      <div className="history-hero-frame">
        {detail.imagePath ? (
          <img src={resolveAssetUrl(detail.imagePath)} alt="" className="history-hero-image" />
        ) : (
          <div className="history-hero-placeholder" />
        )}

        <label className={saving ? 'history-hero-button disabled' : 'history-hero-button'}>
          {saving ? `${t('farm.changeImage')}…` : detail.imagePath ? t('farm.changeImage') : t('farm.chooseImage')}
          <input
            type="file"
            accept="image/*"
            disabled={saving}
            onChange={(e) => {
              const file = e.target.files?.[0];
              // Cleared straight away, so picking the same file twice still counts as a change.
              e.target.value = '';
              if (file) void changeImage(file);
            }}
          />
        </label>
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}

export function AnimalHistoryPage() {
  const { t } = useLanguage();
  const { livestockId: livestockIdParam, stockId: stockIdParam } = useParams<{ livestockId: string; stockId: string }>();
  const livestockId = Number(livestockIdParam);
  const stockId = Number(stockIdParam);

  const [detail, setDetail] = useState<LivestockDetail | null>(null);
  /** Everything the family tree is drawn from: every animal on the farm, and the groups they sit
   *  in for their kind's artwork and name. */
  const [allAnimals, setAllAnimals] = useState<LivestockDetail[]>([]);
  const [groups, setGroups] = useState<Livestock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [item, everyAnimal, groupList] = await Promise.all([
        getLivestockDetailItem(stockId),
        // Best effort: without these the tree cannot be drawn, but the rest of the page is worth
        // showing regardless.
        getAllLivestockDetails().catch(() => [] as LivestockDetail[]),
        getLivestock().catch(() => [] as Livestock[]),
      ]);
      setDetail(item);
      setAllAnimals(everyAnimal);
      setGroups(groupList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link to={`/farm/livestock/${livestockId}`} className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{detail?.code ?? t('history.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error || !detail ? (
        <div className="state-box">
          <span>{t('livestockDetail.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <>
          <div className="history-columns">
            <div className="animal-history-sidebar">
              <AnimalHeroImage detail={detail} onChanged={setDetail} />

              {/* What the animal's group is fed — group-scoped, same as on mobile. */}
              <div className="history-column">
                <h2 className="history-column-title">{t('feed.title')}</h2>
                <StockFeedRow livestockId={livestockId} />
              </div>

              <div className="history-column">
                <h2 className="history-column-title">{t('history.weightTab')}</h2>
                <StockHistoryView stockId={stockId} />
              </div>
            </div>

            {/* The two long grids fold away, so either one can have the page to itself. */}
            <FoldableColumn title={t('history.productionTab')}>
              <AnimalProductionView target="animal" animalId={stockId} livestockId={livestockId} />
            </FoldableColumn>
            <FoldableColumn title={t('history.medicalTab')}>
              <MedicalRecordsView stockId={stockId} />
            </FoldableColumn>
          </div>

          <AnimalProductionTotals animalId={stockId} />

          {/* Last on the page and full width: it is the one thing here that is about the animal's
              place among the others rather than about the animal itself. */}
          <AnimalFamilyTree animal={detail} all={allAnimals} groupsById={new Map(groups.map((g) => [g.id, g]))} />
        </>
      )}
    </div>
  );
}
