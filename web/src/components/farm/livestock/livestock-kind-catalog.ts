import type { KindCatalog } from '@/components/farm/kind-catalog-field';
import { isBuiltInLivestockKind, livestockImage, livestockTypeLabel } from '@/config/livestock-kinds';
import { createLivestockKind, deleteLivestockKind, getLivestockKinds } from '@/services/livestock-kind-service';

/** The animal-kind catalog behind the livestock form's type picker. A module constant so the
 * field's load effect sees one stable object rather than a new one each render. */
export const LIVESTOCK_KIND_CATALOG: KindCatalog = {
  list: getLivestockKinds,
  create: (name) => createLivestockKind({ name }),
  remove: deleteLivestockKind,
  label: livestockTypeLabel,
  icon: livestockImage,
  isBuiltIn: isBuiltInLivestockKind,
};
