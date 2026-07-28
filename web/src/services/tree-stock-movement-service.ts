import { apiFetch } from '@/services/api-client';
import type { TreeStockMovement } from '@/types/tree-stock-movement';

export function getTreeStockMovements(treeStockId: number) {
  return apiFetch<TreeStockMovement[]>(`/api/treestockmovements?treeStockId=${treeStockId}`);
}

/** Deletes a movement; the server also reverses its effect on the tree stock's amount. */
export function deleteTreeStockMovement(id: number) {
  return apiFetch<void>(`/api/treestockmovements/${id}`, {
    method: 'DELETE',
  });
}
