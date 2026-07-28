import { apiFetch } from '@/services/api-client';
import type { GreenhouseFloor, GreenhouseFloorInput } from '@/types/greenhouse-floor';

export function getGreenhouseFloors(greenhouseId: number) {
  return apiFetch<GreenhouseFloor[]>(`/api/greenhousefloors?greenhouseId=${greenhouseId}`);
}

export function createGreenhouseFloor(floor: GreenhouseFloorInput) {
  return apiFetch<GreenhouseFloor>('/api/greenhousefloors', {
    method: 'POST',
    body: JSON.stringify(floor),
  });
}

/** Renames a floor — its order and greenhouse are fixed once created. */
export function updateGreenhouseFloor(id: number, floor: GreenhouseFloor) {
  return apiFetch<void>(`/api/greenhousefloors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(floor),
  });
}

/** Deletes the floor and, with it, every section placed on it. */
export function deleteGreenhouseFloor(id: number) {
  return apiFetch<void>(`/api/greenhousefloors/${id}`, {
    method: 'DELETE',
  });
}
