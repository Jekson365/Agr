import { apiFetch } from '@/services/api-client';
import type { AnimalProduction, AnimalProductionInput } from '@/types/animal-production';

export function getAnimalProductions(animalId: number) {
  return apiFetch<AnimalProduction[]>(`/api/animalproductions?animalId=${animalId}`);
}

export function getLivestockProductions(livestockId: number) {
  return apiFetch<AnimalProduction[]>(`/api/animalproductions?livestockId=${livestockId}`);
}

export function createAnimalProduction(input: AnimalProductionInput) {
  return apiFetch<AnimalProduction>('/api/animalproductions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function deleteAnimalProduction(id: number) {
  return apiFetch<void>(`/api/animalproductions/${id}`, {
    method: 'DELETE',
  });
}
