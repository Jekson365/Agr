import { apiFetch, uploadImage } from '@/services/api-client';
import type { LivestockDetail, LivestockDetailInput } from '@/types/livestock-detail';

export function getLivestockDetails(livestockId: number) {
  return apiFetch<LivestockDetail[]>(`/api/livestockdetails?livestockId=${livestockId}`);
}

/** Every animal on the farm. A family tree spans groups, so it cannot be built from one. */
export function getAllLivestockDetails() {
  return apiFetch<LivestockDetail[]>('/api/livestockdetails');
}

export function getLivestockDetailItem(id: number) {
  return apiFetch<LivestockDetail>(`/api/livestockdetails/${id}`);
}

export function createLivestockDetail(detail: LivestockDetailInput) {
  return apiFetch<LivestockDetail>('/api/livestockdetails', {
    method: 'POST',
    body: JSON.stringify(detail),
  });
}

export function updateLivestockDetail(id: number, detail: LivestockDetail) {
  return apiFetch<void>(`/api/livestockdetails/${id}`, {
    method: 'PUT',
    body: JSON.stringify(detail),
  });
}

export function deleteLivestockDetail(id: number) {
  return apiFetch<void>(`/api/livestockdetails/${id}`, {
    method: 'DELETE',
  });
}

export function uploadLivestockDetailImage(file: File): Promise<string> {
  return uploadImage(file, '/api/livestockdetails/upload-image');
}

