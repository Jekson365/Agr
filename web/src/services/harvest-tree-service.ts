import { apiFetch } from '@/services/api-client';
import type { HarvestTree, HarvestTreeInput } from '@/types/harvest-tree';

export function getHarvestTrees(harvestId: number) {
  return apiFetch<HarvestTree[]>(`/api/harvesttrees?harvestId=${harvestId}`);
}

/** The fruit entries some harvest already records as picked — those have produce on the books, so
 *  the product they yield is settled. */
export function getPickedTreeStockIds() {
  return apiFetch<number[]>('/api/harvesttrees/picked-tree-stocks');
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
