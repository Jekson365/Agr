import { stockTypeLabel } from '@/config/stock-kinds';

/** A seed's display title, using the same rule as plant stock: the custom name when one is
 * given, otherwise the crop's label — so a seed and the stock it grows into read identically. */
export function seedTitle(seed: { name: string; type: string }, t: (key: string) => string): string {
  return seed.name.trim() || stockTypeLabel(seed.type, t);
}

/** Seed measures: weighed in kilograms or grams, or counted (seedlings, individual seeds). */
export const SEED_UNIT_OPTIONS: { value: string; labelKey: string }[] = [
  { value: 'Kilogram', labelKey: 'farm.unitKg' },
  { value: 'Gram', labelKey: 'seed.unitGram' },
  { value: 'Quantity', labelKey: 'farm.unitQuantity' },
];

export const SEED_UNIT_LABEL_KEY: Record<string, string> = {
  Kilogram: 'farm.unitKg',
  Gram: 'seed.unitGram',
  Quantity: 'farm.unitQuantity',
};
