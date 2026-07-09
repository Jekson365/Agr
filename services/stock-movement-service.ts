import { apiFetch } from '@/services/api-client';
import type { StockMovement } from '@/types/stock-movement';

export function getStockMovements(stockId: number) {
  return apiFetch<StockMovement[]>(`/api/stockmovements?stockId=${stockId}`);
}
