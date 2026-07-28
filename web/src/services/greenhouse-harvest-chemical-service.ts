import { apiFetch } from '@/services/api-client';
import type { GreenhouseHarvestChemical, GreenhouseHarvestChemicalInput } from '@/types/greenhouse-harvest-chemical';

export function getGreenhouseHarvestChemicals(greenhouseHarvestId: number) {
  return apiFetch<GreenhouseHarvestChemical[]>(`/api/greenhouseharvestchemicals?greenhouseHarvestId=${greenhouseHarvestId}`);
}

export function createGreenhouseHarvestChemical(harvestChemical: GreenhouseHarvestChemicalInput) {
  return apiFetch<GreenhouseHarvestChemical>('/api/greenhouseharvestchemicals', {
    method: 'POST',
    body: JSON.stringify(harvestChemical),
  });
}

export function updateGreenhouseHarvestChemical(id: number, harvestChemical: GreenhouseHarvestChemical) {
  return apiFetch<void>(`/api/greenhouseharvestchemicals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestChemical),
  });
}

export function deleteGreenhouseHarvestChemical(id: number) {
  return apiFetch<void>(`/api/greenhouseharvestchemicals/${id}`, {
    method: 'DELETE',
  });
}
