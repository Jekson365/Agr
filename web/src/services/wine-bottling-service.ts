import { apiFetch } from '@/services/api-client';
import type { WineBottling } from '@/types/wine';

export function getWineBottlings(wineBatchId?: number) {
  return apiFetch<WineBottling[]>(`/api/winebottlings${wineBatchId != null ? `?wineBatchId=${wineBatchId}` : ''}`);
}

export function createWineBottling(bottling: Omit<WineBottling, 'id'>) {
  return apiFetch<WineBottling>('/api/winebottlings', {
    method: 'POST',
    body: JSON.stringify(bottling),
  });
}

export function updateWineBottling(bottling: WineBottling) {
  return apiFetch<void>(`/api/winebottlings/${bottling.id}`, {
    method: 'PUT',
    body: JSON.stringify(bottling),
  });
}

export function deleteWineBottling(id: number) {
  return apiFetch<void>(`/api/winebottlings/${id}`, { method: 'DELETE' });
}
