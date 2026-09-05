import { useState } from 'react';

import '@/components/farm/farm-crud.css';
import { formatLocalizedDate, monthNames, toIsoDate } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarEvent } from '@/types/calendar';
import { buildWeek, shiftAnchor, type CalendarView } from './harvest-calendar-events';
import { HarvestCalendarMonth } from './harvest-calendar-month';
import { HarvestCalendarNoteModal } from './harvest-calendar-note-modal';
import { HarvestCalendarToolbar } from './harvest-calendar-toolbar';
import { HarvestCalendarWeek } from './harvest-calendar-week';
import { clampZoom, DEFAULT_ZOOM, hourHeightFor, monthRowHeightFor } from './harvest-calendar-zoom';
import { useCalendarNotes } from './use-calendar-notes';
import { useCurrentTime } from './use-current-time';
import './harvest-calendar.css';

type NoteState = { date: string; time: string; note: CalendarEvent | null };

export function HarvestCalendarPage() {
  const { language } = useLanguage();
  const now = useCurrentTime();
  const notes = useCalendarNotes();

  const [view, setView] = useState<CalendarView>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [noteState, setNoteState] = useState<NoteState | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);

  const week = buildWeek(anchor);
  const months = monthNames(language);
  const title =
    view === 'month'
      ? `${months[anchor.getMonth()]} ${anchor.getFullYear()}`
      : `${formatLocalizedDate(week[0], language)} – ${formatLocalizedDate(week[6], language, { year: true })}`;

  function newNote(day: Date, hour: number | null) {
    const time = hour == null ? clockValue(now) : `${String(hour).padStart(2, '0')}:00`;
    setNoteState({ date: toIsoDate(day), time, note: null });
  }

  return (
    <div className="harvest-calendar-page page-fill">
      <div className="page-fill-header harvest-calendar-head">
        <HarvestCalendarToolbar
          title={title}
          view={view}
          onView={setView}
          onToday={() => setAnchor(new Date())}
          onPrev={() => setAnchor((prev) => shiftAnchor(prev, view, -1))}
          onNext={() => setAnchor((prev) => shiftAnchor(prev, view, 1))}
          zoom={zoom}
          onZoom={(delta) => setZoom((prev) => clampZoom(prev + delta))}
          onAdd={() => newNote(anchor, null)}
        />

        {notes.error && <div className="error-banner">{notes.error}</div>}
      </div>

      <div className="harvest-calendar-scroll page-fill-scroll">
        {notes.loading ? (
          <div className="state-box">…</div>
        ) : view === 'month' ? (
          <HarvestCalendarMonth
            anchor={anchor}
            now={now}
            notesByDate={notes.notesByDate}
            rowHeight={monthRowHeightFor(zoom)}
            onPickDay={(day) => newNote(day, null)}
            onOpenNote={(note) => setNoteState({ date: note.date.slice(0, 10), time: note.time, note })}
          />
        ) : (
          <HarvestCalendarWeek
            days={week}
            now={now}
            notesByDate={notes.notesByDate}
            hourHeight={hourHeightFor(zoom)}
            onPickDay={(day) => newNote(day, null)}
            onPickHour={(day, hour) => newNote(day, hour)}
            onOpenNote={(note) => setNoteState({ date: note.date.slice(0, 10), time: note.time, note })}
          />
        )}
      </div>

      <HarvestCalendarNoteModal
        open={noteState != null}
        date={noteState?.date ?? ''}
        time={noteState?.time ?? ''}
        editingNote={noteState?.note ?? null}
        onClose={() => setNoteState(null)}
        onSaved={notes.addNote}
        onDeleted={notes.removeNote}
      />
    </div>
  );
}

function clockValue(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
