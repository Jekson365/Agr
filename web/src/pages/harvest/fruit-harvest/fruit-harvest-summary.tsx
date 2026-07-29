import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import type { Harvest } from '@/types/harvest';

type Props = {
  harvest: Harvest | null;
  /** Chemical applications are recorded separately but still count as expenses here. */
  chemicalTotal: number;
  statusSaving: boolean;
  onToggleHarvested: (next: boolean) => void;
  onOpenExpenses: () => void;
};

/**
 * When the harvest was picked, whether it counts as picked at all, and what it came to. The status
 * is two states only — an orchard isn't sown, so it's either harvested or it isn't.
 */
export function FruitHarvestSummary({ harvest, chemicalTotal, statusSaving, onToggleHarvested, onOpenExpenses }: Props) {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const isHarvested = harvest?.status === 'Harvested';
  const totalExpenses = harvest
    ? (harvest.equipmentCost ?? 0) + (harvest.workersCost ?? 0) + (harvest.fuelCost ?? 0) + (harvest.otherCost ?? 0) + chemicalTotal
    : 0;
  const revenue = harvest?.revenue ?? 0;
  const net = revenue - totalExpenses;

  return (
    <>
      <p className="limit-hint">{formatLocalizedIsoDay(harvest?.date, language)}</p>

      <div className="field harvest-section-label">
        <label>{t('harvest.statusLabel')}</label>
      </div>
      <div className="kind-row">
        <button
          type="button"
          className={!isHarvested ? 'kind-chip active' : 'kind-chip'}
          onClick={() => onToggleHarvested(false)}
          disabled={statusSaving}
        >
          <span>{t('fruitHarvest.notHarvested')}</span>
        </button>
        <button
          type="button"
          className={isHarvested ? 'kind-chip active' : 'kind-chip'}
          onClick={() => onToggleHarvested(true)}
          disabled={statusSaving}
        >
          <span>{t('fruitHarvest.harvested')}</span>
        </button>
        {isHarvested && (
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

      {isHarvested && (revenue > 0 || totalExpenses > 0) && (
        <div className="harvest-kpi-grid">
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
          <div className="harvest-kpi">
            <span className="harvest-kpi-label">{t('harvest.netTotal')}</span>
            <span className={net < 0 ? 'harvest-kpi-value negative' : 'harvest-kpi-value positive'}>{formatPrice(net)}</span>
          </div>
        </div>
      )}
    </>
  );
}
