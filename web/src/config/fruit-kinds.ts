import defaultFruitIcon from '@/assets/goods/default.png';
import appleIcon from '@/assets/trees/apple.png';
import bananaIcon from '@/assets/trees/banana.png';
import orangeIcon from '@/assets/trees/orange.png';

// Built-in fruit kinds get dedicated artwork and a translated label; any other kind (a custom
// type a user added via the Tree Stock form) falls back to the same goods stand-in the stock and
// livestock catalogs use, and its raw name — see fruitKindImage/fruitTypeLabel below.

export const FRUIT_KIND_IMAGE: Record<string, string> = {
  Apple: appleIcon,
  Orange: orangeIcon,
  Banana: bananaIcon,
};

export const FRUIT_TYPE_LABEL_KEY: Record<string, string> = {
  Apple: 'farm.fruitApple',
  Orange: 'farm.fruitOrange',
  Banana: 'farm.fruitBanana',
};

/** The unit every new fruit entry is created with — an orchard is counted in trees. */
export const TREE_STOCK_DEFAULT_UNIT = 'Plant';

/** Units a fruit/tree good can be measured in, trees first — what a plan against an orchard may
 * be written in. Mirrors TREE_STOCK_UNIT_LABEL_KEY below. */
export const TREE_STOCK_UNIT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'Plant', labelKey: 'farm.unitPlant' },
  { value: 'Kilogram', labelKey: 'farm.unitKg' },
  { value: 'Box', labelKey: 'farm.unitBox' },
];

// Kilogram and Box only appear on rows created before fruit was counted in trees; they stay
// here so those rows still render with the unit they were entered under.
export const TREE_STOCK_UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'farm.unitKg',
  Box: 'farm.unitBox',
  Plant: 'farm.unitPlant',
};

/** A fruit type's display label: its translation if it's a known built-in, otherwise its raw
 * (user-entered) name. */
export function fruitTypeLabel(type: string, t: (key: string) => string): string {
  const key = FRUIT_TYPE_LABEL_KEY[type];
  return key ? t(key) : type;
}

/** A fruit type's icon: its dedicated artwork if it's a known built-in, otherwise a generic
 * empty-tree default — custom types added through the app don't have artwork of their own. */
export function fruitKindImage(type: string): string {
  return FRUIT_KIND_IMAGE[type] ?? defaultFruitIcon;
}

/** Whether this is one of the kinds every tenant is seeded with, as opposed to one a user added.
 * Built-ins can't be deleted from the catalog — see isBuiltInStockKind. */
export function isBuiltInFruitKind(type: string): boolean {
  return type in FRUIT_TYPE_LABEL_KEY;
}

/** How a fruit entry is named wherever it's listed: its own label ("Gala Apples") when it was
 * given one, else the fruit it is. */
export function treeStockLabel(stock: { type: string; name: string }, t: (key: string) => string): string {
  return stock.name.trim() || fruitTypeLabel(stock.type, t);
}

/** The unit every new product is created with — produce is weighed. */
export const TREE_PRODUCT_DEFAULT_UNIT = 'Kilogram';

// Box and Quantity only appear on products created while the unit was still a choice; they stay
// here so those rows still render with the unit they were entered under.
export const TREE_PRODUCT_UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'farm.unitKg',
  Box: 'farm.unitBox',
  Quantity: 'farm.unitQuantity',
};
