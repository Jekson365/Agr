import { apiFetch } from '@/services/api-client';
import type { Seed } from '@/types/seed';
import type { SeedMovement } from '@/types/seed-movement';

// Read-only on purpose: seed is created with the stock of the crop it grows
// (see createStockWithSeed), goes out of use with that stock, and its amount moves only by being
// sown against a harvest. Nothing here may add, edit or remove one.

/** The seed on hand. Seed removed with the stock it grows into is left out unless
 *  `includeDeleted` asks for it — see {@link getStock}. */
export function getSeeds(includeDeleted = false) {
  return apiFetch<Seed[]>(`/api/seeds${includeDeleted ? '?includeDeleted=true' : ''}`);
}

export function getSeed(id: number) {
  return apiFetch<Seed>(`/api/seeds/${id}`);
}

/** A seed's history: the opening amount, manual corrections, and sowing deductions. */
export function getSeedMovements(seedId: number) {
  return apiFetch<SeedMovement[]>(`/api/seedmovements?seedId=${seedId}`);
}
