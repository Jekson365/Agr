import { useParams } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { useLanguage } from '@/contexts/language-context';
import { HarvestDetailBody } from './detail/harvest-detail-body';
import { HarvestDetailHeader } from './detail/harvest-detail-header';
import { useHarvestDetail } from './detail/use-harvest-detail';
import './detail/harvest-detail.css';

export function HarvestDetailPage() {
  const { t } = useLanguage();
  const { id: idParam } = useParams<{ id: string }>();
  const harvestId = Number(idParam);

  const detail = useHarvestDetail(harvestId);
  const { harvest } = detail;

  if (detail.loading) return <div className="state-box">…</div>;

  if (detail.error || !harvest) {
    return (
      <div className="state-box">
        <span>{t('harvestItem.loadError')}</span>
        <button type="button" className="retry-button" onClick={detail.load}>
          {t('common.retry')}
        </button>
      </div>
    );
  }

  return (
    <div>
      <HarvestDetailHeader harvest={harvest} farm={detail.farm} plot={detail.plot} />
      <HarvestDetailBody harvestId={harvestId} harvest={harvest} detail={detail} nav="rail" />
    </div>
  );
}
