import { Platform } from 'react-native';

import { API_URL, ApiError, apiFetch, authHeaders } from '@/services/api-client';
import type { AuthResponse, LoginRequest, RegisterRequest, UpdateProfileRequest, User } from '@/types/auth';

export function login(request: LoginRequest) {
  return apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function register(request: RegisterRequest) {
  return apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function updateProfile(request: UpdateProfileRequest) {
  return apiFetch<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export async function uploadProfileImage(uri: string): Promise<string> {
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
  const response = await fetch(`${API_URL}/api/auth/profile/upload-image`, {
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
