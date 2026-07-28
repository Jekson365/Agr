import { apiFetch } from '@/services/api-client';
import type { StockMovement } from '@/types/stock-movement';

export function getStockMovements(stockId: number) {
  return apiFetch<StockMovement[]>(`/api/stockmovements?stockId=${stockId}`);
}

/** Deletes a movement; the server also reverses its effect on the stock's amount. */
export function deleteStockMovement(id: number) {
  return apiFetch<void>(`/api/stockmovements/${id}`, {
    method: 'DELETE',
  });
}
