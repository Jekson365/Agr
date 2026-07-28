import { apiFetch } from '@/services/api-client';
import type { Configuration } from '@/types/configuration';

export function getConfigurations() {
  return apiFetch<Configuration[]>('/api/configurations');
}

/** Switches one setting on or off, keyed by the name the client gates on. */
export function setConfiguration(name: string, value: number) {
  return apiFetch<Configuration>(`/api/configurations/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  });
}
