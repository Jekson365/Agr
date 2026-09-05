import { apiFetch } from '@/services/api-client';
import type { OrchardBlock, OrchardBlockInput } from '@/types/orchard-block';

export function getOrchardBlocks() {
  return apiFetch<OrchardBlock[]>('/api/orchardblocks');
}

export function createOrchardBlock(block: OrchardBlockInput) {
  return apiFetch<OrchardBlock>('/api/orchardblocks', {
    method: 'POST',
    body: JSON.stringify(block),
  });
}

export function updateOrchardBlock(id: number, block: OrchardBlock) {
  return apiFetch<void>(`/api/orchardblocks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(block),
  });
}

export function deleteOrchardBlock(id: number) {
  return apiFetch<void>(`/api/orchardblocks/${id}`, {
    method: 'DELETE',
  });
}
