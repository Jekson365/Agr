import { apiFetch } from '@/services/api-client';
import type { CalendarEvent, CalendarEventInput } from '@/types/calendar';

export function getCalendarEvents() {
  return apiFetch<CalendarEvent[]>('/api/calendarevents');
}

export function createCalendarEvent(event: CalendarEventInput) {
  return apiFetch<CalendarEvent>('/api/calendarevents', {
    method: 'POST',
    body: JSON.stringify(event),
  });
}

export function deleteCalendarEvent(id: number) {
  return apiFetch<void>(`/api/calendarevents/${id}`, {
    method: 'DELETE',
  });
}
