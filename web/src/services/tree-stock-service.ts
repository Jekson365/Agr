import { apiFetch } from '@/services/api-client';
import type { TreeStock, TreeStockInput } from '@/types/tree-stock';

/**
 * The fruit the farm holds. Removed orchards are left out, which is what keeps them off the fruit
 * page and out of every picker. Pass `includeDeleted` where a removed one still has to be named:
 * the harvests, reports and plots recorded against it hold its id and nothing else, so without it
 * those rows lose their label and icon.
 */
export function getTreeStock(includeDeleted = false) {
  return apiFetch<TreeStock[]>(`/api/treestocks${includeDeleted ? '?includeDeleted=true' : ''}`);
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

/** Deducts a sold quantity and logs a movement tagged with the Market source. */
export function recordTreeStockSale(id: number, quantity: number, marketListingId?: number) {
  return apiFetch<TreeStock>(`/api/treestocks/${id}/sale`, {
    method: 'POST',
    body: JSON.stringify({ quantity, marketListingId: marketListingId ?? null }),
  });
}
