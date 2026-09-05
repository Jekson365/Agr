import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import type { StageDates } from '@/config/harvest-stage-dates';
import { HARVEST_STATUS_LABEL_KEY, HARVEST_STATUSES, harvestStatusesFor } from '@/config/harvest-status';
import { useLanguage } from '@/contexts/language-context';
import type { HarvestKind, HarvestStatus } from '@/types/harvest';
import './harvest-detail.css';

type Props = {
  kind: HarvestKind;
  status: HarvestStatus;
  saving: boolean;
  error: string | null;
  dates: StageDates;
  isBlocked: (status: HarvestStatus) => boolean;
  onSelect: (status: HarvestStatus) => void;
  onEditDates: () => void;
};

/**
 * The stages as full-height buttons rather than a compact stepper: where the harvest
 * stands is readable at a glance, and moving it on is one large target with the stage named in
 * words. The stage already reached is ticked, so the mark says which is which without relying on
 * the fill colour alone.
 */
export function HarvestStageBar({ kind, status, saving, error, dates, isBlocked, onSelect, onEditDates }: Props) {
  const { t } = useLanguage();
  const stages = harvestStatusesFor(kind, status);
  const currentIndex = stages.indexOf(status);
  const hasDates = HARVEST_STATUSES.some((option) => dates[option] != null);

  return (
    <>
      <div className="hd-stages-head">
        <h2 className="hd-block-title">{t('harvest.statusLabel')}</h2>
        {hasDates && (
          <button type="button" className="hd-stages-edit" onClick={onEditDates}>
            {t('harvest.stageDatesEdit')}
          </button>
        )}
      </div>
      <div className="hd-stages">
        {stages.map((option, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'ahead';
          const blocked = isBlocked(option);
          const date = dates[option];
          return (
            <button
              key={option}
              type="button"
              disabled={saving}
              aria-current={index === currentIndex ? 'step' : undefined}
              aria-disabled={blocked || undefined}
              className={blocked ? `hd-stage ${state} blocked` : `hd-stage ${state}`}
              onClick={() => onSelect(option)}
            >
              <span className="hd-stage-mark" aria-hidden="true">
                {index <= currentIndex ? '✓' : index + 1}
              </span>
              <span className="hd-stage-text">
                <span>{t(HARVEST_STATUS_LABEL_KEY[option])}</span>
                {date && <span className="hd-stage-date">{formatIsoDayNumeric(date)}</span>}
              </span>
            </button>
          );
        })}
      </div>
      {error && <div className="error-banner">{error}</div>}
    </>
  );
}
