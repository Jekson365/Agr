import { apiFetch } from '@/services/api-client';
import type { TreeSpotTreatment, TreeSpotTreatmentBatch } from '@/types/tree-spot-treatment';

export function getTreeSpotTreatments(treeStockId?: number) {
  const query = treeStockId == null ? '' : `?treeStockId=${treeStockId}`;
  return apiFetch<TreeSpotTreatment[]>(`/api/treespottreatments${query}`);
}

export function createTreeSpotTreatments(batch: TreeSpotTreatmentBatch) {
  return apiFetch<TreeSpotTreatment[]>('/api/treespottreatments', {
    method: 'POST',
    body: JSON.stringify(batch),
  });
}

export function deleteTreeSpotTreatment(id: number) {
  return apiFetch<void>(`/api/treespottreatments/${id}`, { method: 'DELETE' });
}
