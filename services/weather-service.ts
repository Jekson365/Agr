import { apiFetch } from '@/services/api-client';
import type { CurrentWeather } from '@/types/weather';

export function getCurrentWeather(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : '';
  return apiFetch<CurrentWeather>(`/api/weather${query}`);
}