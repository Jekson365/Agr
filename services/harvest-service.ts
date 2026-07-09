import { apiFetch } from '@/services/api-client';
import type { Harvest, HarvestInput } from '@/types/harvest';

export function getHarvests() {
  return apiFetch<Harvest[]>('/api/harvests');
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
