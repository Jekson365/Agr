import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import '@/components/farm/kind-picker.css';
import '@/pages/report-page.css';
import { useLanguage } from '@/contexts/language-context';
import type { PurchaseItemKind } from '@/types/purchase';
import { EMPTY_FILTERS, hasActiveFilters, type PurchaseFilters } from './purchase-filters';
import { PURCHASE_KIND_LABEL_KEY, PURCHASE_KIND_ORDER } from './purchase-targets';

type Props = {
  filters: PurchaseFilters;
  /** Only the categories the documents actually cover, so no chip can empty the table by itself. */
  kinds: Set<PurchaseItemKind>;
  onChange: (filters: PurchaseFilters) => void;
};

export function PurchaseFilterPanel({ filters, kinds, onChange }: Props) {
  const { t } = useLanguage();

  const offered = PURCHASE_KIND_ORDER.filter((kind) => kinds.has(kind));

  return (
    <div className="report-filter-panel">
      <div className="report-filter-section-label">{t('purchase.filterPeriod')}</div>
      <div className="report-custom-range-row">
        <div className="field">
          <label>{t('report.fromDate')}</label>
          <DateField value={filters.from} max={todayIsoDate()} onChange={(from) => onChange({ ...filters, from })} />
        </div>
        <div className="field">
          <label>{t('report.toDate')}</label>
          <DateField value={filters.to} max={todayIsoDate()} onChange={(to) => onChange({ ...filters, to })} />
        </div>
      </div>

      <div className="report-filter-section-label">{t('purchase.filterKind')}</div>
      <div className="filter-row">
        <button
          type="button"
          className={filters.kind === 'all' ? 'kind-chip active' : 'kind-chip'}
          onClick={() => onChange({ ...filters, kind: 'all' })}
        >
          <span>{t('report.filterAll')}</span>
        </button>
        {offered.map((kind) => (
          <button
            key={kind}
            type="button"
            className={filters.kind === kind ? 'kind-chip active' : 'kind-chip'}
            onClick={() => onChange({ ...filters, kind })}
          >
            <span>{t(PURCHASE_KIND_LABEL_KEY[kind])}</span>
          </button>
        ))}
      </div>

      {hasActiveFilters(filters) && (
        <button
          type="button"
          className="btn btn-secondary purchase-filter-clear"
          onClick={() => onChange({ ...EMPTY_FILTERS, search: filters.search })}
        >
          {t('purchase.filterClear')}
        </button>
      )}
    </div>
  );
}
