import { toIsoDate } from '@/components/ui/date-utils';
import type { CalendarEvent } from '@/types/calendar';

export type CalendarView = 'month' | 'week';

export function buildWeek(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

export function shiftAnchor(anchor: Date, view: CalendarView, delta: number): Date {
  const next = new Date(anchor);
  if (view === 'month') {
    next.setMonth(next.getMonth() + delta, 1);
  } else {
    next.setDate(next.getDate() + delta * 7);
  }
  return next;
}

export function isSameDay(a: Date, b: Date): boolean {
  return toIsoDate(a) === toIsoDate(b);
}

export function columnsTemplate(days: number): string {
  return `repeat(${days}, minmax(0, 1fr))`;
}

export function groupNotesByDate(notes: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const note of notes) {
    const key = note.date.slice(0, 10);
    const list = map.get(key);
    if (list) {
      list.push(note);
    } else {
      map.set(key, [note]);
    }
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.time.localeCompare(b.time));
  }
  return map;
}
