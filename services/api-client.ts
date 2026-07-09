export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5261';

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
