import { FilterIcon } from '@/components/icons/misc-icons';
import { DateField } from '@/components/ui/date-field';
import { HARVEST_STATUS_LABEL_KEY } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { GreenhouseHarvestFilters as Filters } from '@/types/greenhouse-harvest';
import type { HarvestStatus } from '@/types/harvest';

const STATUS_OPTIONS: HarvestStatus[] = ['Planning', 'Planting', 'Harvested'];

type Props = {
  open: boolean;
  onToggleOpen: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
};

/**
 * The toolbar above a greenhouse's harvest list and the panel it opens: which stage a harvest is
 * at, and the window its date falls in. The server applies these before it caps the list, so they
 * reach past the ten rows shown — which is what makes an older harvest findable at all.
 */
export function GreenhouseHarvestFilters({ open, onToggleOpen, filters, onChange }: Props) {
  const { t } = useLanguage();

  const isFiltered = filters.status != null || filters.from != null || filters.to != null;

  return (
    <>
      <div className="production-toolbar">
        {isFiltered && (
          <button
            type="button"
            className="kind-chip"
            onClick={() => onChange({ status: null, from: null, to: null })}
          >
            <span>{t('report.filterAll')}</span>
          </button>
        )}
        <button
          type="button"
          className={open ? 'filter-toggle active' : 'filter-toggle'}
          onClick={onToggleOpen}
          aria-label={t('report.filtersLabel')}
        >
          <FilterIcon width={18} height={18} />
        </button>
      </div>

      {open && (
        <div className="report-filter-panel">
          <div className="report-filter-section-label">{t('harvest.statusLabel')}</div>
          <div className="filter-row">
            <button
              type="button"
              className={filters.status == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onChange({ ...filters, status: null })}
            >
              <span>{t('report.filterAll')}</span>
            </button>
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                type="button"
                className={filters.status === status ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onChange({ ...filters, status })}
              >
                <span>{t(HARVEST_STATUS_LABEL_KEY[status])}</span>
              </button>
            ))}
          </div>

          {/* Both ends are optional: one alone reads as "since" or "up to". */}
          <div className="report-custom-range-row">
            <div className="field">
              <label>{t('report.fromDate')}</label>
              <DateField value={filters.from} onChange={(from) => onChange({ ...filters, from })} />
            </div>
            <div className="field">
              <label>{t('report.toDate')}</label>
              <DateField value={filters.to} onChange={(to) => onChange({ ...filters, to })} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
