import { useMemo } from 'react';

import { BarChart } from '@/components/charts/bar-chart';
import '@/components/farm/kind-picker.css';
import '@/components/farm/search-filter.css';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { MarketSalesSummary, SalesPeriod } from '@/types/market-sale';
import { bucketLabel, bucketTooltip } from './sales-labels';

const PERIOD_OPTIONS: { value: SalesPeriod; labelKey: string }[] = [
  { value: 'Week', labelKey: 'sales.periodWeek' },
  { value: 'Month', labelKey: 'sales.periodMonth' },
  { value: 'Year', labelKey: 'sales.periodYear' },
  { value: 'Custom', labelKey: 'sales.periodCustom' },
];

type Props = {
  summary: MarketSalesSummary | null;
  loading: boolean;
  period: SalesPeriod;
  onPeriodChange: (period: SalesPeriod) => void;
  from: string | null;
  to: string | null;
  onFromChange: (value: string | null) => void;
  onToChange: (value: string | null) => void;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
};

export function SalesChart({
  summary,
  loading,
  period,
  onPeriodChange,
  from,
  to,
  onFromChange,
  onToChange,
  selectedIndex,
  onSelect,
}: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const bars = useMemo(
    () =>
      (summary?.buckets ?? []).map((bucket) => ({
        label: bucketLabel(bucket.start, summary!.unit),
        tooltipLabel: bucketTooltip(bucket.start, summary!.unit, language),
        value: bucket.total,
      })),
    [summary, language]
  );

  const total = bars.reduce((sum, bar) => sum + bar.value, 0);

  return (
    <section className="sales-chart-panel">
      <div className="sales-chart-head">
        <div>
          <h2 className="sales-chart-title">{t('sales.chartTitle')}</h2>
          <p className="sales-chart-total">
            {t('sales.chartTotal')}: <strong>{formatPrice(total)}</strong>
          </p>
        </div>

        <div className="filter-row sales-chart-filters">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={period === option.value ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onPeriodChange(option.value)}
            >
              <span>{t(option.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      {period === 'Custom' && (
        <div className="sales-chart-range">
          <div className="field">
            <label>{t('sales.fromDate')}</label>
            <DateField value={from} max={to ?? todayIsoDate()} onChange={onFromChange} />
          </div>
          <div className="field">
            <label>{t('sales.toDate')}</label>
            <DateField value={to} min={from ?? undefined} max={todayIsoDate()} onChange={onToChange} />
          </div>
        </div>
      )}

      <div className="sales-chart-body">
        {loading ? (
          <div className="sales-chart-empty">…</div>
        ) : total === 0 ? (
          <div className="sales-chart-empty">{t('sales.chartEmpty')}</div>
        ) : (
          <BarChart
            data={bars}
            formatValue={formatPrice}
            ariaLabel={t('sales.chartTitle')}
            onBarClick={onSelect}
            selectedIndex={selectedIndex}
          />
        )}
      </div>

      <p className="sales-chart-hint">{t('sales.chartHint')}</p>
    </section>
  );
}
