import { apiFetch } from '@/services/api-client';
import type { LivestockKind, LivestockKindInput } from '@/types/livestock-kind';

export function getLivestockKinds() {
  return apiFetch<LivestockKind[]>('/api/livestockkinds');
}

export function createLivestockKind(kind: LivestockKindInput) {
  return apiFetch<LivestockKind>('/api/livestockkinds', {
    method: 'POST',
    body: JSON.stringify(kind),
  });
}

/** Fails with 409 when livestock groups still reference the kind. */
export function deleteLivestockKind(id: number) {
  return apiFetch<void>(`/api/livestockkinds/${id}`, {
    method: 'DELETE',
  });
}
