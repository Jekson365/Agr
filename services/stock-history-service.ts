import { apiFetch } from '@/services/api-client';
import type { StockHistory, StockHistoryInput } from '@/types/stock-history';

export function getStockHistory(stockId: number) {
  return apiFetch<StockHistory[]>(`/api/stockhistory?stockId=${stockId}`);
}

export function createStockHistory(input: StockHistoryInput) {
  return apiFetch<StockHistory>('/api/stockhistory', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteStockHistory(id: number) {
  return apiFetch<void>(`/api/stockhistory/${id}`, {
    method: 'DELETE',
  });
}
