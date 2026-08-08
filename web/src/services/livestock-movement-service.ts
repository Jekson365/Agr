import { apiFetch } from '@/services/api-client';
import type { LivestockMovement, LivestockMovementInput } from '@/types/livestock-movement';

export function getLivestockMovements(livestockId: number) {
  return apiFetch<LivestockMovement[]>(`/api/livestockmovements?livestockId=${livestockId}`);
}

/** Records a change and moves the group's head count by the same amount. */
export function createLivestockMovement(input: LivestockMovementInput) {
  return apiFetch<LivestockMovement>('/api/livestockmovements', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Removes an entry and takes its effect on the count back with it. */
export function deleteLivestockMovement(id: number) {
  return apiFetch<void>(`/api/livestockmovements/${id}`, {
    method: 'DELETE',
  });
}
