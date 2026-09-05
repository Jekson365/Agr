import { formatTime, toIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarEvent } from '@/types/calendar';
import { columnsTemplate, isSameDay } from './harvest-calendar-events';
import { minutesOfDay } from './use-current-time';
import './harvest-calendar-time.css';

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

type PositionedNote = { note: CalendarEvent; top: number; height: number };

type Props = {
  days: Date[];
  now: Date;
  notesByDate: Map<string, CalendarEvent[]>;
  /** How tall one hour is, set by the calendar's zoom. */
  hourHeight: number;
  onPickHour: (day: Date, hour: number) => void;
  onOpenNote: (note: CalendarEvent) => void;
};

export function HarvestCalendarTimeGrid({ days, now, notesByDate, hourHeight, onPickHour, onOpenNote }: Props) {
  const { t, language } = useLanguage();
  const nowTop = (minutesOfDay(now) / 60) * hourHeight;

  return (
    <>
      <div className="hcal-axis">
        {HOURS.map((hour) => (
          <div key={hour} className="hcal-axis-hour" style={{ height: hourHeight }}>
            <span className="hcal-axis-num">{hour + 1}</span>
            <span className="hcal-axis-unit">{t('harvestCalendar.hourShort')}</span>
          </div>
        ))}
      </div>

      <div className="hcal-hours" style={{ gridTemplateColumns: columnsTemplate(days.length) }}>
        {days.map((day) => (
          <div key={toIsoDate(day)} className="hcal-hour-col">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="hcal-slot"
                style={{ height: hourHeight }}
                onClick={() => onPickHour(day, hour)}
              />
            ))}

            {layoutNotes(notesByDate.get(toIsoDate(day)) ?? [], hourHeight).map(({ note, top, height }) => (
              <button
                key={note.id}
                type="button"
                className="hcal-note"
                style={{ top, height }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenNote(note);
                }}
              >
                <span className="hcal-note-time">{formatTime(note.time.slice(0, 5), language)}</span>
                <span className="hcal-note-title">{note.title}</span>
              </button>
            ))}

            {isSameDay(day, now) && (
              <div className="hcal-now" style={{ top: nowTop }}>
                <span className="hcal-now-dot" />
                <span className="hcal-now-time">{formatTime(clockValue(now), language)}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function layoutNotes(notes: CalendarEvent[], hourHeight: number): PositionedNote[] {
  const groups = new Map<number, CalendarEvent[]>();
  for (const note of notes) {
    const hour = Number(note.time.slice(0, 2)) || 0;
    const list = groups.get(hour);
    if (list) {
      list.push(note);
    } else {
      groups.set(hour, [note]);
    }
  }

  const positioned: PositionedNote[] = [];
  for (const [hour, list] of groups) {
    const height = hourHeight / list.length;
    list.forEach((note, index) => {
      positioned.push({ note, top: hour * hourHeight + index * height, height });
    });
  }
  return positioned;
}

function clockValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
