import { apiFetch, uploadImage } from '@/services/api-client';
import type { Farm, FarmInput } from '@/types/farm';

export function uploadFarmImage(file: File): Promise<string> {
  return uploadImage(file, '/api/farms/upload-image');
}

export function getFarms() {
  return apiFetch<Farm[]>('/api/farms');
}

export function getFarm(id: number) {
  return apiFetch<Farm>(`/api/farms/${id}`);
}

export function createFarm(farm: FarmInput) {
  return apiFetch<Farm>('/api/farms', {
    method: 'POST',
    body: JSON.stringify(farm),
  });
}

export function updateFarm(id: number, farm: Farm) {
  return apiFetch<void>(`/api/farms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(farm),
  });
}

/**
 * Takes land out of use. It is marked rather than dropped — everything recorded on it cascades off
 * the row — so it keeps coming back from `getFarms`, with `isRemoved` set, and the land page shows
 * it disabled. Reversible with {@link restoreFarm}.
 */
export function deleteFarm(id: number) {
  return apiFetch<void>(`/api/farms/${id}`, {
    method: 'DELETE',
  });
}

/** Puts removed land back into use. Answers 402 when the plan has no room for it any more. */
export function restoreFarm(id: number) {
  return apiFetch<void>(`/api/farms/${id}/restore`, {
    method: 'POST',
  });
}
