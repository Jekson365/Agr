import appleIcon from '@/assets/trees/apple.png';
import avocadoIcon from '@/assets/trees/avocado.png';
import bananaIcon from '@/assets/trees/banana.png';
import cherryIcon from '@/assets/trees/cherry.png';
// The stand-in that belongs with the tree artwork, not the goods one: at icon size the goods
// logo is a pale outline that all but disappears on a light row, and a fruitless tree reads as
// a tree even at 20px. Mirrors the mobile app, which falls back to the same image.
import defaultFruitIcon from '@/assets/trees/empty.png';
import figIcon from '@/assets/trees/fig.png';
import kiwiIcon from '@/assets/trees/kiwi.png';
import lemonIcon from '@/assets/trees/lemon.png';
// The catalog name is spelled properly even where the artwork file is not — the name is what the
// database and every TreeStock.Type reference, the filename reaches no further than this import.
import melonIcon from '@/assets/trees/malon.png';
import mandarinIcon from '@/assets/trees/mandarin.png';
import nutIcon from '@/assets/trees/nuts.png';
import orangeIcon from '@/assets/trees/orange.png';
import peachIcon from '@/assets/trees/peach.png';
import pearIcon from '@/assets/trees/pear.png';
import pineappleIcon from '@/assets/trees/pineapple.png';
import plumIcon from '@/assets/trees/plum.png';
import strawberryIcon from '@/assets/trees/strawberries.png';
import watermelonIcon from '@/assets/trees/watermalon.png';
import { customKindIcon } from '@/config/kind-icons';

// Built-in fruit kinds get bundled artwork and a translated label. A kind a user added carries
// its own picture instead (see config/kind-icons.ts) and shows the name it was created with —
// see fruitKindImage/fruitTypeLabel below.

export const FRUIT_KIND_IMAGE: Record<string, string> = {
  Apple: appleIcon,
  Orange: orangeIcon,
  Banana: bananaIcon,
  Avocado: avocadoIcon,
  Kiwi: kiwiIcon,
  Melon: melonIcon,
  Nut: nutIcon,
  Peach: peachIcon,
  Pear: pearIcon,
  Pineapple: pineappleIcon,
  Plum: plumIcon,
  Strawberry: strawberryIcon,
  Watermelon: watermelonIcon,
  Cherry: cherryIcon,
  Fig: figIcon,
  Lemon: lemonIcon,
  Mandarin: mandarinIcon,
};

export const FRUIT_TYPE_LABEL_KEY: Record<string, string> = {
  Apple: 'farm.fruitApple',
  Orange: 'farm.fruitOrange',
  Banana: 'farm.fruitBanana',
  Avocado: 'farm.fruitAvocado',
  Kiwi: 'farm.fruitKiwi',
  Melon: 'farm.fruitMelon',
  Nut: 'farm.fruitNut',
  Peach: 'farm.fruitPeach',
  Pear: 'farm.fruitPear',
  Pineapple: 'farm.fruitPineapple',
  Plum: 'farm.fruitPlum',
  Strawberry: 'farm.fruitStrawberry',
  Watermelon: 'farm.fruitWatermelon',
  Cherry: 'farm.fruitCherry',
  Fig: 'farm.fruitFig',
  Lemon: 'farm.fruitLemon',
  Mandarin: 'farm.fruitMandarin',
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

/** A fruit type's icon: the bundled artwork if it's a known built-in, otherwise the picture the
 * user gave the kind when they added it, and a generic bare tree for a kind with neither. */
export function fruitKindImage(type: string): string {
  // Built-in first, then the kind's own uploaded artwork, then the generic stand-in.
  // A user-added kind is drawn like a built-in — see config/kind-icons.ts.
  return FRUIT_KIND_IMAGE[type] ?? customKindIcon('fruit', type) ?? defaultFruitIcon;
}

/** Whether this is one of the kinds every tenant is seeded with, as opposed to one a user added.
 * See isBuiltInStockKind — no kind is removable from the app either way. */
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
