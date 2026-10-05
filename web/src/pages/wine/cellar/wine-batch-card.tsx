import { Link } from 'react-router-dom';

import qvevriIcon from '@/assets/icons/qvevri.svg';
import { CardMenu } from '@/components/farm/card-menu';
import { ChevronRightIcon } from '@/components/icons/misc-icons';
import { round2, WINE_STAGE_LABEL_KEY, wineBatchPath } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import type { WineBatchSummary } from '@/types/wine';

type Props = {
  batch: WineBatchSummary;
  onEdit: () => void;
  onDelete: () => void;
};

export function WineBatchCard({ batch, onEdit, onDelete }: Props) {
  const { t } = useLanguage();
  const path = wineBatchPath(batch.id);
  const readings = [
    batch.latestSugar != null ? `${t('wine.sugarShort')} ${batch.latestSugar}%` : null,
    batch.latestAlcohol != null ? `${t('wine.alcoholShort')} ${batch.latestAlcohol}%` : null,
  ].filter((part): part is string => part != null);

  return (
    <div className="entity-tile wine-card">
      <Link to={path} className="entity-tile-media">
        <img src={qvevriIcon} alt="" className="entity-tile-icon" />
        <span className={`wine-stage-badge is-${batch.stage.toLowerCase()}`}>
          {t(WINE_STAGE_LABEL_KEY[batch.stage])}
        </span>
      </Link>

      <div className="entity-tile-menu">
        <CardMenu onEdit={onEdit} onDelete={onDelete} />
      </div>

      <div className="entity-tile-body">
        <h2 className="entity-tile-title">{batch.name}</h2>

        <div className="entity-tile-meta">
          <div className="entity-tile-row">
            <span>{batch.vintage}</span>
          </div>
        </div>

        <div className="wine-card-figures">
          <span>
            <strong>{round2(batch.liters)}</strong> {t('wine.unitLiter')}
          </span>
          {batch.bottles > 0 && (
            <span>
              <strong>{batch.bottles}</strong> {t('wine.unitBottle')}
            </span>
          )}
        </div>

        {readings.length > 0 && <span className="wine-card-reading">{readings.join(' · ')}</span>}

        <span className="entity-tile-divider" />

        <Link to={path} className="entity-tile-details">
          {t('common.details')}
          <ChevronRightIcon width={16} height={16} />
        </Link>
      </div>
    </div>
  );
}
