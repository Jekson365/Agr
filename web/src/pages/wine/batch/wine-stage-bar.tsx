import { formatIsoDayNumeric } from '@/components/ui/date-utils';
import { WINE_STAGE_LABEL_KEY, WINE_STAGES } from '@/config/wine';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/detail/harvest-detail.css';
import type { WineStage, WineStageChange } from '@/types/wine';

type Props = {
  stage: WineStage;
  changes: WineStageChange[];
  saving: boolean;
  disabled: boolean;
  onSelect: (stage: WineStage) => void;
};

export function WineStageBar({ stage, changes, saving, disabled, onSelect }: Props) {
  const { t } = useLanguage();

  const dates: Partial<Record<WineStage, string>> = {};
  for (const change of changes) {
    dates[change.toStage] = change.date;
  }
  const currentIndex = WINE_STAGES.indexOf(stage);

  return (
    <>
      <div className="hd-stages-head">
        <h2 className="hd-block-title">{t('wine.stageTitle')}</h2>
      </div>
      <div className="hd-stages">
        {WINE_STAGES.map((option, index) => {
          const state = index < currentIndex ? 'done' : index === currentIndex ? 'active' : 'ahead';
          const date = index <= currentIndex ? dates[option] : undefined;
          return (
            <button
              key={option}
              type="button"
              disabled={saving || disabled}
              aria-current={index === currentIndex ? 'step' : undefined}
              className={`hd-stage ${state}`}
              onClick={() => onSelect(option)}
            >
              <span className="hd-stage-mark" aria-hidden="true">
                {index <= currentIndex ? '✓' : index + 1}
              </span>
              <span className="hd-stage-text">
                <span>{t(WINE_STAGE_LABEL_KEY[option])}</span>
                {date && <span className="hd-stage-date">{formatIsoDayNumeric(date)}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
