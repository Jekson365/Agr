import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import type { ListingCategory, ListingSourceKind, ListingType } from '@/types/market-listing';

export const LISTING_TYPE_OPTIONS: { value: ListingType; labelKey: string }[] = [
  { value: 'Sale', labelKey: 'market.typeSale' },
  { value: 'Rent', labelKey: 'market.typeRent' },
];

export const LISTING_CATEGORY_OPTIONS: { value: ListingCategory; labelKey: string }[] = [
  { value: 'Stock', labelKey: 'market.categoryStock' },
  { value: 'TreeStock', labelKey: 'market.categoryFruit' },
  { value: 'Livestock', labelKey: 'market.categoryLivestock' },
  { value: 'Equipment', labelKey: 'market.categoryEquipment' },
  { value: 'TreeProduct', labelKey: 'market.categoryTreeProduct' },
  { value: 'Other', labelKey: 'market.categoryOther' },
];

export const LISTING_SOURCE_KIND_LABEL_KEY: Record<ListingSourceKind, string> = {
  Stock: 'market.sourceStock',
  Livestock: 'market.sourceLivestock',
  TreeStock: 'market.sourceTreeStock',
  TreeProduct: 'market.sourceTreeProduct',
  Production: 'market.sourceProduction',
  GreenhouseStock: 'market.sourceGreenhouseStock',
};

export const LISTING_CATEGORY_LABEL_KEY: Record<ListingCategory, string> = {
  Stock: 'market.categoryStock',
  TreeStock: 'market.categoryFruit',
  Livestock: 'market.categoryLivestock',
  Equipment: 'market.categoryEquipment',
  TreeProduct: 'market.categoryTreeProduct',
  Other: 'market.categoryOther',
};

/** A listing's icon: the underlying stock/fruit/animal kind's artwork for those categories, or
 * null for Equipment/Other — render LISTING_CATEGORY_ICON as a generic icon instead. */
export function listingImage(category: ListingCategory, itemType: string): string | null {
  switch (category) {
    case 'Stock':
      return stockKindImage(itemType);
    case 'TreeStock':
      return fruitKindImage(itemType);
    case 'Livestock':
      return livestockImage(itemType);
    default:
      return null;
  }
}

/** A listing's item-type label: its translation if it's a known built-in kind, otherwise its raw
 * (user-entered) name. */
export function listingItemLabel(category: ListingCategory, itemType: string, t: (key: string) => string): string {
  switch (category) {
    case 'Stock':
      return stockTypeLabel(itemType, t);
    case 'TreeStock':
      return fruitTypeLabel(itemType, t);
    case 'Livestock':
      return livestockTypeLabel(itemType, t);
    default:
      return itemType;
  }
}
