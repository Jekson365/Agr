import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

import type { User } from '@/types/auth';

// SecureStore is native-only; fall back to localStorage on web (react-native-web).
const KEY = 'farm.auth.session';

export type Session = {
  token: string;
  user: User;
};

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(KEY);
  }
  return SecureStore.getItemAsync(KEY);
}

export async function saveSession(session: Session): Promise<void> {
  const raw = JSON.stringify(session);
  if (Platform.OS === 'web') {
    localStorage.setItem(KEY, raw);
    return;
  }
  await SecureStore.setItemAsync(KEY, raw);
}

export async function loadSession(): Promise<Session | null> {
  const raw = await readRaw();
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(KEY);
    return;
  }
  await SecureStore.deleteItemAsync(KEY);
}
