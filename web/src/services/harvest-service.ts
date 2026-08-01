import { apiFetch } from '@/services/api-client';
import type { Harvest, HarvestInput, HarvestKind } from '@/types/harvest';

/** Every harvest, or just crop/fruit ones when `kind` is given. */
export function getHarvests(kind?: HarvestKind) {
  return apiFetch<Harvest[]>(`/api/harvests${kind ? `?kind=${kind}` : ''}`);
}

/** The plant stocks some harvest records — planned or picked. A harvest is written in the good's
 *  own terms, so those rows have their kind and unit settled. */
export function getRecordedStockIds() {
  return apiFetch<number[]>('/api/harvests/recorded-stocks');
}

export function getHarvest(id: number) {
  return apiFetch<Harvest>(`/api/harvests/${id}`);
}

export function createHarvest(harvest: HarvestInput) {
  return apiFetch<Harvest>('/api/harvests', {
    method: 'POST',
    body: JSON.stringify(harvest),
  });
}

export function updateHarvest(id: number, harvest: Harvest) {
  return apiFetch<void>(`/api/harvests/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvest),
  });
}

export function deleteHarvest(id: number) {
  return apiFetch<void>(`/api/harvests/${id}`, {
    method: 'DELETE',
  });
}
