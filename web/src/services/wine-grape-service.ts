import { apiFetch } from '@/services/api-client';
import type { WineBatchGrape } from '@/types/wine';

export function getWineGrapes(wineBatchId: number) {
  return apiFetch<WineBatchGrape[]>(`/api/winebatchgrapes?wineBatchId=${wineBatchId}`);
}

export function createWineGrape(grape: Omit<WineBatchGrape, 'id'>) {
  return apiFetch<WineBatchGrape>('/api/winebatchgrapes', {
    method: 'POST',
    body: JSON.stringify(grape),
  });
}

export function updateWineGrape(grape: WineBatchGrape) {
  return apiFetch<void>(`/api/winebatchgrapes/${grape.id}`, {
    method: 'PUT',
    body: JSON.stringify(grape),
  });
}

export function deleteWineGrape(id: number) {
  return apiFetch<void>(`/api/winebatchgrapes/${id}`, { method: 'DELETE' });
}
