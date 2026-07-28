import { apiFetch } from '@/services/api-client';
import type {
  HarvestProduct,
  HarvestProductInput,
  TreeProduct,
  TreeProductInput,
  TreeProductMovement,
} from '@/types/tree-product';

export function getTreeProducts() {
  return apiFetch<TreeProduct[]>('/api/treeproducts');
}

export function createTreeProduct(product: TreeProductInput) {
  return apiFetch<TreeProduct>('/api/treeproducts', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}

export function updateTreeProduct(id: number, product: TreeProduct) {
  return apiFetch<void>(`/api/treeproducts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  });
}

export function deleteTreeProduct(id: number) {
  return apiFetch<void>(`/api/treeproducts/${id}`, {
    method: 'DELETE',
  });
}

/** Harvested amounts: one harvest's, or every harvest's for the Products totals. */
export function getHarvestProducts(harvestId?: number) {
  return apiFetch<HarvestProduct[]>(`/api/harvestproducts${harvestId != null ? `?harvestId=${harvestId}` : ''}`);
}

export function createHarvestProduct(harvestProduct: HarvestProductInput) {
  return apiFetch<HarvestProduct>('/api/harvestproducts', {
    method: 'POST',
    body: JSON.stringify(harvestProduct),
  });
}

export function updateHarvestProduct(id: number, harvestProduct: HarvestProduct) {
  return apiFetch<void>(`/api/harvestproducts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(harvestProduct),
  });
}

export function deleteHarvestProduct(id: number) {
  return apiFetch<void>(`/api/harvestproducts/${id}`, {
    method: 'DELETE',
  });
}

/** A product's movement history, or every product's for the balance totals. */
export function getTreeProductMovements(treeProductId?: number) {
  return apiFetch<TreeProductMovement[]>(
    `/api/treeproductmovements${treeProductId != null ? `?treeProductId=${treeProductId}` : ''}`
  );
}

/** A manual adjustment to a product's balance — positive to add, negative to draw down. */
export function createTreeProductMovement(treeProductId: number, delta: number) {
  return apiFetch<TreeProductMovement>('/api/treeproductmovements', {
    method: 'POST',
    body: JSON.stringify({ treeProductId, delta }),
  });
}

/** Records a sale — a negative Market movement. Fails with 409 if it exceeds the balance. */
export function recordTreeProductSale(treeProductId: number, quantity: number) {
  return apiFetch<TreeProductMovement>('/api/treeproductmovements/sale', {
    method: 'POST',
    body: JSON.stringify({ treeProductId, quantity }),
  });
}

/** The balance on hand for each product, keyed by product id — the sum of its movements. */
export async function getTreeProductBalances(): Promise<Map<number, number>> {
  const movements = await getTreeProductMovements();
  const byProduct = new Map<number, number>();
  for (const m of movements) byProduct.set(m.treeProductId, (byProduct.get(m.treeProductId) ?? 0) + m.delta);
  return byProduct;
}
