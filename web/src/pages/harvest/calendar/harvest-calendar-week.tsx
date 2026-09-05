import { toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarEvent } from '@/types/calendar';
import { columnsTemplate, isSameDay } from './harvest-calendar-events';
import { HarvestCalendarTimeGrid } from './harvest-calendar-timegrid';
import './harvest-calendar-week.css';

type Props = {
  days: Date[];
  now: Date;
  notesByDate: Map<string, CalendarEvent[]>;
  hourHeight: number;
  onPickDay: (day: Date) => void;
  onPickHour: (day: Date, hour: number) => void;
  onOpenNote: (note: CalendarEvent) => void;
};

export function HarvestCalendarWeek({ days, now, notesByDate, hourHeight, onPickDay, onPickHour, onOpenNote }: Props) {
  const { language } = useLanguage();
  const names = weekdayShortNames(language);

  return (
    <div className="harvest-calendar-week">
      <div className="harvest-calendar-week-head-row">
        <span className="harvest-calendar-week-gutter" />
        <div className="harvest-calendar-week-head" style={{ gridTemplateColumns: columnsTemplate(days.length) }}>
          {days.map((day, order) => (
            <button
              key={toIsoDate(day)}
              type="button"
              className={`harvest-calendar-column-head${isSameDay(day, now) ? ' today' : ''}`}
              onClick={() => onPickDay(day)}
            >
              <span className="harvest-calendar-column-name">{names[order]}</span>
              <span className="harvest-calendar-column-day">{day.getDate()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="harvest-calendar-week-body">
        <HarvestCalendarTimeGrid
          days={days}
          now={now}
          notesByDate={notesByDate}
          hourHeight={hourHeight}
          onPickHour={onPickHour}
          onOpenNote={onOpenNote}
        />
      </div>
    </div>
  );
}
