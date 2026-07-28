import { apiFetch, uploadImage } from '@/services/api-client';
import type { Farm, FarmInput } from '@/types/farm';

export function uploadFarmImage(uri: string): Promise<string> {
  return uploadImage(uri, '/api/farms/upload-image');
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

export function deleteFarm(id: number) {
  return apiFetch<void>(`/api/farms/${id}`, {
    method: 'DELETE',
  });
}
