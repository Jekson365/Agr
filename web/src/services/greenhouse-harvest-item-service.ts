import { apiFetch } from '@/services/api-client';
import type { GreenhouseHarvestItem, GreenhouseHarvestItemInput } from '@/types/greenhouse-harvest-item';

export function getGreenhouseHarvestItems(greenhouseHarvestId: number) {
  return apiFetch<GreenhouseHarvestItem[]>(`/api/greenhouseharvestitems?greenhouseHarvestId=${greenhouseHarvestId}`);
}

export function createGreenhouseHarvestItem(item: GreenhouseHarvestItemInput) {
  return apiFetch<GreenhouseHarvestItem>('/api/greenhouseharvestitems', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function updateGreenhouseHarvestItem(id: number, item: GreenhouseHarvestItem) {
  return apiFetch<void>(`/api/greenhouseharvestitems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export function deleteGreenhouseHarvestItem(id: number) {
  return apiFetch<void>(`/api/greenhouseharvestitems/${id}`, {
    method: 'DELETE',
  });
}
