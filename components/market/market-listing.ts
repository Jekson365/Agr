import type Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { LIVESTOCK_KIND_IMAGE, LIVESTOCK_KIND_OPTIONS } from '@/components/farm/livestock/livestock';
import { stockKindImage, stockTypeLabel } from '@/components/farm/stock/stock';
import { fruitKindImage, fruitTypeLabel } from '@/components/farm/tree-stock/tree-stock';
import type { ListingCategory, ListingType } from '@/types/market-listing';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export const LISTING_TYPE_OPTIONS: { value: ListingType; labelKey: string }[] = [
  { value: 'Sale', labelKey: 'market.typeSale' },
  { value: 'Rent', labelKey: 'market.typeRent' },
];

export const LISTING_CATEGORY_OPTIONS: { value: ListingCategory; labelKey: string }[] = [
  { value: 'Stock', labelKey: 'market.categoryStock' },
  { value: 'TreeStock', labelKey: 'market.categoryFruit' },
  { value: 'Livestock', labelKey: 'market.categoryLivestock' },
  { value: 'Equipment', labelKey: 'market.categoryEquipment' },
  { value: 'Other', labelKey: 'market.categoryOther' },
];

export const LISTING_CATEGORY_LABEL_KEY: Record<ListingCategory, string> = {
  Stock: 'market.categoryStock',
  TreeStock: 'market.categoryFruit',
  Livestock: 'market.categoryLivestock',
  Equipment: 'market.categoryEquipment',
  Other: 'market.categoryOther',
};

// A listing's icon per category has no dedicated artwork of its own; Equipment/Other render a
// generic Ionicon instead (see ListingCard) since there's no per-item catalog to draw from.
export const LISTING_CATEGORY_ICON: Record<ListingCategory, IoniconName> = {
  Stock: 'leaf-outline',
  TreeStock: 'leaf-outline',
  Livestock: 'paw-outline',
  Equipment: 'construct-outline',
  Other: 'pricetag-outline',
};

const DEFAULT_LIVESTOCK_ICON = require('@/assets/properties/animals.png');

function livestockKindImage(itemType: string): number {
  return (LIVESTOCK_KIND_IMAGE as Record<string, number>)[itemType] ?? DEFAULT_LIVESTOCK_ICON;
}

/** A listing's icon: the underlying stock/fruit/animal kind's artwork for those categories, or
 * null for Equipment/Other — render LISTING_CATEGORY_ICON as a generic Ionicon instead. */
export function listingImage(category: ListingCategory, itemType: string): number | null {
  switch (category) {
    case 'Stock':
      return stockKindImage(itemType);
    case 'TreeStock':
      return fruitKindImage(itemType);
    case 'Livestock':
      return livestockKindImage(itemType);
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
    case 'Livestock': {
      const key = LIVESTOCK_KIND_OPTIONS.find((o) => o.value === itemType)?.labelKey;
      return key ? t(key) : itemType;
    }
    default:
      return itemType;
  }
}
