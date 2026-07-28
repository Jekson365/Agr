import { apiFetch } from '@/services/api-client';
import type { HarvestTree, HarvestTreeInput } from '@/types/harvest-tree';

export function getHarvestTrees(harvestId: number) {
  return apiFetch<HarvestTree[]>(`/api/harvesttrees?harvestId=${harvestId}`);
}

export function createHarvestTree(harvestTree: HarvestTreeInput) {
  return apiFetch<HarvestTree>('/api/harvesttrees', {
    method: 'POST',
    body: JSON.stringify(harvestTree),
  });
}

export function updateHarvestTree(id: number, harvestTree: HarvestTree) {
  return apiFetch<void>(`/api/harvesttrees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestTree),
  });
}

export function deleteHarvestTree(id: number) {
  return apiFetch<void>(`/api/harvesttrees/${id}`, {
    method: 'DELETE',
  });
}
