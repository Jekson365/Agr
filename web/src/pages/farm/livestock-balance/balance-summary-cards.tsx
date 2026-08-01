import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { round2, type ProductionSummary } from './production-summary';

type Props = {
  summary: ProductionSummary;
  /** How many production records the totals were built from. */
  recordCount: number;
};

/** The headline figures: what the production came to, how much of it there is, and the span it
 * covers. The period card only appears once the records actually carry dates. */
export function BalanceSummaryCards({ summary, recordCount }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const hasDates = summary.earliest != null && summary.latest != null;

  return (
    <div className="balance-summary-grid">
      <div className="balance-summary-card">
        <span className="balance-summary-label">{t('productionBalance.totalValue')}</span>
        <span className="balance-summary-value green">{formatPrice(round2(summary.totalValue))}</span>
      </div>
      <div className="balance-summary-card">
        <span className="balance-summary-label">{t('productionBalance.recordCount')}</span>
        <span className="balance-summary-value">{recordCount}</span>
      </div>
      <div className="balance-summary-card">
        <span className="balance-summary-label">{t('productionBalance.typeCount')}</span>
        <span className="balance-summary-value">{summary.products.length}</span>
      </div>
      {hasDates && (
        <div className="balance-summary-card">
          <span className="balance-summary-label">{t('productionBalance.period')}</span>
          <span className="balance-summary-value small">
            {formatLocalizedIsoDate(summary.earliest, language, { year: false })} –{' '}
            {formatLocalizedIsoDate(summary.latest, language)}
          </span>
        </div>
      )}
    </div>
  );
}
