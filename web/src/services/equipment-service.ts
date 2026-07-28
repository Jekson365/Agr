import { apiFetch, uploadImage } from '@/services/api-client';
import type { Equipment, EquipmentInput } from '@/types/equipment';

export function uploadEquipmentImage(file: File): Promise<string> {
  return uploadImage(file, '/api/equipment/upload-image');
}

export function getEquipment() {
  return apiFetch<Equipment[]>('/api/equipment');
}

export function getEquipmentItem(id: number) {
  return apiFetch<Equipment>(`/api/equipment/${id}`);
}

export function createEquipment(equipment: EquipmentInput) {
  return apiFetch<Equipment>('/api/equipment', {
    method: 'POST',
    body: JSON.stringify(equipment),
  });
}

export function updateEquipment(id: number, equipment: Equipment) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: 'PUT',
    body: JSON.stringify(equipment),
  });
}

export function deleteEquipment(id: number) {
  return apiFetch<void>(`/api/equipment/${id}`, {
    method: 'DELETE',
  });
}
