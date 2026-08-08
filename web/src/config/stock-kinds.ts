import beansIcon from '@/assets/goods/beans.png';
import cabbageIcon from '@/assets/goods/cabbage.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import eggplantIcon from '@/assets/goods/eggplant.png';
import milkIcon from '@/assets/goods/milk.png';
import potatoIcon from '@/assets/goods/potato.png';
import pumpkinIcon from '@/assets/goods/pumpkin.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import weatIcon from '@/assets/goods/weat.png';
// Same idea as the livestock default: the stand-in that belongs with the goods artwork, not the
// Stock area's own icon.
import defaultStockIcon from '@/assets/goods/default.png';

// Built-in stock kinds get dedicated artwork and a translated label; any other kind (a custom
// type a user added via the Stock form) falls back to a generic icon and its raw name — see
// stockKindImage/stockTypeLabel below.

export const STOCK_KIND_IMAGE: Record<string, string> = {
  Weat: weatIcon,
  Beans: beansIcon,
  Milk: milkIcon,
  Cabbage: cabbageIcon,
  Cucumber: cucumberIcon,
  Eggplant: eggplantIcon,
  Potato: potatoIcon,
  Pumpkin: pumpkinIcon,
  Tomato: tomatoIcon,
};

export const STOCK_TYPE_LABEL_KEY: Record<string, string> = {
  Weat: 'farm.stockWeed',
  Beans: 'farm.stockBeans',
  Milk: 'farm.stockMilk',
  Cabbage: 'farm.stockCabbage',
  Cucumber: 'farm.stockCucumber',
  Eggplant: 'farm.stockEggplant',
  Potato: 'farm.stockPotato',
  Pumpkin: 'farm.stockPumpkin',
  Tomato: 'farm.stockTomato',
};

export const STOCK_UNIT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'Kilogram', labelKey: 'farm.unitKg' },
  { value: 'Quantity', labelKey: 'farm.unitQuantity' },
  { value: 'Liter', labelKey: 'farm.unitLiter' },
];

export const STOCK_UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'farm.unitKg',
  Quantity: 'farm.unitQuantity',
  Liter: 'farm.unitLiter',
};

/** A stock type's display label: its translation if it's a known built-in, otherwise its raw
 * (user-entered) name. */
export function stockTypeLabel(type: string, t: (key: string) => string): string {
  const key = STOCK_TYPE_LABEL_KEY[type];
  return key ? t(key) : type;
}

/** A stock type's icon: its dedicated artwork if it's a known built-in, otherwise a generic
 * default — custom types added through the app don't have artwork of their own. */
export function stockKindImage(type: string): string {
  return STOCK_KIND_IMAGE[type] ?? defaultStockIcon;
}

/** Whether this is one of the kinds every tenant is seeded with, as opposed to one a user added.
 * Built-ins can't be deleted from the catalog — they're what a fresh farm starts from, and the
 * server refuses to remove them however the request arrives. */
export function isBuiltInStockKind(type: string): boolean {
  return type in STOCK_TYPE_LABEL_KEY;
}
