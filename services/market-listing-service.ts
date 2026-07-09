import { Platform } from 'react-native';

import { API_URL, ApiError, apiFetch, authHeaders } from '@/services/api-client';
import type { ListingCategory, ListingType, MarketListing, MarketListingInput } from '@/types/market-listing';

export type MarketListingFilter = {
  type?: ListingType;
  category?: ListingCategory;
  search?: string;
  mine?: boolean;
};

export async function uploadMarketListingImage(uri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, `uri` is a blob:/data: URL — real browsers need an actual Blob, not RN's { uri, name, type } shape.
    const blob = await (await fetch(uri)).blob();
    const extension = blob.type.split('/')[1] ?? 'jpg';
    formData.append('file', blob, `photo-${Date.now()}.${extension}`);
  } else {
    const fileName = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
    const extensionMatch = /\.(\w+)$/.exec(fileName);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    } as unknown as Blob);
  }

  // Note: don't set Content-Type — fetch adds the multipart boundary itself.
  // But we must still attach the auth token, since this endpoint requires [Authorize].
  const response = await fetch(`${API_URL}/api/marketlistings/upload-image`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }

  const data = (await response.json()) as { imagePath: string };
  return data.imagePath;
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
