import { apiFetch, uploadImage } from '@/services/api-client';
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

/** The artwork for a kind about to be added. Uploaded first, then passed as `imagePath` on the
 *  create — the row does not exist yet when the picture is chosen. */
export function uploadLivestockKindImage(file: File): Promise<string> {
  return uploadImage(file, '/api/livestockkinds/upload-image');
}
