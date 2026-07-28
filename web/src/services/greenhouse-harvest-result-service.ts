import { apiFetch } from '@/services/api-client';
import type { GreenhouseHarvestResult, GreenhouseHarvestResultInput } from '@/types/greenhouse-harvest-result';

export function getGreenhouseHarvestResults(greenhouseHarvestId: number) {
  return apiFetch<GreenhouseHarvestResult[]>(`/api/greenhouseharvestresults?greenhouseHarvestId=${greenhouseHarvestId}`);
}

export function createGreenhouseHarvestResult(result: GreenhouseHarvestResultInput) {
  return apiFetch<GreenhouseHarvestResult>('/api/greenhouseharvestresults', {
    method: 'POST',
    body: JSON.stringify(result),
  });
}

export function updateGreenhouseHarvestResult(id: number, result: GreenhouseHarvestResult) {
  return apiFetch<void>(`/api/greenhouseharvestresults/${id}`, {
    method: 'PUT',
    body: JSON.stringify(result),
  });
}

export function deleteGreenhouseHarvestResult(id: number) {
  return apiFetch<void>(`/api/greenhouseharvestresults/${id}`, {
    method: 'DELETE',
  });
}
