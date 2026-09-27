import { ApiError } from '@/services/api-client';

export type AuthMode = 'login' | 'register';
export type AuthMethod = 'phone' | 'email';

export type AuthValues = {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export const EMPTY_VALUES: AuthValues = { name: '', email: '', phone: '', password: '', confirmPassword: '' };

type Translate = (key: string) => string;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s()-]{9,}$/;

export function validateAuth(mode: AuthMode, method: AuthMethod, values: AuthValues, t: Translate): string | null {
  const identifier = method === 'email' ? values.email.trim() : values.phone.trim();
  if (!identifier || !values.password || (mode === 'register' && !values.name.trim())) {
    return t('auth.errorFillFields');
  }
  if (method === 'email' && !EMAIL_PATTERN.test(identifier)) {
    return t('auth.errorInvalidEmail');
  }
  if (method === 'phone' && !PHONE_PATTERN.test(identifier)) {
    return t('auth.errorInvalidPhone');
  }
  if (mode === 'register') {
    if (values.password.length < 6) {
      return t('auth.errorPasswordShort');
    }
    if (values.password !== values.confirmPassword) {
      return t('auth.errorPasswordMismatch');
    }
  }
  return null;
}

export function authErrorMessage(err: unknown, method: AuthMethod, t: Translate): string {
  console.error('[login] request failed:', err);
  if (err instanceof ApiError) {
    if (err.status === 401) {
      return method === 'phone' ? t('auth.errorInvalidPhoneCredentials') : t('auth.errorInvalidCredentials');
    }
    if (err.status === 409) {
      return method === 'phone' ? t('auth.errorPhoneExists') : t('auth.errorEmailExists');
    }
    if (err.status === 400 && method === 'phone') {
      return t('auth.errorInvalidPhone');
    }
  }
  return t('auth.errorGeneric');
}
