import { apiFetch } from '@/services/api-client';
import type { Stock, StockInput } from '@/types/stock';

export function getStock() {
  return apiFetch<Stock[]>('/api/stocks');
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
