import { apiFetch } from '@/services/api-client';
import type { Livestock, LivestockInput } from '@/types/livestock';

export function getLivestock() {
  return apiFetch<Livestock[]>('/api/livestock');
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
