import { apiFetch } from '@/services/api-client';
import type { StockFeed, StockFeedInput } from '@/types/stock-feed';

export function getStockFeeds(livestockId: number) {
  return apiFetch<StockFeed[]>(`/api/stockfeeds?livestockId=${livestockId}`);
}

export function createStockFeed(feed: StockFeedInput) {
  return apiFetch<StockFeed>('/api/stockfeeds', {
    method: 'POST',
    body: JSON.stringify(feed),
  });
}

export function updateStockFeed(id: number, feed: StockFeed) {
  return apiFetch<void>(`/api/stockfeeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(feed),
  });
}

export function deleteStockFeed(id: number) {
  return apiFetch<void>(`/api/stockfeeds/${id}`, {
    method: 'DELETE',
  });
}
