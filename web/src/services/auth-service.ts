import { apiFetch, uploadImage } from '@/services/api-client';
import type {
  AuthResponse,
  GoogleAuthRequest,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  User,
} from '@/types/auth';

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

export function googleSignIn(request: GoogleAuthRequest) {
  return apiFetch<AuthResponse>('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function getCurrentUser() {
  return apiFetch<User>('/api/auth/me');
}

export function updateProfile(request: UpdateProfileRequest) {
  return apiFetch<User>('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(request),
  });
}

export function uploadProfileImage(file: File): Promise<string> {
  return uploadImage(file, '/api/auth/profile/upload-image');
}

export function updateLocation(latitude: number, longitude: number) {
  return apiFetch<User>('/api/auth/profile/location', {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude }),
  });
}
