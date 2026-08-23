import { Link } from 'react-router-dom';

import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { cropLabel } from '@/config/crop';
import { daysUntilExpected, isOverdue } from '@/config/harvest-analysis';
import { useLanguage } from '@/contexts/language-context';
import type { Farm } from '@/types/farm';
import type { Harvest } from '@/types/harvest';
import type { LandPlot } from '@/types/land-plot';
import './harvest-detail.css';

type Props = {
  harvest: Harvest;
  farm: Farm | null;
  plot: LandPlot | null;
};

/** The harvest's name and the three facts about it — when, where, and whether it is late — each
 *  labelled, so none has to be inferred from its position. */
export function HarvestDetailHeader({ harvest, farm, plot }: Props) {
  const { t, language } = useLanguage();

  const overdue = isOverdue(harvest);
  const daysLeft = daysUntilExpected(harvest);

  return (
    <>
      <Link to="/harvest" className="hd-back">
        ← {t('harvest.title')}
      </Link>

      <h1 className="hd-title">{harvest.title}</h1>

      <div className="hd-facts">
        <span className="hd-fact">
          {t('harvest.date')}: <strong>{formatLocalizedIsoDate(harvest.date, language)}</strong>
        </span>

        {harvest.expectedHarvestDate && (
          <span className="hd-fact">
            {t('harvest.expectedDate')}: <strong>{formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}</strong>{' '}
            {overdue ? (
              <span className="hd-fact-warn">{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</span>
            ) : harvest.status !== 'Harvested' && daysLeft != null ? (
              <span>{t('harvest.dueIn', { days: daysLeft })}</span>
            ) : null}
          </span>
        )}

        {farm && (
          <span className="hd-fact">
            {t('harvest.landLabel')}:{' '}
            <strong>
              {farm.name}
              {plot ? ` · ${cropLabel(plot.crop, t)} (${plot.area} ${t('farm.areaUnit')})` : ''}
            </strong>
          </span>
        )}
      </div>
    </>
  );
}
