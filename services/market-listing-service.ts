import { apiFetch, uploadImage } from '@/services/api-client';
import type { ListingCategory, ListingType, MarketListing, MarketListingInput } from '@/types/market-listing';

export type MarketListingFilter = {
  type?: ListingType;
  category?: ListingCategory;
  search?: string;
  mine?: boolean;
};

export function uploadMarketListingImage(uri: string): Promise<string> {
  return uploadImage(uri, '/api/marketlistings/upload-image');
}

export function getMarketListings(filter: MarketListingFilter = {}) {
  const params = new URLSearchParams();
  if (filter.type) params.set('type', filter.type);
  if (filter.category) params.set('category', filter.category);
  if (filter.search) params.set('search', filter.search);
  if (filter.mine) params.set('mine', 'true');
  const query = params.toString();
  return apiFetch<MarketListing[]>(`/api/marketlistings${query ? `?${query}` : ''}`);
}

export function getMarketListing(id: number) {
  return apiFetch<MarketListing>(`/api/marketlistings/${id}`);
}

export function createMarketListing(listing: MarketListingInput) {
  return apiFetch<MarketListing>('/api/marketlistings', {
    method: 'POST',
    body: JSON.stringify(listing),
  });
}

export function updateMarketListing(id: number, listing: MarketListing) {
  return apiFetch<void>(`/api/marketlistings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(listing),
  });
}

export function deleteMarketListing(id: number) {
  return apiFetch<void>(`/api/marketlistings/${id}`, {
    method: 'DELETE',
  });
}
