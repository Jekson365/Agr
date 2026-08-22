import { apiFetch } from '@/services/api-client';
import type { Configuration } from '@/types/configuration';

/** This tenant's switches. Read-only: changing one is the platform operator's to do, through
 *  {@link setUserConfiguration} on the admin service. */
export function getConfigurations() {
  return apiFetch<Configuration[]>('/api/configurations');
}
