import type { CatalogKind, KindCatalog } from '@/components/farm/kind-catalog-field';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { resolveAssetUrl } from '@/services/api-client';
import { createStockKind, getStockKinds, uploadStockKindImage } from '@/services/stock-kind-service';

/** The crop-kind catalog behind the stock form's type picker. A module constant so the field's
 * load effect sees one stable object rather than a new one each render. */
export const STOCK_KIND_CATALOG: KindCatalog = {
  list: getStockKinds,
  // Two steps: the picture goes up first, since the row it belongs to does not exist yet, and its
  // path is what the create carries.
  create: async (name, icon) => {
    const imagePath = icon ? await uploadStockKindImage(icon) : '';
    return createStockKind({ name, imagePath });
  },
  label: stockTypeLabel,
  // The kind's own picture when it has one, otherwise whatever stockKindImage resolves — bundled
  // artwork for a built-in, the generic stand-in for anything else.
  icon: (kind: CatalogKind) => (kind.imagePath ? resolveAssetUrl(kind.imagePath) : stockKindImage(kind.name)),
};
