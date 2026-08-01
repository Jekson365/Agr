import { apiFetch } from '@/services/api-client';
import type {
  GreenhouseHarvest,
  GreenhouseHarvestFilters,
  GreenhouseHarvestInput,
  GreenhouseHarvestSummary,
} from '@/types/greenhouse-harvest';

/** Every greenhouse harvest, or just one greenhouse's. */
export function getGreenhouseHarvests(greenhouseId?: number) {
  return apiFetch<GreenhouseHarvest[]>(
    `/api/greenhouseharvests${greenhouseId != null ? `?greenhouseId=${greenhouseId}` : ''}`
  );
}

/**
 * One greenhouse's harvests with the yield each recorded, newest first and capped by `limit` —
 * one call in place of a list plus a results request per harvest. The filters go to the server so
 * they narrow the whole history, not just the rows the cap left on screen.
 */
export function getGreenhouseHarvestSummaries(
  greenhouseId: number,
  filters: GreenhouseHarvestFilters,
  limit = 10
) {
  const query = new URLSearchParams({ greenhouseId: String(greenhouseId), limit: String(limit) });
  if (filters.status) query.set('status', filters.status);
  if (filters.from) query.set('from', filters.from);
  if (filters.to) query.set('to', filters.to);

  return apiFetch<GreenhouseHarvestSummary[]>(`/api/greenhouseharvests/summaries?${query}`);
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
