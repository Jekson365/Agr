import { apiFetch } from '@/services/api-client';
import type { StockKind, StockKindInput } from '@/types/stock-kind';

export function getStockKinds() {
  return apiFetch<StockKind[]>('/api/stockkinds');
}

export function createStockKind(kind: StockKindInput) {
  return apiFetch<StockKind>('/api/stockkinds', {
    method: 'POST',
    body: JSON.stringify(kind),
  });
}

/** Fails with 409 when stock or seed rows still reference the kind. */
export function deleteStockKind(id: number) {
  return apiFetch<void>(`/api/stockkinds/${id}`, {
    method: 'DELETE',
  });
}
