import { formatTime } from '@/components/ui/date-utils';
import { useLanguage } from '@/contexts/language-context';
import type { CalendarEvent } from '@/types/calendar';
import './harvest-calendar-note-chip.css';

type Props = {
  note: CalendarEvent;
  onOpen: (note: CalendarEvent) => void;
};

export function HarvestCalendarNoteChip({ note, onOpen }: Props) {
  const { language } = useLanguage();

  return (
    <button
      type="button"
      className="hcal-note-chip"
      title={note.title}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(note);
      }}
    >
      <span className="hcal-note-chip-time">{formatTime(note.time.slice(0, 5), language)}</span>
      <span className="hcal-note-chip-title">{note.title}</span>
    </button>
  );
}
