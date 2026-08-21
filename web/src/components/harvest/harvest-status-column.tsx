import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestStatus } from '@/types/harvest';
import './harvest.css';

type HarvestStatusColumnProps = {
  status: HarvestStatus;
  saving: boolean;
  error: string | null;
  showExpenses: boolean;
  onSelect: (status: HarvestStatus) => void;
  onOpenExpenses: () => void;
};

export function HarvestStatusColumn({
  status,
  saving,
  error,
  showExpenses,
  onSelect,
  onOpenExpenses,
}: HarvestStatusColumnProps) {
  const { t } = useLanguage();
  const currentIndex = HARVEST_STATUSES.indexOf(status);

  return (
    <div className="harvest-top-cell harvest-status-column">
      <span className="harvest-status-heading">{t('harvest.statusLabel')}</span>
      <div className="harvest-status-steps">
        {HARVEST_STATUSES.map((option, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'ahead';
          return (
            <button
              key={option}
              type="button"
              disabled={saving}
              aria-current={index === currentIndex ? 'step' : undefined}
              className={`harvest-status-step ${state}`}
              onClick={() => onSelect(option)}
            >
              <span className="harvest-status-marker">{index + 1}</span>
              <span className="harvest-status-name">{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
            </button>
          );
        })}
      </div>
      {showExpenses && (
        <button
          type="button"
          className="harvest-expenses-button"
          onClick={onOpenExpenses}
          aria-label={t('harvest.expensesTitle')}
        >
          $
        </button>
      )}
      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
