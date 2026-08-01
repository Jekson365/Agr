import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { AnimalProductionView } from '@/components/farm/livestock/animal-production/animal-production-view';
import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';
import { getLivestockItem } from '@/services/livestock-service';
import type { Livestock } from '@/types/livestock';

export function LivestockProductionPage() {
  const { t } = useLanguage();
  const { livestockId: livestockIdParam } = useParams<{ livestockId: string }>();
  const livestockId = Number(livestockIdParam);

  const [livestock, setLivestock] = useState<Livestock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!livestockId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livestockId]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setLivestock(await getLivestockItem(livestockId));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">
          {t('production.title')}
          {livestock ? ` · ${livestock.name}` : ''}
        </h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error || !livestock ? (
        <div className="state-box">
          <span>{t('production.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <AnimalProductionView target="livestock" livestockId={livestockId} animalCount={livestock.count} />
      )}
    </div>
  );
}
