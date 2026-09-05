import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons/misc-icons';
import { useLanguage } from '@/contexts/language-context';
import '@/pages/harvest/timeline/harvest-timeline-toolbar.css';

type Props = {
  range: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function TreatmentToolbar({ range, onToday, onPrev, onNext }: Props) {
  const { t } = useLanguage();

  return (
    <div className="hcal-timeline-toolbar">
      <div className="hcal-timeline-toolbar-left">
        <button type="button" className="hcal-timeline-button" onClick={onToday}>
          {t('common.today')}
        </button>
        <div className="hcal-timeline-steppers">
          <button
            type="button"
            className="hcal-timeline-step"
            onClick={onPrev}
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <button
            type="button"
            className="hcal-timeline-step"
            onClick={onNext}
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronRightIcon width={18} height={18} />
          </button>
        </div>
        <span className="hcal-timeline-title">{range}</span>
      </div>
    </div>
  );
}
