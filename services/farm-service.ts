import { Platform } from 'react-native';

import { API_URL, ApiError, apiFetch, authHeaders } from '@/services/api-client';
import type { Farm, FarmInput } from '@/types/farm';

export async function uploadFarmImage(uri: string): Promise<string> {
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
  const response = await fetch(`${API_URL}/api/farms/upload-image`, {
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
