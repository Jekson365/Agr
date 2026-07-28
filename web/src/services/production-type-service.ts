import { apiFetch } from '@/services/api-client';
import type { ProductionType } from '@/types/production-type';

export function getProductionTypes() {
  return apiFetch<ProductionType[]>('/api/productiontypes');
}

/** Adds a type, or returns the existing one when that name is already present. */
export function createProductionType(name: string) {
  return apiFetch<ProductionType>('/api/productiontypes', {
    method: 'POST',
    body: JSON.stringify({ id: 0, name }),
  });
}

/** Fails with a 409 when production records still reference the type. */
export function deleteProductionType(id: number) {
  return apiFetch<void>(`/api/productiontypes/${id}`, {
    method: 'DELETE',
  });
}
