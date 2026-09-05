import { apiFetch } from '@/services/api-client';
import type { CurrentWeather, WeatherForecast } from '@/types/weather';

export const MAX_FORECAST_DAYS = 14;

export function getCurrentWeather(location?: string) {
  const query = location ? `?location=${encodeURIComponent(location)}` : '';
  return apiFetch<CurrentWeather>(`/api/weather${query}`);
}

export function getWeatherForecast(location?: string, days = MAX_FORECAST_DAYS) {
  const place = location ? `&location=${encodeURIComponent(location)}` : '';
  return apiFetch<WeatherForecast>(`/api/weather/forecast?days=${days}${place}`);
}
