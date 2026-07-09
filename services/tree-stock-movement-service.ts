import { apiFetch } from '@/services/api-client';
import type { TreeStockMovement } from '@/types/tree-stock-movement';

export function getTreeStockMovements(treeStockId: number) {
  return apiFetch<TreeStockMovement[]>(`/api/treestockmovements?treeStockId=${treeStockId}`);
}
