import { apiFetch } from '@/services/api-client';
import type { GreenhouseSeed, GreenhouseStock, GreenhouseStockWithSeedInput } from '@/types/greenhouse-stock';

/** All greenhouse stock, or just one greenhouse's. */
export function getGreenhouseStock(greenhouseId?: number) {
  return apiFetch<GreenhouseStock[]>(
    `/api/greenhousestocks${greenhouseId != null ? `?greenhouseId=${greenhouseId}` : ''}`
  );
}

/**
 * Creates greenhouse stock and the seed for the same crop in one call. The server makes both or
 * neither, so the pair can't end up half-created by a second request that never lands.
 */
export function createGreenhouseStockWithSeed(request: GreenhouseStockWithSeedInput) {
  return apiFetch<{ stock: GreenhouseStock; seed: GreenhouseSeed }>('/api/greenhousestocks/with-seed', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateGreenhouseStock(id: number, stock: GreenhouseStock) {
  return apiFetch<void>(`/api/greenhousestocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(stock),
  });
}

export function deleteGreenhouseStock(id: number) {
  return apiFetch<void>(`/api/greenhousestocks/${id}`, {
    method: 'DELETE',
  });
}

/** All greenhouse seed, or just one greenhouse's. */
export function getGreenhouseSeeds(greenhouseId?: number) {
  return apiFetch<GreenhouseSeed[]>(
    `/api/greenhouseseeds${greenhouseId != null ? `?greenhouseId=${greenhouseId}` : ''}`
  );
}

export function updateGreenhouseSeed(id: number, seed: GreenhouseSeed) {
  return apiFetch<void>(`/api/greenhouseseeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(seed),
  });
}

export function deleteGreenhouseSeed(id: number) {
  return apiFetch<void>(`/api/greenhouseseeds/${id}`, {
    method: 'DELETE',
  });
}
