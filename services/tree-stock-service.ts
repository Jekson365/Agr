import { apiFetch } from '@/services/api-client';
import type { TreeStock, TreeStockInput } from '@/types/tree-stock';

export function getTreeStock() {
  return apiFetch<TreeStock[]>('/api/treestocks');
}

export function getTreeStockItem(id: number) {
  return apiFetch<TreeStock>(`/api/treestocks/${id}`);
}

export function createTreeStock(stock: TreeStockInput) {
  return apiFetch<TreeStock>('/api/treestocks', {
    method: 'POST',
    body: JSON.stringify(stock),
  });
}

export function updateTreeStock(id: number, stock: TreeStock) {
  return apiFetch<void>(`/api/treestocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stock),
  });
}

export function deleteTreeStock(id: number) {
  return apiFetch<void>(`/api/treestocks/${id}`, {
    method: 'DELETE',
  });
}
