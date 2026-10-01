import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { CalendarIcon, ChevronRightIcon, PawIcon } from '@/components/icons/misc-icons';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { formatAge } from '@/config/age';
import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';

type Props = {
  detail: LivestockDetail;
  livestock: Livestock | null;
  realized: boolean;
  onEdit: (detail: LivestockDetail) => void;
  onRealize: (detail: LivestockDetail) => void;
};

export function AnimalTile({ detail, livestock, realized, onEdit, onRealize }: Props) {
  const { t, language } = useLanguage();

  const age = formatAge(detail.bornDate, t);
  const genderLabel = detail.gender
    ? t(detail.gender === 'Male' ? 'livestockDetail.male' : 'livestockDetail.female')
    : null;
  const animalHref = `/farm/livestock/${detail.livestockId}/animal/${detail.id}`;
  const sold = detail.marketOrderId != null;
  const closed = realized || sold;

  const closedHint = !sold
    ? t('production.realizedBlocked')
    : detail.soldOn
      ? t('livestockDetail.soldOn', { date: formatLocalizedIsoDay(detail.soldOn, language) })
      : t('livestockDetail.orderedHint');

  const media = detail.imagePath ? (
    <img src={resolveAssetUrl(detail.imagePath)} alt="" className="entity-tile-photo" />
  ) : livestock ? (
    <img src={livestockImage(livestock.type)} alt="" className="entity-tile-icon" />
  ) : null;

  return (
    <div className={sold ? 'entity-tile sold' : realized ? 'entity-tile realized' : 'entity-tile'}>
      {closed ? (
        <div className="entity-tile-media">{media}</div>
      ) : (
        <Link to={animalHref} className="entity-tile-media">
          {media}
        </Link>
      )}

      <div className="entity-tile-menu">
        <CardMenu onEdit={closed ? undefined : () => onEdit(detail)} />
      </div>

      <div className="entity-tile-body">
        <h2 className="entity-tile-title">{detail.code}</h2>

        {closed && (
          <div className="entity-tile-badges">
            {realized && <span className="entity-tile-realized">{t('production.realizedBadge')}</span>}
            {sold && (
              <span className="entity-tile-sold">{t(detail.soldOn ? 'sales.statusSold' : 'sales.statusOrdered')}</span>
            )}
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

        {closed ? (
          <p className="limit-hint">{closedHint}</p>
        ) : (
          <div className="entity-tile-actions">
            <Link to={animalHref} className="entity-tile-details">
              {t('common.details')}
              <ChevronRightIcon width={16} height={16} />
            </Link>
            <button type="button" className="entity-tile-details secondary" onClick={() => onRealize(detail)}>
              {t('production.realization')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
