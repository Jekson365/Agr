import { apiFetch } from '@/services/api-client';
import type { HarvestResult, HarvestResultInput } from '@/types/harvest-result';

export function getHarvestResults(harvestId: number) {
  return apiFetch<HarvestResult[]>(`/api/harvestresults?harvestId=${harvestId}`);
}

export function createHarvestResult(result: HarvestResultInput) {
  return apiFetch<HarvestResult>('/api/harvestresults', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export function updateHarvestResult(id: number, result: HarvestResult) {
  return apiFetch<void>(`/api/harvestresults/${id}`, {
    method: 'PUT',
    body: JSON.stringify(result),
  });
}

export function deleteHarvestResult(id: number) {
  return apiFetch<void>(`/api/harvestresults/${id}`, {
    method: 'DELETE',
  });
}
