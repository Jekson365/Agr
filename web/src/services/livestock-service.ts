import { apiFetch } from '@/services/api-client';
import type { Livestock, LivestockInput } from '@/types/livestock';

/**
 * The groups the farm keeps. Removed ones are left out, which is what keeps them off the livestock
 * page. Pass `includeDeleted` where a removed group still has to be named — the balance's removed
 * holdings, and anywhere history collected from it is read back.
 */
export function getLivestock(includeDeleted = false) {
  return apiFetch<Livestock[]>(`/api/livestock${includeDeleted ? '?includeDeleted=true' : ''}`);
}

export function getLivestockItem(id: number) {
  return apiFetch<Livestock>(`/api/livestock/${id}`);
}

export function createLivestock(livestock: LivestockInput) {
  return apiFetch<Livestock>('/api/livestock', {
    method: 'POST',
    body: JSON.stringify(livestock),
  });
}

export function updateLivestock(id: number, livestock: Livestock) {
  return apiFetch<void>(`/api/livestock/${id}`, {
    method: 'PUT',
    body: JSON.stringify(livestock),
  });
}

export function deleteLivestock(id: number) {
  return apiFetch<void>(`/api/livestock/${id}`, {
    method: 'DELETE',
  });
}
