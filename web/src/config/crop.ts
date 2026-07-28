import { stockKindImage, STOCK_KIND_IMAGE, STOCK_TYPE_LABEL_KEY } from '@/config/stock-kinds';
import { FRUIT_KIND_IMAGE, FRUIT_TYPE_LABEL_KEY } from '@/config/fruit-kinds';

// A land plot's crop can be either a stock good (e.g. "Tomato") or a fruit tree type (e.g.
// "Apple") — it's just a name shared with whichever catalog it came from, so these look it up
// across both.

/** A crop's display label: its translation if it's a known built-in of either catalog,
 * otherwise its raw (user-entered) name. */
export function cropLabel(crop: string, t: (key: string) => string): string {
  const stockKey = STOCK_TYPE_LABEL_KEY[crop];
  if (stockKey) return t(stockKey);
  const fruitKey = FRUIT_TYPE_LABEL_KEY[crop];
  if (fruitKey) return t(fruitKey);
  return crop;
}

/** A crop's icon: its dedicated artwork if it's a known built-in of either catalog, otherwise a
 * generic default. */
export function cropImage(crop: string): string {
  return STOCK_KIND_IMAGE[crop] ?? FRUIT_KIND_IMAGE[crop] ?? stockKindImage(crop);
}
