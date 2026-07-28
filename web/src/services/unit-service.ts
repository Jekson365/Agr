import { apiFetch } from '@/services/api-client';
import type { Unit } from '@/types/unit';

export function getUnits() {
  return apiFetch<Unit[]>('/api/units');
}
