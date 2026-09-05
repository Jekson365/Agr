import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@/components/icons/misc-icons';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarView } from './harvest-calendar-events';
import { MAX_ZOOM, MIN_ZOOM, zoomPercent } from './harvest-calendar-zoom';
import './harvest-calendar-toolbar.css';

const VIEW_LABEL_KEY: Record<CalendarView, string> = {
  month: 'harvestCalendar.viewMonth',
  week: 'harvestCalendar.viewWeek',
};

const VIEWS: CalendarView[] = ['month', 'week'];

type Props = {
  title: string;
  view: CalendarView;
  onView: (view: CalendarView) => void;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  zoom: number;
  onZoom: (delta: number) => void;
  onAdd: () => void;
};

export function HarvestCalendarToolbar({ title, view, onView, onToday, onPrev, onNext, zoom, onZoom, onAdd }: Props) {
  const { t } = useLanguage();

  return (
    <div className="harvest-calendar-toolbar">
      <div className="harvest-calendar-toolbar-left">
        <button type="button" className="harvest-calendar-today" onClick={onToday}>
          {t('common.today')}
        </button>
        <div className="harvest-calendar-steppers">
          <button
            type="button"
            className="harvest-calendar-step"
            onClick={onPrev}
            aria-label={t('calendar.previousMonth')}
          >
            <ChevronLeftIcon width={18} height={18} />
          </button>
          <button
            type="button"
            className="harvest-calendar-step"
            onClick={onNext}
            aria-label={t('calendar.nextMonth')}
          >
            <ChevronRightIcon width={18} height={18} />
          </button>
        </div>
        <h1 className="harvest-calendar-title">{title}</h1>
      </div>

      <div className="harvest-calendar-toolbar-right">
        <div className="harvest-calendar-views">
          {VIEWS.map((option) => (
            <button
              key={option}
              type="button"
              className={option === view ? 'harvest-calendar-view active' : 'harvest-calendar-view'}
              onClick={() => onView(option)}
            >
              {t(VIEW_LABEL_KEY[option])}
            </button>
          ))}
        </div>

        <div className="harvest-calendar-zoom">
          <button
            type="button"
            className="harvest-calendar-step"
            disabled={zoom <= MIN_ZOOM}
            onClick={() => onZoom(-1)}
            aria-label={t('harvestCalendar.zoomOut')}
          >
            −
          </button>
          <span className="harvest-calendar-zoom-value">{zoomPercent(zoom)}%</span>
          <button
            type="button"
            className="harvest-calendar-step"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => onZoom(1)}
            aria-label={t('harvestCalendar.zoomIn')}
          >
            +
          </button>
        </div>

        <button
          type="button"
          className="btn harvest-calendar-add"
          onClick={onAdd}
        >
          <PlusIcon width={16} height={16} />
          {t('harvestCalendar.addNote')}
        </button>
      </div>
    </div>
  );
}
