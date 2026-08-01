import { Link } from 'react-router-dom';

import { livestockImage } from '@/config/livestock-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { round2, type GroupRow } from './production-summary';
import { ShareCell } from './share-cell';

type Props = {
  rows: GroupRow[];
  totalValue: number;
};

/** What each livestock group collected. Rows link through to that group's own production page,
 * and carry a quantity per unit — milk in litres and eggs in pieces don't add up. */
export function LivestockBalanceTable({ rows, totalValue }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <>
      <div className="balance-section-title">{t('productionBalance.byLivestock')}</div>
      <div className="balance-rows balance-rows-group">
        <div className="balance-row balance-row-group balance-row-head">
          <span>{t('farm.livestock')}</span>
          <span className="num">{t('productionBalance.quantity')}</span>
          <span className="num">{t('productionBalance.records')}</span>
          <span className="num">{t('productionBalance.value')}</span>
          <span className="num">{t('productionBalance.share')}</span>
        </div>

        {rows.map((row) => (
          <Link key={row.id} to={`/farm/livestock/${row.id}/production`} className="balance-row balance-row-group">
            <span className="balance-cell strong balance-group-name">
              <img src={livestockImage(row.type)} alt="" />
              {row.name}
            </span>
            <span className="balance-cell num balance-quantities">
              {[...row.quantityByUnit.entries()].map(([unit, quantity]) => (
                <span key={unit} className="balance-quantity">
                  {round2(quantity)} <span className="balance-unit">{unit}</span>
                </span>
              ))}
            </span>
            <span className="balance-cell num muted">{row.records}</span>
            <span className="balance-cell num value">{formatPrice(round2(row.value))}</span>
            <ShareCell value={row.value} total={totalValue} />
          </Link>
        ))}
      </div>
    </>
  );
}
