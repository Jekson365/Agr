import { apiFetch } from '@/services/api-client';
import type { BreedingEvent, BreedingEventInput, BreedingResultInput } from '@/types/breeding-event';
import type { LivestockDetail } from '@/types/livestock-detail';

export function getBreedingEvents(livestockId: number) {
  return apiFetch<BreedingEvent[]>(`/api/breedingevents?livestockId=${livestockId}`);
}

/** Every event on the farm. Needed to tell which females are already in an unfinished pairing —
 *  the one holding a female may have been recorded from another group's page. */
export function getAllBreedingEvents() {
  return apiFetch<BreedingEvent[]>('/api/breedingevents');
}

export function createBreedingEvent(input: BreedingEventInput) {
  return apiFetch<BreedingEvent>('/api/breedingevents', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function updateBreedingEvent(id: number, breedingEvent: BreedingEvent) {
  return apiFetch<void>(`/api/breedingevents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(breedingEvent),
  });
}

export function deleteBreedingEvent(id: number) {
  return apiFetch<void>(`/api/breedingevents/${id}`, {
    method: 'DELETE',
  });
}

/** Records what a pairing produced. The server creates the animals, stamps them with the event's
 *  two parents, and raises the receiving group's head count — all in one write. */
export function recordBreedingResult(id: number, input: BreedingResultInput) {
  return apiFetch<LivestockDetail[]>(`/api/breedingevents/${id}/result`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
