import { Link } from 'react-router-dom';

import { CardMenu } from '@/components/farm/card-menu';
import { ChevronRightIcon, LocationIcon, PawIcon } from '@/components/icons/misc-icons';
import { livestockImage } from '@/config/livestock-kinds';
import { useLanguage } from '@/contexts/language-context';
import type { Livestock } from '@/types/livestock';

type Props = {
  item: Livestock;
  farmName?: string;
  onEdit: () => void;
  onDelete: () => void;
};

export function LivestockTile({ item, farmName, onEdit, onDelete }: Props) {
  const { t } = useLanguage();
  const icon = <img src={livestockImage(item.type)} alt="" className="entity-tile-icon" />;

  return (
    <div className={item.isDeleted ? 'entity-tile is-removed' : 'entity-tile'}>
      {item.isDeleted ? (
        <div className="entity-tile-media">{icon}</div>
      ) : (
        <Link to={`/farm/livestock/${item.id}`} className="entity-tile-media">
          {icon}
        </Link>
      )}

      {!item.isDeleted && (
        <div className="entity-tile-menu">
          <CardMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
      )}

      <div className="entity-tile-body">
        <h2 className="entity-tile-title">
          {item.name}
          {item.isDeleted && <span className="removed-chip">{t('balance.removed')}</span>}
        </h2>

        <div className="entity-tile-meta">
          <div className="entity-tile-row">
            <PawIcon width={16} height={16} />
            <span>
              {t('farm.count')}: {item.count}
            </span>
          </div>
          {farmName && (
            <div className="entity-tile-row">
              <LocationIcon width={16} height={16} />
              <span>
                {t('farm.farm')}: {farmName}
              </span>
            </div>
          )}
        </div>

        {!item.isDeleted && (
          <>
            <span className="entity-tile-divider" />

            <div className="entity-tile-actions">
              <div className="entity-tile-actions-row">
                <Link to={`/farm/livestock/${item.id}/production`} className="entity-tile-details">
                  {t('production.title')}
                </Link>
                <Link to={`/farm/livestock/${item.id}/breeding`} className="entity-tile-details breeding">
                  {t('farm.breeding')}
                </Link>
              </div>
              <Link to={`/farm/livestock/${item.id}/movement`} className="entity-tile-details secondary">
                {t('livestockMovement.title')}
              </Link>
              <Link to={`/farm/livestock/${item.id}`} className="entity-tile-details secondary">
                {t('farm.individualAnimals')}
                <ChevronRightIcon width={16} height={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
