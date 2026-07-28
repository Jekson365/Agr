import { apiFetch } from '@/services/api-client';
import type { GreenhouseHarvest, GreenhouseHarvestInput } from '@/types/greenhouse-harvest';

/** Every greenhouse harvest, or just one greenhouse's. */
export function getGreenhouseHarvests(greenhouseId?: number) {
  return apiFetch<GreenhouseHarvest[]>(
    `/api/greenhouseharvests${greenhouseId != null ? `?greenhouseId=${greenhouseId}` : ''}`
  );
}

export function getGreenhouseHarvest(id: number) {
  return apiFetch<GreenhouseHarvest>(`/api/greenhouseharvests/${id}`);
}

export function createGreenhouseHarvest(harvest: GreenhouseHarvestInput) {
  return apiFetch<GreenhouseHarvest>('/api/greenhouseharvests', {
    method: 'POST',
    body: JSON.stringify(harvest),
  });
}

export function updateGreenhouseHarvest(id: number, harvest: GreenhouseHarvest) {
  return apiFetch<void>(`/api/greenhouseharvests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvest),
  });
}

export function deleteGreenhouseHarvest(id: number) {
  return apiFetch<void>(`/api/greenhouseharvests/${id}`, {
    method: 'DELETE',
  });
}
