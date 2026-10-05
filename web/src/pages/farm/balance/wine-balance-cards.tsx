import { Link } from 'react-router-dom';

import qvevriIcon from '@/assets/icons/qvevri.svg';
import { round2, wineBatchPath } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import type { WineBatchSummary } from '@/types/wine';
import './balance-cards.css';
import './wine-balance.css';

type Props = {
  batches: WineBatchSummary[];
};

export function WineBalanceCards({ batches }: Props) {
  const { t } = useLanguage();
  const rows = batches.filter((batch) => !batch.isDeleted || batch.liters > 0 || batch.bottles > 0);

  if (rows.length === 0) {
    return <p className="balance-column-empty">{t('wine.wineBalanceEmpty')}</p>;
  }

  return (
    <section className="balance-cards">
      {rows.map((batch) => {
        const held = batch.liters > 0 || batch.bottles > 0;
        const cardClass = ['balance-card', held ? '' : 'is-empty', batch.isDeleted ? 'is-removed' : '']
          .filter(Boolean)
          .join(' ');
        return (
          <article key={batch.id} className={cardClass}>
            <div className="balance-card-head">
              <span className="balance-card-icon">
                <img src={qvevriIcon} alt="" />
              </span>
              <span className="balance-card-text">
                <Link to={wineBatchPath(batch.id)} className="balance-card-title wine-balance-link">
                  {batch.name}
                  {batch.isDeleted && <span className="balance-removed-chip">{t('balance.removed')}</span>}
                </Link>
                <span className="balance-card-kind">{batch.vintage}</span>
              </span>
            </div>

            <div className="balance-card-figure">
              <span className="balance-card-label">{t('wine.inCellar')}</span>
              <span className="balance-card-value">
                {round2(batch.liters)}
                <span className="balance-unit">{t('wine.unitLiter')}</span>
              </span>
            </div>

            <div className="balance-card-row">
              <span className="balance-card-label">{t('wine.unitBottle')}</span>
              <span className="balance-card-value">{batch.bottles}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}
