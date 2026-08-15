import { ApiError, apiFetch } from '@/services/api-client';
import type { ProductionType } from '@/types/production-type';

export function getProductionTypes() {
  return apiFetch<ProductionType[]>('/api/productiontypes');
}

/** Adds a type. Fails with a 409 when that name is already taken — which is what tells a form
 *  the name a user typed is a duplicate. Use {@link ensureProductionType} where the name is
 *  derived rather than typed and the existing type is the wanted one. */
export function createProductionType(name: string) {
  return apiFetch<ProductionType>('/api/productiontypes', {
    method: 'POST',
    body: JSON.stringify({ id: 0, name }),
  });
}

/**
 * The type carrying this name, whether it had to be created or was already there.
 *
 * For names the app derives rather than a user types — a group's own meat, named after the group.
 * Such a name being taken means the type is already sitting in the catalog, which is the one to
 * use: a group whose meat was created but never linked back to it (a group creation that failed
 * after the type was made, or a group deleted while its meat stayed behind) would otherwise be
 * refused its meat for good, every attempt POSTing the same name into the same 409.
 */
export async function ensureProductionType(name: string): Promise<ProductionType> {
  try {
    return await createProductionType(name);
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 409) {
      throw err;
    }
    const wanted = name.trim().toLowerCase();
    // Matched the way the server checks the name it just refused on: case-insensitively.
    const existing = (await getProductionTypes()).find((pt) => pt.name.trim().toLowerCase() === wanted);
    if (!existing) {
      throw err;
    }
    return existing;
  }
}

/** Fails with a 409 when production records still reference the type. */
export function deleteProductionType(id: number) {
  return apiFetch<void>(`/api/productiontypes/${id}`, {
    method: 'DELETE',
  });
}
