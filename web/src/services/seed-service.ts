import { apiFetch } from '@/services/api-client';
import type { Seed, SeedInput } from '@/types/seed';
import type { SeedMovement } from '@/types/seed-movement';

export function getSeeds() {
  return apiFetch<Seed[]>('/api/seeds');
}

export function getSeed(id: number) {
  return apiFetch<Seed>(`/api/seeds/${id}`);
}

export function createSeed(seed: SeedInput) {
  return apiFetch<Seed>('/api/seeds', {
    method: 'POST',
    body: JSON.stringify(seed),
  });
}

export function updateSeed(id: number, seed: Seed) {
  return apiFetch<void>(`/api/seeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(seed),
  });
}

export function deleteSeed(id: number) {
  return apiFetch<void>(`/api/seeds/${id}`, {
    method: 'DELETE',
  });
}

/** A seed's history: the opening amount, manual corrections, and sowing deductions. */
export function getSeedMovements(seedId: number) {
  return apiFetch<SeedMovement[]>(`/api/seedmovements?seedId=${seedId}`);
}
