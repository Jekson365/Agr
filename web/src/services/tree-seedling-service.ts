import { apiFetch } from '@/services/api-client';
import type { PlantOutRequest, TreeSeedling, TreeSeedlingInput } from '@/types/tree-seedling';

export function getTreeSeedlings() {
  return apiFetch<TreeSeedling[]>('/api/treeseedlings');
}

export function createTreeSeedling(seedling: TreeSeedlingInput) {
  return apiFetch<TreeSeedling>('/api/treeseedlings', {
    method: 'POST',
    body: JSON.stringify(seedling),
  });
}

export function updateTreeSeedling(id: number, seedling: TreeSeedling) {
  return apiFetch<void>(`/api/treeseedlings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(seedling),
  });
}

export function deleteTreeSeedling(id: number) {
  return apiFetch<void>(`/api/treeseedlings/${id}`, {
    method: 'DELETE',
  });
}

/** Moves the batch outside: adds the planted count to the orchard and logs it in that orchard's
 *  history. The batch is settled afterwards — it takes no further edits. */
export function plantOutTreeSeedling(id: number, request: PlantOutRequest) {
  return apiFetch<TreeSeedling>(`/api/treeseedlings/${id}/plant-out`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
