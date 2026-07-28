import { apiFetch } from '@/services/api-client';
import type { ProductionMovement } from '@/types/production-movement';

export function getProductionMovements() {
  return apiFetch<ProductionMovement[]>('/api/productionmovements');
}

/** Rolls back a recorded sale, returning its quantity to the balance. */
export function deleteProductionMovement(id: number) {
  return apiFetch<void>(`/api/productionmovements/${id}`, {
    method: 'DELETE',
  });
}

/** Deducts a sold quantity from a production type/unit balance and logs a Market movement.
 * `marketListingId` ties the movement to the listing so rolling it back can restore it. */
export function recordProductionSale(
  productionTypeId: number,
  unitId: number,
  quantity: number,
  marketListingId?: number
) {
  return apiFetch<ProductionMovement>('/api/productionmovements/sale', {
    method: 'POST',
    body: JSON.stringify({ productionTypeId, unitId, quantity, marketListingId: marketListingId ?? null }),
  });
}
