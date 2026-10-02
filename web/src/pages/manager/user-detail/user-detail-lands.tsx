import { cropImage, cropLabel } from '@/config/crop';
import { useLanguage } from '@/contexts/language-context';
import { resolveAssetUrl } from '@/services/api-client';
import type { AdminFarm } from '@/types/admin';
import { formatAmount } from './user-detail-format';
import './user-detail-items.css';

type Props = {
  farms: AdminFarm[];
};

export function UserDetailLands({ farms }: Props) {
  const { t } = useLanguage();
  const live = farms.filter((farm) => !farm.isRemoved).length;

  return (
    <section className="user-detail-card">
      <h2 className="user-detail-title">
        {t('managerUser.lands')}
        <span className="user-detail-count">{live}</span>
      </h2>

      {farms.length === 0 ? (
        <p className="user-detail-empty">{t('managerUser.empty')}</p>
      ) : (
        <div className="user-detail-farms">
          {farms.map((farm) => (
            <article key={farm.id} className={farm.isRemoved ? 'user-detail-farm removed' : 'user-detail-farm'}>
              <div className="user-detail-farm-head">
                {farm.imagePath && <img className="user-detail-farm-image" src={resolveAssetUrl(farm.imagePath)} alt="" />}
                <div className="user-detail-item-text">
                  <span className="user-detail-item-title">{farm.name || `#${farm.id}`}</span>
                  <span className="manager-user-sub">
                    {[`${formatAmount(farm.area)} ${t('farm.areaUnit')}`, farm.location].filter(Boolean).join(' · ')}
                  </span>
                </div>
                {farm.isRemoved && <span className="user-detail-removed">{t('managerUser.removed')}</span>}
              </div>

              {farm.plots.length === 0 ? (
                <p className="user-detail-empty">{t('managerUser.noPlots')}</p>
              ) : (
                <ul className="user-detail-plots">
                  {farm.plots.map((plot) => (
                    <li key={plot.id} className="user-detail-plot">
                      <img className="user-detail-icon small" src={cropImage(plot.crop)} alt="" />
                      <span className="user-detail-plot-crop">
                        {plot.crop ? cropLabel(plot.crop, t) : t('managerUser.emptyPlot')}
                      </span>
                      <span className="user-detail-item-value">
                        {formatAmount(plot.area)} {t('farm.areaUnit')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
