import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/history-columns.css';
import { AnimalProductionTotals } from '@/components/farm/livestock/animal-production-totals';
import { AnimalProductionView } from '@/components/farm/livestock/animal-production-view';
import { MedicalRecordsView } from '@/components/farm/livestock/medical-records-view';
import { StockFeedRow } from '@/components/farm/livestock/stock-feed-row';
import { StockHistoryView } from '@/components/farm/livestock/stock-history-view';
import './animal-history-page.css';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import { getLivestockDetailItem } from '@/services/livestock-detail-service';
import type { LivestockDetail } from '@/types/livestock-detail';

export function AnimalHistoryPage() {
  const { t } = useLanguage();
  const { livestockId: livestockIdParam, stockId: stockIdParam } = useParams<{ livestockId: string; stockId: string }>();
  const livestockId = Number(livestockIdParam);
  const stockId = Number(stockIdParam);

  const [detail, setDetail] = useState<LivestockDetail | null>(null);
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
      setDetail(await getLivestockDetailItem(stockId));
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
              {detail.imagePath ? (
                <img src={resolveAssetUrl(detail.imagePath)} alt="" className="history-hero-image" />
              ) : (
                <div className="history-hero-placeholder" />
              )}

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

            <div className="history-column animal-history-wide-column">
              <h2 className="history-column-title">{t('history.productionTab')}</h2>
              <AnimalProductionView target="animal" animalId={stockId} />
            </div>
            <div className="history-column animal-history-wide-column">
              <h2 className="history-column-title">{t('history.medicalTab')}</h2>
              <MedicalRecordsView stockId={stockId} />
            </div>
          </div>

          <AnimalProductionTotals animalId={stockId} />
        </>
      )}
    </div>
  );
}
