import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';

/** The shape of `t` from the language context, so these stay plain functions rather than hooks. */
export type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Built-in types are stored under an English key ("Milk") and shown translated; a user-added one
 * has no key and shows the name it was created with. */
export function productionTypeLabel(productionType: ProductionType | undefined, t: Translate): string {
  if (!productionType) return '';
  return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
}

export function productionUnitLabel(unit: Unit | undefined, t: Translate): string {
  if (!unit) return '';
  return t(UNIT_LABEL_KEY[unit.name] ?? unit.name);
}
