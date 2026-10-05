import { stockTypeLabel } from '@/config/stock-kinds';
import { round2 } from '@/config/wine';
import { getStock } from '@/services/stock-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';

export type GrapeOption = {
  treeProductId: number;
  label: string;
  available: number;
  isDeleted: boolean;
};

export async function loadGrapeOptions(t: (key: string) => string): Promise<GrapeOption[]> {
  const [products, movements, vineyards] = await Promise.all([
    getTreeProducts('Wine'),
    getTreeProductMovements(),
    getStock(true, 'Wine'),
  ]);

  const balance = new Map<number, number>();
  for (const movement of movements) {
    balance.set(movement.treeProductId, (balance.get(movement.treeProductId) ?? 0) + movement.delta);
  }

  const vineyardByProduct = new Map(
    vineyards.filter((vineyard) => vineyard.treeProductId != null).map((vineyard) => [vineyard.treeProductId!, vineyard])
  );

  return products.flatMap((product) => {
    const vineyard = vineyardByProduct.get(product.id);
    if (!vineyard) return [];
    return [
      {
        treeProductId: product.id,
        label: vineyard.name.trim() || stockTypeLabel(vineyard.type, t),
        available: round2(balance.get(product.id) ?? 0),
        isDeleted: vineyard.isDeleted,
      },
    ];
  });
}
