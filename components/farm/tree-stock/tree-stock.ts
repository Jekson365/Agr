// Built-in fruit kinds get dedicated artwork and a translated label; any other kind (a custom
// type a user added via the Tree Stock form) falls back to a generic empty-tree icon and its raw
// name — see fruitKindImage/fruitTypeLabel below.

export const FRUIT_KIND_IMAGE: Record<string, number> = {
  Apple: require('@/assets/trees/apple.png'),
  Orange: require('@/assets/trees/orange.png'),
  Banana: require('@/assets/trees/banana.png'),
};

export const FRUIT_TYPE_LABEL_KEY: Record<string, string> = {
  Apple: 'farm.fruitApple',
  Orange: 'farm.fruitOrange',
  Banana: 'farm.fruitBanana',
};

export const TREE_STOCK_UNIT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'Kilogram', labelKey: 'farm.unitKg' },
  { value: 'Box', labelKey: 'farm.unitBox' },
];

// Use a string index here to avoid errors if the TreeStockUnit union differs
export const TREE_STOCK_UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'farm.unitKg',
  Box: 'farm.unitBox',
};

const DEFAULT_FRUIT_ICON = require('@/assets/trees/empty.png');

/** A fruit type's display label: its translation if it's a known built-in, otherwise its raw
 * (user-entered) name. */
export function fruitTypeLabel(type: string, t: (key: string) => string): string {
  const key = FRUIT_TYPE_LABEL_KEY[type];
  return key ? t(key) : type;
}

/** A fruit type's icon: its dedicated artwork if it's a known built-in, otherwise a generic
 * empty-tree default — custom types added through the app don't have artwork of their own. */
export function fruitKindImage(type: string): number {
  return FRUIT_KIND_IMAGE[type] ?? DEFAULT_FRUIT_ICON;
}
