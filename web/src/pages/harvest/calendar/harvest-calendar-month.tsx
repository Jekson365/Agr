import { buildMonthGrid, toIsoDate, weekdayShortNames } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarEvent } from '@/types/calendar';
import { isSameDay } from './harvest-calendar-events';
import { HarvestCalendarNoteChip } from './harvest-calendar-note-chip';
import './harvest-calendar-month.css';

const MAX_ROWS = 3;

type Props = {
  anchor: Date;
  now: Date;
  notesByDate: Map<string, CalendarEvent[]>;
  /** How tall a day is, set by the calendar's zoom. */
  rowHeight: number;
  onPickDay: (day: Date) => void;
  onOpenNote: (note: CalendarEvent) => void;
};

export function HarvestCalendarMonth({ anchor, now, notesByDate, rowHeight, onPickDay, onOpenNote }: Props) {
  const { t, language } = useLanguage();
  const days = buildMonthGrid(anchor.getFullYear(), anchor.getMonth());
  const month = anchor.getMonth();

  return (
    <div className="harvest-calendar-grid">
      {weekdayShortNames(language).map((name) => (
        <div key={name} className="harvest-calendar-weekday">
          {name}
        </div>
      ))}

      {days.map((day) => {
        const key = toIsoDate(day);
        const notes = notesByDate.get(key) ?? [];
        const shown = notes.slice(0, MAX_ROWS);
        const hidden = notes.length - shown.length;

        return (
          <div
            key={key}
            className={`harvest-calendar-cell${day.getMonth() !== month ? ' outside' : ''}${
              isSameDay(day, now) ? ' today' : ''
            }`}
            style={{ minHeight: rowHeight }}
            onClick={() => onPickDay(day)}
          >
            <span className="harvest-calendar-daynum">{day.getDate()}</span>

            <div className="harvest-calendar-cell-events">
              {shown.map((note) => (
                <HarvestCalendarNoteChip key={note.id} note={note} onOpen={onOpenNote} />
              ))}

              {hidden > 0 && (
                <span className="harvest-calendar-more">{t('harvestCalendar.more', { count: hidden })}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
