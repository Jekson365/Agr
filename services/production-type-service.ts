import { apiFetch } from '@/services/api-client';
import type { ProductionType } from '@/types/production-type';

export function getProductionTypes() {
  return apiFetch<ProductionType[]>('/api/productiontypes');
}
