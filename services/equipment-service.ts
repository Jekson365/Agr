import { Platform } from 'react-native';

import { API_URL, ApiError, apiFetch, authHeaders } from '@/services/api-client';
import type { Equipment, EquipmentInput } from '@/types/equipment';

export async function uploadEquipmentImage(uri: string): Promise<string> {
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, `uri` is a blob:/data: URL — real browsers need an actual Blob, not RN's { uri, name, type } shape.
    const blob = await (await fetch(uri)).blob();
    const extension = blob.type.split('/')[1] ?? 'jpg';
    formData.append('file', blob, `photo-${Date.now()}.${extension}`);
  } else {
    const fileName = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
    const extensionMatch = /\.(\w+)$/.exec(fileName);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    formData.append('file', {
      uri,
      name: fileName,
      type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    } as unknown as Blob);
  }

  // Note: don't set Content-Type — fetch adds the multipart boundary itself.
  // But we must still attach the auth token, since this endpoint requires [Authorize].
  const response = await fetch(`${API_URL}/api/equipment/upload-image`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }

  const data = (await response.json()) as { imagePath: string };
  return data.imagePath;
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
