import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@/components/icons/misc-icons';
import { useLanguage } from '@/contexts/language-context';
import './harvest-timeline-toolbar.css';

type Props = {
  title: string;
  dayCount: number;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onZoom: (delta: number) => void;
  onAdd: () => void;
};

export function HarvestTimelineToolbar({ title, dayCount, onToday, onPrev, onNext, onZoom, onAdd }: Props) {
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
        <h1 className="hcal-timeline-title">{title}</h1>
      </div>

      <div className="hcal-timeline-toolbar-right">
        <div className="hcal-timeline-zoom">
          <button
            type="button"
            className="hcal-timeline-step"
            onClick={() => onZoom(-1)}
            aria-label={t('harvestTimeline.zoomIn')}
          >
            −
          </button>
          <span className="hcal-timeline-zoom-value">{t('harvestTimeline.days', { count: dayCount })}</span>
          <button
            type="button"
            className="hcal-timeline-step"
            onClick={() => onZoom(1)}
            aria-label={t('harvestTimeline.zoomOut')}
          >
            +
          </button>
        </div>

        <button type="button" className="btn hcal-timeline-add" onClick={onAdd}>
          <PlusIcon width={16} height={16} />
          {t('harvest.add')}
        </button>
      </div>
    </div>
  );
}
