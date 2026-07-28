import { apiFetch } from '@/services/api-client';
import type { HarvestSeed, HarvestSeedInput } from '@/types/harvest-seed';

export function getHarvestSeeds(harvestId: number) {
  return apiFetch<HarvestSeed[]>(`/api/harvestseeds?harvestId=${harvestId}`);
}

/** Recording seed usage deducts the amount from that seed and logs it in the seed's history. */
export function createHarvestSeed(harvestSeed: HarvestSeedInput) {
  return apiFetch<HarvestSeed>('/api/harvestseeds', {
    method: 'POST',
    body: JSON.stringify(harvestSeed),
  });
}

export function updateHarvestSeed(id: number, harvestSeed: HarvestSeed) {
  return apiFetch<void>(`/api/harvestseeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestSeed),
  });
}

/** Removing the row returns its amount to the seed. */
export function deleteHarvestSeed(id: number) {
  return apiFetch<void>(`/api/harvestseeds/${id}`, {
    method: 'DELETE',
  });
}
