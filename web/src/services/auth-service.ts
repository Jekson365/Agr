import { apiFetch, uploadImage } from '@/services/api-client';
import type {
  AuthResponse,
  DailyBonusResponse,
  GoogleAuthRequest,
  LoginRequest,
  PhoneLoginRequest,
  PhoneRegisterRequest,
  RegisterRequest,
  SendPhoneCodeRequest,
  SendPhoneCodeResponse,
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

/**
 * Takes today's sign-in bonus if it is still going. Safe to call on every start — the server pays
 * only the first of each day and answers `granted: false` to the rest.
 */
export function claimDailyBonus() {
  return apiFetch<DailyBonusResponse>('/api/auth/daily-bonus', { method: 'POST' });
}

/** Asks for a code to be texted to a number that is about to be registered. */
export function sendPhoneCode(request: SendPhoneCodeRequest) {
  return apiFetch<SendPhoneCodeResponse>('/api/auth/phone/send-code', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function registerByPhone(request: PhoneRegisterRequest) {
  return apiFetch<AuthResponse>('/api/auth/phone/register', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export function loginByPhone(request: PhoneLoginRequest) {
  return apiFetch<AuthResponse>('/api/auth/phone/login', {
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
