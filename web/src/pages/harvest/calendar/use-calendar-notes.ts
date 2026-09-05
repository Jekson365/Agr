import { useEffect, useMemo, useState } from 'react';

import { getCalendarEvents } from '@/services/calendar-service';
import type { CalendarEvent } from '@/types/calendar';
import { groupNotesByDate } from './harvest-calendar-events';

export function useCalendarNotes() {
  const [notes, setNotes] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setNotes(await getCalendarEvents());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const notesByDate = useMemo(() => groupNotesByDate(notes), [notes]);

  function addNote(note: CalendarEvent) {
    setNotes((prev) => [...prev, note]);
  }

  function removeNote(id: number) {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }

  return { notesByDate, loading, error, addNote, removeNote };
}
