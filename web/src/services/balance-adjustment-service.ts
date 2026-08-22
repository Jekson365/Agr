import { apiFetch } from '@/services/api-client';
import type { BalanceAdjustment, BalanceAdjustTarget } from '@/types/balance-adjustment';

const ENDPOINT: Record<BalanceAdjustTarget['kind'], string> = {
  stock: '/api/stockmovements',
  treeStock: '/api/treestockmovements',
  treeProduct: '/api/treeproductmovements',
  production: '/api/productionmovements',
  greenhouseStock: '/api/greenhousestockmovements',
};

function keyed(target: BalanceAdjustTarget): Record<string, number> {
  switch (target.kind) {
    case 'stock':
      return { stockId: target.stockId };
    case 'treeStock':
      return { treeStockId: target.treeStockId };
    case 'treeProduct':
      return { treeProductId: target.treeProductId };
    case 'production':
      return { productionTypeId: target.productionTypeId, unitId: target.unitId };
    case 'greenhouseStock':
      return { greenhouseStockId: target.greenhouseStockId };
  }
}

export function adjustBalance(target: BalanceAdjustTarget, adjustment: BalanceAdjustment) {
  return apiFetch<unknown>(ENDPOINT[target.kind], {
    method: 'POST',
    body: JSON.stringify({ ...keyed(target), ...adjustment }),
  });
}
