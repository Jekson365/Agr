import { apiFetch, uploadImage } from '@/services/api-client';
import type { Greenhouse, GreenhouseInput } from '@/types/greenhouse';

export function uploadGreenhouseImage(file: File): Promise<string> {
  return uploadImage(file, '/api/greenhouses/upload-image');
}

export function getGreenhouses() {
  return apiFetch<Greenhouse[]>('/api/greenhouses');
}

export function getGreenhouse(id: number) {
  return apiFetch<Greenhouse>(`/api/greenhouses/${id}`);
}

export function createGreenhouse(greenhouse: GreenhouseInput) {
  return apiFetch<Greenhouse>('/api/greenhouses', {
    method: 'POST',
    body: JSON.stringify(greenhouse),
  });
}

export function updateGreenhouse(id: number, greenhouse: Greenhouse) {
  return apiFetch<void>(`/api/greenhouses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(greenhouse),
  });
}

export function deleteGreenhouse(id: number) {
  return apiFetch<void>(`/api/greenhouses/${id}`, {
    method: 'DELETE',
  });
}
