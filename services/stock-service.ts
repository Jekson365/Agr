import { apiFetch } from '@/services/api-client';
import type { Stock, StockInput } from '@/types/stock';

/**
 * The stock on hand. Removed stock is left out — that is what keeps it off the stock list and out
 * of every picker. Pass `includeDeleted` where a removed row still has to be named: the harvests
 * and reports recorded against it hold its id and nothing else.
 */
export function getStock(includeDeleted = false) {
  return apiFetch<Stock[]>(`/api/stocks${includeDeleted ? '?includeDeleted=true' : ''}`);
}

export function getStockItem(id: number) {
  return apiFetch<Stock>(`/api/stocks/${id}`);
}

export function createStock(stock: StockInput) {
  return apiFetch<Stock>('/api/stocks', {
    method: 'POST',
    body: JSON.stringify(stock),
  });
}

export function updateStock(id: number, stock: Stock) {
  return apiFetch<void>(`/api/stocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stock),
  });
}

export function deleteStock(id: number) {
  return apiFetch<void>(`/api/stocks/${id}`, {
    method: 'DELETE',
  });
}
