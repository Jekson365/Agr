import type { CatalogKind, KindCatalog } from '@/components/farm/kind-catalog-field';
import { livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { resolveAssetUrl } from '@/services/api-client';
import {
  createLivestockKind,
  getLivestockKinds,
  uploadLivestockKindImage,
} from '@/services/livestock-kind-service';

/** The animal-kind catalog behind the livestock form's type picker. A module constant so the
 * field's load effect sees one stable object rather than a new one each render. */
export const LIVESTOCK_KIND_CATALOG: KindCatalog = {
  list: getLivestockKinds,
  // Two steps: the picture goes up first, since the row it belongs to does not exist yet, and its
  // path is what the create carries.
  create: async (name, icon) => {
    const imagePath = icon ? await uploadLivestockKindImage(icon) : '';
    return createLivestockKind({ name, imagePath });
  },
  label: livestockTypeLabel,
  // The kind's own picture when it has one, otherwise whatever livestockImage resolves — bundled
  // artwork for a built-in, the generic stand-in for anything else.
  icon: (kind: CatalogKind) => (kind.imagePath ? resolveAssetUrl(kind.imagePath) : livestockImage(kind.name)),
};
