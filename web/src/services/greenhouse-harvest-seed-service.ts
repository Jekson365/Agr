import { apiFetch } from '@/services/api-client';
import type { GreenhouseHarvestSeed, GreenhouseHarvestSeedInput } from '@/types/greenhouse-harvest-seed';

export function getGreenhouseHarvestSeeds(greenhouseHarvestId: number) {
  return apiFetch<GreenhouseHarvestSeed[]>(`/api/greenhouseharvestseeds?greenhouseHarvestId=${greenhouseHarvestId}`);
}

/** Recording seed usage deducts the amount from that greenhouse seed. */
export function createGreenhouseHarvestSeed(harvestSeed: GreenhouseHarvestSeedInput) {
  return apiFetch<GreenhouseHarvestSeed>('/api/greenhouseharvestseeds', {
    method: 'POST',
    body: JSON.stringify(harvestSeed),
  });
}

export function updateGreenhouseHarvestSeed(id: number, harvestSeed: GreenhouseHarvestSeed) {
  return apiFetch<void>(`/api/greenhouseharvestseeds/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestSeed),
  });
}

/** Removing the row returns its amount to the seed. */
export function deleteGreenhouseHarvestSeed(id: number) {
  return apiFetch<void>(`/api/greenhouseharvestseeds/${id}`, {
    method: 'DELETE',
  });
}
