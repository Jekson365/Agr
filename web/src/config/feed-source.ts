import equipmentIcon from '@/assets/properties/equipment.png';
import plantsIcon from '@/assets/properties/plants.png';
import treeProductIcon from '@/assets/trees/empty.png';
import { TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { STOCK_UNIT_LABEL_KEY, stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { resolveAssetUrl } from '@/services/api-client';
import type { Equipment } from '@/types/equipment';
import type { Stock } from '@/types/stock';
import type { StockFeed } from '@/types/stock-feed';
import type { TreeProduct } from '@/types/tree-product';

type Translate = (key: string) => string;

export type FeedSource = 'Stock' | 'TreeProduct' | 'Equipment';

export const FEED_SOURCES: FeedSource[] = ['Stock', 'TreeProduct', 'Equipment'];

export const FEED_SOURCE_LABEL_KEY: Record<FeedSource, string> = {
  Stock: 'feed.sourceStock',
  TreeProduct: 'feed.sourceFruit',
  Equipment: 'feed.sourceEquipment',
};

export const FEED_SOURCE_ICON: Record<FeedSource, string> = {
  Stock: plantsIcon,
  TreeProduct: treeProductIcon,
  Equipment: equipmentIcon,
};

export type FeedCatalog = {
  stocks: Stock[];
  products: TreeProduct[];
  equipment: Equipment[];
};

export const EMPTY_FEED_CATALOG: FeedCatalog = { stocks: [], products: [], equipment: [] };

export type FeedTarget = {
  source: FeedSource;
  id: number;
  label: string;
  icon: string;
  unitLabel: string;
};

export function feedTargets(catalog: FeedCatalog, source: FeedSource, t: Translate): FeedTarget[] {
  if (source === 'Stock') {
    return catalog.stocks.map((stock) => ({
      source,
      id: stock.id,
      label: stock.name.trim() || stockTypeLabel(stock.type, t),
      icon: stockKindImage(stock.type),
      unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit] ?? stock.unit),
    }));
  }

  if (source === 'TreeProduct') {
    return catalog.products.map((product) => ({
      source,
      id: product.id,
      label: product.name,
      icon: treeProductIcon,
      unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg'),
    }));
  }

  return catalog.equipment.map((item) => ({
    source,
    id: item.id,
    label: item.name,
    icon: item.imagePath ? resolveAssetUrl(item.imagePath) : equipmentIcon,
    unitLabel: t('farm.unitQuantity'),
  }));
}

export function feedSourceOf(feed: StockFeed): FeedSource | null {
  if (feed.stockId != null) return 'Stock';
  if (feed.treeProductId != null) return 'TreeProduct';
  if (feed.equipmentId != null) return 'Equipment';
  return null;
}

export function feedTargetOf(feed: StockFeed, catalog: FeedCatalog, t: Translate): FeedTarget | null {
  const source = feedSourceOf(feed);
  if (source == null) return null;
  const id = feed.stockId ?? feed.treeProductId ?? feed.equipmentId;
  return feedTargets(catalog, source, t).find((target) => target.id === id) ?? null;
}

export function feedTargetFields(target: FeedTarget): Pick<StockFeed, 'stockId' | 'treeProductId' | 'equipmentId'> {
  return {
    stockId: target.source === 'Stock' ? target.id : null,
    treeProductId: target.source === 'TreeProduct' ? target.id : null,
    equipmentId: target.source === 'Equipment' ? target.id : null,
  };
}

export function isFeedCatalogEmpty(catalog: FeedCatalog): boolean {
  return catalog.stocks.length === 0 && catalog.products.length === 0 && catalog.equipment.length === 0;
}
