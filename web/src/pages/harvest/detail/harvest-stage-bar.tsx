import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestStatus } from '@/types/harvest';
import './harvest-detail.css';

type Props = {
  status: HarvestStatus;
  saving: boolean;
  error: string | null;
  onSelect: (status: HarvestStatus) => void;
};

/**
 * The three stages as three full-height buttons rather than a compact stepper: where the harvest
 * stands is readable at a glance, and moving it on is one large target with the stage named in
 * words. The stage already reached is ticked, so the mark says which is which without relying on
 * the fill colour alone.
 */
export function HarvestStageBar({ status, saving, error, onSelect }: Props) {
  const { t } = useLanguage();
  const currentIndex = HARVEST_STATUSES.indexOf(status);

  return (
    <>
      <h2 className="hd-block-title">{t('harvest.statusLabel')}</h2>
      <div className="hd-stages">
        {HARVEST_STATUSES.map((option, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'ahead';
          return (
            <button
              key={option}
              type="button"
              disabled={saving}
              aria-current={index === currentIndex ? 'step' : undefined}
              className={`hd-stage ${state}`}
              onClick={() => onSelect(option)}
            >
              <span className="hd-stage-mark" aria-hidden="true">
                {index <= currentIndex ? '✓' : index + 1}
              </span>
              <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
            </button>
          );
        })}
      </div>
      {error && <div className="error-banner">{error}</div>}
    </>
  );
}
