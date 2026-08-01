import type { KindCatalog } from '@/components/farm/kind-catalog-field';
import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { createFruitKind, deleteFruitKind, getFruitKinds } from '@/services/fruit-kind-service';

/** The fruit-kind catalog behind the tree stock form's type picker. A module constant so the
 * field's load effect sees one stable object rather than a new one each render. */
export const FRUIT_KIND_CATALOG: KindCatalog = {
  list: getFruitKinds,
  create: (name) => createFruitKind({ name }),
  remove: deleteFruitKind,
  label: fruitTypeLabel,
  icon: fruitKindImage,
};
