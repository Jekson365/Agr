import { apiFetch } from '@/services/api-client';
import type { HarvestItem, HarvestItemInput } from '@/types/harvest-item';

export function getHarvestItems(harvestId: number) {
  return apiFetch<HarvestItem[]>(`/api/harvestitems?harvestId=${harvestId}`);
}

export function createHarvestItem(item: HarvestItemInput) {
  return apiFetch<HarvestItem>('/api/harvestitems', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function updateHarvestItem(id: number, item: HarvestItem) {
  return apiFetch<void>(`/api/harvestitems/${id}`, {
    method: 'PUT',
    body: JSON.stringify(item),
  });
}

export function deleteHarvestItem(id: number) {
  return apiFetch<void>(`/api/harvestitems/${id}`, {
    method: 'DELETE',
  });
}
