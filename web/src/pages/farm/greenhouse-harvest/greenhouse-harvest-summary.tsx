import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { daysUntilExpected, isOverdue, type HarvestEconomics } from '@/config/harvest-analysis';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { GreenhouseHarvest } from '@/types/greenhouse-harvest';
import type { HarvestStatus } from '@/types/harvest';
import { round2 } from './greenhouse-harvest-lookups';

type Props = {
  harvest: GreenhouseHarvest;
  greenhouseName: string | null;
  economics: HarvestEconomics | null;
  /** The unit every recorded result shares, for the per-unit figures. Empty when they differ. */
  unitLabel: string;
  statusSaving: boolean;
  statusError: string | null;
  onRequestStatusChange: (status: HarvestStatus) => void;
  onOpenExpenses: () => void;
};

/** The harvest at a glance: when it is due, where it is, what it came to, and the status control
 * that decides whether any of it counts. */
export function GreenhouseHarvestSummary({
  harvest,
  greenhouseName,
  economics,
  unitLabel,
  statusSaving,
  statusError,
  onRequestStatusChange,
  onOpenExpenses,
}: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const overdue = isOverdue(harvest);
  const daysLeft = daysUntilExpected(harvest);
  const revenue = economics?.revenue ?? 0;
  const totalExpenses = economics?.totalExpenses ?? 0;
  const netTotal = economics?.net ?? 0;

  return (
    <div className="harvest-info-block">
      <p className="limit-hint">
        {t('harvest.date')}: {formatLocalizedIsoDate(harvest.date, language)}
      </p>
      {harvest.expectedHarvestDate && (
        <p className="limit-hint">
          {t('harvest.expectedDate')}: {formatLocalizedIsoDate(harvest.expectedHarvestDate, language)}
          {overdue ? (
            <span className="harvest-overdue-badge">{t('harvest.overdueBy', { days: Math.abs(daysLeft ?? 0) })}</span>
          ) : harvest.status !== 'Harvested' && daysLeft != null ? (
            <span className="harvest-due-hint">{t('harvest.dueIn', { days: daysLeft })}</span>
          ) : null}
        </p>
      )}
      {greenhouseName && (
        <p className="limit-hint">
          {t('farm.greenhouse')}: {greenhouseName}
        </p>
      )}

      {economics && (revenue > 0 || totalExpenses > 0 || economics.totalYield > 0) && (
        <div className="harvest-kpi-grid">
          {economics.totalYield > 0 && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.kpiTotalYield')}</span>
              <span className="harvest-kpi-value">
                {economics.unit ? `${round2(economics.totalYield)} ${unitLabel}` : t('harvest.kpiMixedUnits')}
              </span>
            </div>
          )}
          {revenue > 0 && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.revenueLabel')}</span>
              <span className="harvest-kpi-value">{formatPrice(revenue)}</span>
            </div>
          )}
          {totalExpenses > 0 && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.expensesTotal')}</span>
              <span className="harvest-kpi-value">{formatPrice(totalExpenses)}</span>
            </div>
          )}
          {(revenue > 0 || totalExpenses > 0) && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.netTotal')}</span>
              <span className={netTotal < 0 ? 'harvest-kpi-value negative' : 'harvest-kpi-value positive'}>
                {formatPrice(netTotal)}
              </span>
            </div>
          )}
          {economics.costPerUnit != null && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.kpiCostPerUnit', { unit: unitLabel })}</span>
              <span className="harvest-kpi-value">{formatPrice(economics.costPerUnit)}</span>
            </div>
          )}
          {economics.revenuePerUnit != null && (
            <div className="harvest-kpi">
              <span className="harvest-kpi-label">{t('harvest.kpiRevenuePerUnit', { unit: unitLabel })}</span>
              <span className="harvest-kpi-value">{formatPrice(economics.revenuePerUnit)}</span>
            </div>
          )}
        </div>
      )}

      {economics && economics.unit == null && economics.totalYield > 0 && (
        <p className="limit-hint">{t('harvest.kpiMixedUnitsHint')}</p>
      )}

      <div className="field">
        <label>{t('harvest.statusLabel')}</label>
        <div className="kind-row">
          {HARVEST_STATUSES.map((option) => (
            <button
              key={option}
              type="button"
              disabled={statusSaving}
              className={harvest.status === option ? 'kind-chip active' : 'kind-chip'}
              onClick={() => onRequestStatusChange(option)}
            >
              <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
            </button>
          ))}
          {harvest.status === 'Harvested' && (
            <button
              type="button"
              className="harvest-expenses-button"
              onClick={onOpenExpenses}
              aria-label={t('harvest.expensesTitle')}
            >
              $
            </button>
          )}
        </div>
        {statusError && <div className="error-banner">{statusError}</div>}
      </div>
    </div>
  );
}
