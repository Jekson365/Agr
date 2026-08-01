import { FilterIcon } from '@/components/icons/misc-icons';
import { DateField } from '@/components/ui/date-field';
import { todayIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { ProductionType } from '@/types/production-type';
import { productionTypeLabel } from './production-labels';
import { PERIOD_OPTIONS, QUARTER_OPTIONS, type Period } from './production-period';

type Props = {
  open: boolean;
  onToggleOpen: () => void;

  period: Period;
  onPeriodChange: (period: Period) => void;

  productionTypes: ProductionType[];
  typeFilter: number | null;
  onTypeFilterChange: (productionTypeId: number | null) => void;

  /** Group view only: the animals of this group that have records of their own. */
  animals: { id: number; code: string }[];
  animalFilter: number | null;
  onAnimalFilterChange: (animalId: number | null) => void;

  /** Group view only, and only once the group has individual records to merge in. Absent on a
   * single animal's page, where there is nothing to fold away. */
  singles?: { shown: boolean; onToggle: () => void };
};

/** The toolbar above the production table and the panel it opens: the date window, the product
 * type, and — on a group — which animal's records to show. */
export function ProductionFilters({
  open,
  onToggleOpen,
  period,
  onPeriodChange,
  productionTypes,
  typeFilter,
  onTypeFilterChange,
  animals,
  animalFilter,
  onAnimalFilterChange,
  singles,
}: Props) {
  const { t } = useLanguage();

  return (
    <>
      <div className="production-toolbar">
        {singles && (
          <button
            type="button"
            className={singles.shown ? 'kind-chip active' : 'kind-chip'}
            onClick={singles.onToggle}
          >
            <span>{singles.shown ? t('production.hideIndividual') : t('production.showIndividual')}</span>
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
          <div className="filter-row">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={period.mode === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onPeriodChange({ ...period, mode: opt.value })}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>

          {(period.mode === 'year' || period.mode === 'quarter') && (
            <div className="report-year-row">
              <button
                type="button"
                className="report-year-nav-button"
                onClick={() => onPeriodChange({ ...period, year: period.year - 1 })}
                aria-label="Previous year"
              >
                ‹
              </button>
              <span className="report-year-text">{period.year}</span>
              <button
                type="button"
                className="report-year-nav-button"
                onClick={() => onPeriodChange({ ...period, year: period.year + 1 })}
                aria-label="Next year"
              >
                ›
              </button>
            </div>
          )}

          {period.mode === 'quarter' && (
            <div className="filter-row">
              {QUARTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={period.quarter === opt.value ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => onPeriodChange({ ...period, quarter: opt.value })}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          )}

          {period.mode === 'custom' && (
            <div className="report-custom-range-row">
              <div className="field">
                <label>{t('report.fromDate')}</label>
                <DateField
                  value={period.from}
                  max={todayIsoDate()}
                  onChange={(from) => onPeriodChange({ ...period, from })}
                />
              </div>
              <div className="field">
                <label>{t('report.toDate')}</label>
                <DateField value={period.to} max={todayIsoDate()} onChange={(to) => onPeriodChange({ ...period, to })} />
              </div>
            </div>
          )}

          <div className="report-filter-section-label">{t('report.productTypeFilterLabel')}</div>
          <div className="filter-row">
            <button
              type="button"
              className={typeFilter == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onTypeFilterChange(null)}
            >
              <span>{t('report.filterAll')}</span>
            </button>
            {productionTypes.map((productionType) => (
              <button
                key={productionType.id}
                type="button"
                className={typeFilter === productionType.id ? 'kind-chip active' : 'kind-chip'}
                onClick={() => onTypeFilterChange(productionType.id)}
              >
                <span>{productionTypeLabel(productionType, t)}</span>
              </button>
            ))}
          </div>

          {singles?.shown && animals.length > 0 && (
            <>
              <div className="report-filter-section-label">{t('production.animalFilterLabel')}</div>
              <div className="filter-row">
                <button
                  type="button"
                  className={animalFilter == null ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => onAnimalFilterChange(null)}
                >
                  <span>{t('report.filterAll')}</span>
                </button>
                {animals.map((animal) => (
                  <button
                    key={animal.id}
                    type="button"
                    className={animalFilter === animal.id ? 'kind-chip active' : 'kind-chip'}
                    onClick={() => onAnimalFilterChange(animal.id)}
                  >
                    <span>{animal.code}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
