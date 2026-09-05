import { apiFetch } from '@/services/api-client';
import type { HarvestStatusChange } from '@/types/harvest-status-change';

export function getHarvestStatusChanges(harvestId?: number) {
  return apiFetch<HarvestStatusChange[]>(
    `/api/harveststatuschanges${harvestId != null ? `?harvestId=${harvestId}` : ''}`
  );
}

export function updateHarvestStatusChange(id: number, change: HarvestStatusChange) {
  return apiFetch<void>(`/api/harveststatuschanges/${id}`, {
    method: 'PUT',
    body: JSON.stringify(change),
  });
}
