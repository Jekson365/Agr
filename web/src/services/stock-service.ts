import { apiFetch } from '@/services/api-client';
import type { Seed, SeedUnit } from '@/types/seed';
import type { Stock, StockInput } from '@/types/stock';

/**
 * The stock on hand. Removed stock is left out — that is what keeps it off the stock page and out
 * of every picker. Pass `includeDeleted` where a removed row still has to be named: the harvests,
 * reports and plots recorded against it hold its id and nothing else.
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

/**
 * Creates a stock and the seed for the same crop in one call. The server makes both or neither,
 * so the pair can't end up half-created by a second request that never lands.
 */
export function createStockWithSeed(request: StockInput & { seedAmount: number; seedUnit: SeedUnit }) {
  return apiFetch<{ stock: Stock; seed: Seed }>('/api/stocks/with-seed', {
    method: 'POST',
    body: JSON.stringify(request),
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

/** Deducts a sold quantity and logs a movement tagged with the Market source.
 * `marketListingId` ties it to the listing, so deleting the movement can restore it. */
export function recordStockSale(id: number, quantity: number, marketListingId?: number) {
  return apiFetch<Stock>(`/api/stocks/${id}/sale`, {
    method: 'POST',
    body: JSON.stringify({ quantity, marketListingId: marketListingId ?? null }),
  });
}
