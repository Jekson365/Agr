import { apiFetch } from '@/services/api-client';
import type { WineOperation } from '@/types/wine';

export function getWineOperations(wineBatchId: number) {
  return apiFetch<WineOperation[]>(`/api/wineoperations?wineBatchId=${wineBatchId}`);
}

export function createWineOperation(operation: Omit<WineOperation, 'id'>) {
  return apiFetch<WineOperation>('/api/wineoperations', {
    method: 'POST',
    body: JSON.stringify(operation),
  });
}

export function updateWineOperation(operation: WineOperation) {
  return apiFetch<void>(`/api/wineoperations/${operation.id}`, {
    method: 'PUT',
    body: JSON.stringify(operation),
  });
}

export function deleteWineOperation(id: number) {
  return apiFetch<void>(`/api/wineoperations/${id}`, { method: 'DELETE' });
}
