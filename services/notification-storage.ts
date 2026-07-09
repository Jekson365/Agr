import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Tracks the last calendar day (YYYY-MM-DD) each user was shown the "today's events"
// notification, so it's only created once per day per user.
const KEY_PREFIX = 'farm.notifications.lastDate.';

function keyFor(userId: number): string {
  return `${KEY_PREFIX}${userId}`;
}

export async function getLastNotifiedDate(userId: number): Promise<string | null> {
  const key = keyFor(userId);
  if (Platform.OS === 'web') {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setLastNotifiedDate(userId: number, date: string): Promise<void> {
  const key = keyFor(userId);
  if (Platform.OS === 'web') {
    localStorage.setItem(key, date);
    return;
  }
  await SecureStore.setItemAsync(key, date);
}
