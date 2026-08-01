import type { KindCatalog } from '@/components/farm/kind-catalog-field';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { createStockKind, deleteStockKind, getStockKinds } from '@/services/stock-kind-service';

/** The crop-kind catalog behind the stock form's type picker. A module constant so the field's
 * load effect sees one stable object rather than a new one each render. */
export const STOCK_KIND_CATALOG: KindCatalog = {
  list: getStockKinds,
  create: (name) => createStockKind({ name }),
  remove: deleteStockKind,
  label: stockTypeLabel,
  icon: stockKindImage,
};
