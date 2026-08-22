import type { PurchaseDocument, PurchaseItemKind } from '@/types/purchase';

export type PurchaseFilters = {
  search: string;
  kind: PurchaseItemKind | 'all';
  from: string | null;
  to: string | null;
};

export const EMPTY_FILTERS: PurchaseFilters = { search: '', kind: 'all', from: null, to: null };

export function hasActiveFilters(filters: PurchaseFilters): boolean {
  return filters.kind !== 'all' || filters.from != null || filters.to != null;
}

/**
 * The documents a filter leaves. Dates compare as plain `YYYY-MM-DD` strings, which is exact for
 * that shape and keeps a document out of the wrong day for anyone west of UTC.
 */
export function filterPurchases(documents: PurchaseDocument[], filters: PurchaseFilters): PurchaseDocument[] {
  const term = filters.search.trim().toLowerCase();

  return documents.filter((document) => {
    if (filters.from && document.date < filters.from) return false;
    if (filters.to && document.date > filters.to) return false;
    if (filters.kind !== 'all' && !document.items.some((item) => item.kind === filters.kind)) return false;
    if (!term) return true;
    return (
      document.seller.toLowerCase().includes(term) ||
      (document.note ?? '').toLowerCase().includes(term) ||
      document.items.some((item) => item.name.toLowerCase().includes(term))
    );
  });
}

/** Which categories the documents on hand actually cover — a filter for a kind nobody has bought
 *  would only ever empty the table. */
export function kindsPresent(documents: PurchaseDocument[]): Set<PurchaseItemKind> {
  const kinds = new Set<PurchaseItemKind>();
  for (const document of documents) {
    for (const item of document.items) kinds.add(item.kind);
  }
  return kinds;
}
