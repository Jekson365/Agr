import { Link, useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import { getHarvest } from '@/services/harvest-service';
import { useEffect, useState } from 'react';
import type { Harvest } from '@/types/harvest';
import { GradingSection } from './grading-section';
import './harvest-grading.css';

export function HarvestGradingPage() {
  const { t, language } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const [harvest, setHarvest] = useState<Harvest | null>(null);

  useEffect(() => {
    if (!harvestId) return;
    let cancelled = false;
    getHarvest(harvestId)
      .then((row) => {
        if (!cancelled) setHarvest(row);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [harvestId]);

  return (
    <div className="hg-page">
      <Link to={`/harvest/detail/${harvestId}`} className="back-link">
        ← {harvest?.title ?? t('harvest.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('harvestGrading.title')}</h1>
        {harvest && <span className="hg-page-date">{formatLocalizedIsoDate(harvest.date, language)}</span>}
      </div>

      <GradingSection harvestId={harvestId} />
    </div>
  );
}
