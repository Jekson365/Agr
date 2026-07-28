import { apiFetch } from '@/services/api-client';
import type { HarvestChemical, HarvestChemicalInput } from '@/types/harvest-chemical';

export function getHarvestChemicals(harvestId: number) {
  return apiFetch<HarvestChemical[]>(`/api/harvestchemicals?harvestId=${harvestId}`);
}

export function createHarvestChemical(harvestChemical: HarvestChemicalInput) {
  return apiFetch<HarvestChemical>('/api/harvestchemicals', {
    method: 'POST',
    body: JSON.stringify(harvestChemical),
  });
}

export function updateHarvestChemical(id: number, harvestChemical: HarvestChemical) {
  return apiFetch<void>(`/api/harvestchemicals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestChemical),
  });
}

export function deleteHarvestChemical(id: number) {
  return apiFetch<void>(`/api/harvestchemicals/${id}`, {
    method: 'DELETE',
  });
}
