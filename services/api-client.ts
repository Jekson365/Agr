import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Platform } from 'react-native';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5261';

// Caps how large a picked photo can be before upload, well under the server's request size
// limit (see [RequestSizeLimit] on the upload endpoints) — full-res phone camera photos can
// otherwise exceed it and get rejected with a 413.
const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_JPEG_QUALITY = 0.7;

async function compressImageForUpload(uri: string): Promise<string> {
  if (Platform.OS === 'web') {
    // On web the picker already returns a browser-native blob:/data: URL at a reasonable size.
    return uri;
  }

  const context = ImageManipulator.manipulate(uri).resize({ width: MAX_UPLOAD_DIMENSION });
  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: UPLOAD_JPEG_QUALITY });
  return result.uri;
}

export function resolveAssetUrl(path: string): string {
  if (!path || /^https?:\/\//.test(path)) {
    return path;
  }
  return `${API_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// In-memory copy of the JWT so every request can attach it without an async storage read.
// Kept in sync by the auth layer (see contexts/auth-context.tsx).
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Authorization header for the current session, or an empty object when signed out.
 * Use this for requests that can't go through `apiFetch` (e.g. multipart uploads that
 * must let `fetch` set their own `Content-Type` boundary).
 */
export function authHeaders(): Record<string, string> {
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

/**
 * Compresses a locally picked image and packages it into multipart `FormData` under the `file`
 * field, ready to POST to any endpoint that accepts an `IFormFile`.
 */
export async function buildImageFormData(uri: string): Promise<FormData> {
  const compressedUri = await compressImageForUpload(uri);
  const formData = new FormData();

  if (Platform.OS === 'web') {
    // On web, `uri` is a blob:/data: URL — real browsers need an actual Blob, not RN's { uri, name, type } shape.
    const blob = await (await fetch(compressedUri)).blob();
    const extension = blob.type.split('/')[1] ?? 'jpg';
    formData.append('file', blob, `photo-${Date.now()}.${extension}`);
  } else {
    const fileName = compressedUri.split('/').pop() ?? `photo-${Date.now()}.jpg`;
    const extensionMatch = /\.(\w+)$/.exec(fileName);
    const extension = extensionMatch ? extensionMatch[1].toLowerCase() : 'jpg';
    formData.append('file', {
      uri: compressedUri,
      name: fileName,
      type: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    } as unknown as Blob);
  }

  return formData;
}

/**
 * POSTs multipart `FormData` (e.g. from {@link buildImageFormData}) to `endpoint` and returns the
 * parsed JSON response. Note: don't set Content-Type — fetch adds the multipart boundary itself.
 */
export async function postImageFormData<T>(endpoint: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }

  return (await response.json()) as T;
}

/**
 * Uploads a locally picked image (compressing it first, on native) to a multipart `/upload-image`
 * endpoint and returns the resulting server-relative image path.
 */
export async function uploadImage(uri: string, endpoint: string): Promise<string> {
  const formData = await buildImageFormData(uri);
  const data = await postImageFormData<{ imagePath: string }>(endpoint, formData);
  return data.imagePath;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
