import { apiFetch } from '@/services/api-client';
import type { PurchaseDocument, PurchaseInput } from '@/types/purchase';

export function getPurchases() {
  return apiFetch<PurchaseDocument[]>('/api/purchases');
}

export function getPurchase(id: number) {
  return apiFetch<PurchaseDocument>(`/api/purchases/${id}`);
}

export function createPurchase(input: PurchaseInput) {
  return apiFetch<PurchaseDocument>('/api/purchases', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Removes a document and rolls back everything it added. Fails with 409 when part of what it
 *  brought in is already used up. */
export function deletePurchase(id: number) {
  return apiFetch<void>(`/api/purchases/${id}`, { method: 'DELETE' });
}

/** Rewrites a document: the old lines come off the balances and the new ones go on, in one call.
 *  Fails with 409 when part of what the old lines added is already used up. */
export function updatePurchase(id: number, input: PurchaseInput) {
  return apiFetch<PurchaseDocument>(`/api/purchases/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
