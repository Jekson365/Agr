import { apiFetch } from '@/services/api-client';
import type { TreeProduct, TreeProductInput } from '@/types/tree-product';

export function getTreeProducts() {
  return apiFetch<TreeProduct[]>('/api/treeproducts');
}

export function createTreeProduct(product: TreeProductInput) {
  return apiFetch<TreeProduct>('/api/treeproducts', {
    method: 'POST',
    body: JSON.stringify(product),
  });
}
