import { apiFetch } from '@/services/api-client';
import type { HarvestEvent, HarvestEventInput } from '@/types/harvest-event';

export function getHarvestEvents(harvestId?: number) {
  return apiFetch<HarvestEvent[]>(
    `/api/harvestevents${harvestId != null ? `?harvestId=${harvestId}` : ''}`
  );
}

export function createHarvestEvent(harvestEvent: HarvestEventInput) {
  return apiFetch<HarvestEvent>('/api/harvestevents', {
    method: 'POST',
    body: JSON.stringify(harvestEvent),
  });
}

export function updateHarvestEvent(id: number, harvestEvent: HarvestEvent) {
  return apiFetch<void>(`/api/harvestevents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestEvent),
  });
}

export function deleteHarvestEvent(id: number) {
  return apiFetch<void>(`/api/harvestevents/${id}`, {
    method: 'DELETE',
  });
}
