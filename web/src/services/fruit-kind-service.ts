import { apiFetch } from '@/services/api-client';
import type { FruitKind, FruitKindInput } from '@/types/fruit-kind';

export function getFruitKinds() {
  return apiFetch<FruitKind[]>('/api/fruitkinds');
}

export function createFruitKind(kind: FruitKindInput) {
  return apiFetch<FruitKind>('/api/fruitkinds', {
    method: 'POST',
    body: JSON.stringify(kind),
  });
}

/** Fails with 409 when tree stock rows still reference the kind. */
export function deleteFruitKind(id: number) {
  return apiFetch<void>(`/api/fruitkinds/${id}`, {
    method: 'DELETE',
  });
}
