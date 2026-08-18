import type { CatalogKind, KindCatalog } from '@/components/farm/kind-catalog-field';
import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { resolveAssetUrl } from '@/services/api-client';
import { createFruitKind, getFruitKinds, uploadFruitKindImage } from '@/services/fruit-kind-service';

/** The fruit-kind catalog behind the tree stock form's type picker. A module constant so the
 * field's load effect sees one stable object rather than a new one each render. */
export const FRUIT_KIND_CATALOG: KindCatalog = {
  list: getFruitKinds,
  // Two steps: the picture goes up first, since the row it belongs to does not exist yet, and its
  // path is what the create carries.
  create: async (name, icon) => {
    const imagePath = icon ? await uploadFruitKindImage(icon) : '';
    return createFruitKind({ name, imagePath });
  },
  label: fruitTypeLabel,
  // The kind's own picture when it has one, otherwise whatever fruitKindImage resolves — bundled
  // artwork for a built-in, the generic stand-in for anything else.
  icon: (kind: CatalogKind) => (kind.imagePath ? resolveAssetUrl(kind.imagePath) : fruitKindImage(kind.name)),
};
