import { apiFetch } from '@/services/api-client';
import type { WineAdjustment, WineMovement } from '@/types/wine';

export function getWineMovements(wineBatchId?: number) {
  return apiFetch<WineMovement[]>(`/api/winemovements${wineBatchId != null ? `?wineBatchId=${wineBatchId}` : ''}`);
}

export function adjustWine(adjustment: WineAdjustment) {
  return apiFetch<WineMovement>('/api/winemovements', {
    method: 'POST',
    body: JSON.stringify(adjustment),
  });
}

export function deleteWineMovement(id: number) {
  return apiFetch<void>(`/api/winemovements/${id}`, { method: 'DELETE' });
}

export function recordWineSale(
  wineBatchId: number,
  quantity: number,
  bottles: boolean,
  revenue: number | null,
  wineBottlingId: number | null
) {
  return apiFetch<WineMovement>('/api/winemovements/sale', {
    method: 'POST',
    body: JSON.stringify({ wineBatchId, quantity, bottles, revenue, wineBottlingId }),
  });
}
