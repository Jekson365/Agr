import { apiFetch } from '@/services/api-client';
import type { CreateWineBatchRequest, WineBatch, WineBatchSummary, WineStageChange } from '@/types/wine';

export function getWineBatches(includeDeleted = false) {
  return apiFetch<WineBatchSummary[]>(`/api/winebatches${includeDeleted ? '?includeDeleted=true' : ''}`);
}

export function getWineBatch(id: number) {
  return apiFetch<WineBatchSummary>(`/api/winebatches/${id}`);
}

export function getWineStages(id: number) {
  return apiFetch<WineStageChange[]>(`/api/winebatches/${id}/stages`);
}

export function createWineBatch(request: CreateWineBatchRequest) {
  return apiFetch<WineBatchSummary>('/api/winebatches', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateWineBatch(batch: WineBatch) {
  return apiFetch<void>(`/api/winebatches/${batch.id}`, {
    method: 'PUT',
    body: JSON.stringify(batch),
  });
}

export function setProducedLiters(id: number, liters: number) {
  return apiFetch<void>(`/api/winebatches/${id}/liters`, {
    method: 'PUT',
    body: JSON.stringify({ liters }),
  });
}

export function deleteWineBatch(id: number) {
  return apiFetch<void>(`/api/winebatches/${id}`, { method: 'DELETE' });
}
