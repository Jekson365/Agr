import { apiFetch, uploadImage } from '@/services/api-client';
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

/** The artwork for a kind about to be added. Uploaded first, then passed as `imagePath` on the
 *  create — the row does not exist yet when the picture is chosen. */
export function uploadFruitKindImage(file: File): Promise<string> {
  return uploadImage(file, '/api/fruitkinds/upload-image');
}
