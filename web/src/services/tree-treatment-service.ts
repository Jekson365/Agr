import { apiFetch } from '@/services/api-client';
import type { TreeTreatment, TreeTreatmentInput } from '@/types/tree-treatment';

export function getTreeTreatments(treeStockId?: number) {
  return apiFetch<TreeTreatment[]>(
    `/api/treetreatments${treeStockId != null ? `?treeStockId=${treeStockId}` : ''}`
  );
}

export function createTreeTreatment(treatment: TreeTreatmentInput) {
  return apiFetch<TreeTreatment>('/api/treetreatments', {
    method: 'POST',
    body: JSON.stringify(treatment),
  });
}

export function deleteTreeTreatment(id: number) {
  return apiFetch<void>(`/api/treetreatments/${id}`, {
    method: 'DELETE',
  });
}
