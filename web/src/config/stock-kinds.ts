import beansIcon from '@/assets/goods/beans.png';
import cabbageIcon from '@/assets/goods/cabbage.png';
import carrotIcon from '@/assets/goods/carrot.png';
import cornIcon from '@/assets/goods/corn.png';
import cucumberIcon from '@/assets/goods/cucumber.png';
import eggplantIcon from '@/assets/goods/eggplant.png';
import milkIcon from '@/assets/goods/milk.png';
import onionIcon from '@/assets/goods/onion.png';
import potatoIcon from '@/assets/goods/potato.png';
import pumpkinIcon from '@/assets/goods/pumpkin.png';
import tomatoIcon from '@/assets/goods/tomato.png';
import weatIcon from '@/assets/goods/weat.png';
// Same idea as the livestock default: the stand-in that belongs with the goods artwork, not the
// Stock area's own icon.
import defaultStockIcon from '@/assets/goods/default.png';
import { customKindIcon } from '@/config/kind-icons';

// Built-in stock kinds get bundled artwork and a translated label. A kind a user added carries
// its own picture instead (see config/kind-icons.ts) and shows the name it was created with —
// see stockKindImage/stockTypeLabel below.

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
  Carrot: carrotIcon,
  Corn: cornIcon,
  Onion: onionIcon,
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
  Carrot: 'farm.stockCarrot',
  Corn: 'farm.stockCorn',
  Onion: 'farm.stockOnion',
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

/** A stock type's icon: the bundled artwork if it's a known built-in, otherwise the picture the
 * user gave the kind when they added it, and a generic default for a kind with neither. */
export function stockKindImage(type: string): string {
  // Built-in first, then the kind's own uploaded artwork, then the generic stand-in.
  // A user-added kind is drawn like a built-in — see config/kind-icons.ts.
  return STOCK_KIND_IMAGE[type] ?? customKindIcon('stock', type) ?? defaultStockIcon;
}

/** Whether this is one of the kinds every tenant is seeded with, as opposed to one a user added.
 * The app removes no kind at all now, so this is only a statement about where a kind came from —
 * the seeded floor a fresh farm starts from. */
export function isBuiltInStockKind(type: string): boolean {
  return type in STOCK_TYPE_LABEL_KEY;
}
