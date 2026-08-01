import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { round2, type ProductRow } from './production-summary';
import { ShareCell } from './share-cell';

type Props = {
  rows: ProductRow[];
  totalValue: number;
  /** The record count for the total line — every record counts, including ones whose group is
   *  unknown and so appear in no by-livestock row. */
  recordCount: number;
};

/** What each product came to, one line per type-and-unit, closed by a total. */
export function ProductBalanceTable({ rows, totalValue, recordCount }: Props) {
  const { t } = useLanguage();
  const { formatPrice } = useCurrency();

  return (
    <>
      <div className="balance-section-title">{t('productionBalance.byProduct')}</div>
      <div className="balance-rows">
        <div className="balance-row balance-row-head">
          <span>{t('production.type')}</span>
          <span className="num">{t('productionBalance.quantity')}</span>
          <span className="num">{t('productionBalance.records')}</span>
          <span className="num">{t('productionBalance.value')}</span>
          <span className="num">{t('productionBalance.share')}</span>
        </div>

        {rows.map((row) => (
          <div key={row.key} className="balance-row">
            <span className="balance-cell strong">{row.typeLabel}</span>
            <span className="balance-cell num">
              {round2(row.quantity)} <span className="balance-unit">{row.unitLabel}</span>
            </span>
            <span className="balance-cell num muted">{row.records}</span>
            <span className="balance-cell num value">{formatPrice(round2(row.value))}</span>
            <ShareCell value={row.value} total={totalValue} />
          </div>
        ))}

        <div className="balance-row balance-row-total">
          <span className="balance-cell strong">{t('productionBalance.total')}</span>
          <span className="balance-cell num muted">—</span>
          <span className="balance-cell num">{recordCount}</span>
          <span className="balance-cell num value">{formatPrice(round2(totalValue))}</span>
          <span className="balance-cell num muted">{totalValue > 0 ? '100%' : '—'}</span>
        </div>
      </div>
    </>
  );
}
