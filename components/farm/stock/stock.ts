// Built-in stock kinds get dedicated artwork and a translated label; any other kind (a custom
// type a user added via the Stock form) falls back to a generic icon and its raw name — see
// stockKindImage/stockTypeLabel below.

export const STOCK_KIND_IMAGE: Record<string, number> = {
  Weat: require('@/assets/goods/weat.png'),
  Beans: require('@/assets/goods/beans.png'),
  Milk: require('@/assets/goods/milk.png'),
  Cabbage: require('@/assets/goods/cabbage.png'),
  Cucumber: require('@/assets/goods/cucumber.png'),
  Eggplant: require('@/assets/goods/eggplant.png'),
  Potato: require('@/assets/goods/potato.png'),
  Pumpkin: require('@/assets/goods/pumpkin.png'),
  Tomato: require('@/assets/goods/tomato.png'),
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

const DEFAULT_STOCK_ICON = require('@/assets/properties/plants.png');

/** A stock type's display label: its translation if it's a known built-in, otherwise its raw
 * (user-entered) name. */
export function stockTypeLabel(type: string, t: (key: string) => string): string {
  const key = STOCK_TYPE_LABEL_KEY[type];
  return key ? t(key) : type;
}

/** A stock type's icon: its dedicated artwork if it's a known built-in, otherwise a generic
 * default — custom types added through the app don't have artwork of their own. */
export function stockKindImage(type: string): number {
  return STOCK_KIND_IMAGE[type] ?? DEFAULT_STOCK_ICON;
}
