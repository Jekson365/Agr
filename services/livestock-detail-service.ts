import { apiFetch, uploadImage } from '@/services/api-client';
import type { LivestockDetail, LivestockDetailInput } from '@/types/livestock-detail';

export function getLivestockDetails(livestockId: number) {
  return apiFetch<LivestockDetail[]>(`/api/livestockdetails?livestockId=${livestockId}`);
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

export function uploadLivestockDetailImage(uri: string): Promise<string> {
  return uploadImage(uri, '/api/livestockdetails/upload-image');
}
