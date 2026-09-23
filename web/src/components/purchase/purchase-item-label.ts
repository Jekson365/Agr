import { fruitTypeLabel } from '@/config/fruit-kinds';
import { livestockTypeLabel } from '@/config/livestock-kinds';
import { PRODUCTION_TYPE_LABEL_KEY } from '@/config/production';
import { stockTypeLabel } from '@/config/stock-kinds';
import type { PurchaseItemKind } from '@/types/purchase';

type Translate = (key: string) => string;

export function purchaseItemLabel(kind: PurchaseItemKind, name: string, t: Translate): string {
  switch (kind) {
    case 'Livestock':
      return livestockTypeLabel(name, t);
    case 'TreeStock':
    case 'TreeSeedling':
      return fruitTypeLabel(name, t);
    case 'Stock':
    case 'Seed':
      return stockTypeLabel(name, t);
    case 'LivestockProduction': {
      const key = PRODUCTION_TYPE_LABEL_KEY[name];
      return key ? t(key) : name;
    }
    default:
      return name;
  }
}

export function purchaseQuantity(value: number): string {
  return String(Math.round(value * 100) / 100);
}
