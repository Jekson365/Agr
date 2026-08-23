import milkIcon from '@/assets/goods/milk.png';
import animalsIcon from '@/assets/properties/animals.png';
import equipmentIcon from '@/assets/properties/equipment.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import plantsIcon from '@/assets/properties/plants.png';
import seedIcon from '@/assets/seed.png';
import treeProductIcon from '@/assets/trees/empty.png';
import { fruitKindImage } from '@/config/fruit-kinds';
import { livestockImage } from '@/config/livestock-kinds';
import { stockKindImage } from '@/config/stock-kinds';
import type { PurchaseItemKind } from '@/types/purchase';

export const PURCHASE_KIND_ICON: Record<PurchaseItemKind, string> = {
  Livestock: animalsIcon,
  LivestockProduction: milkIcon,
  TreeStock: fruitsIcon,
  TreeProduct: treeProductIcon,
  Stock: plantsIcon,
  Seed: seedIcon,
  Equipment: equipmentIcon,
};

export function purchaseTargetIcon(kind: PurchaseItemKind, typeName: string): string {
  if (!typeName) return PURCHASE_KIND_ICON[kind];
  switch (kind) {
    case 'Livestock':
      return livestockImage(typeName);
    case 'TreeStock':
      return fruitKindImage(typeName);
    case 'Stock':
    case 'Seed':
    case 'LivestockProduction':
      return stockKindImage(typeName);
    default:
      return PURCHASE_KIND_ICON[kind];
  }
}
