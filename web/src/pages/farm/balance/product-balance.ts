import type { ListingCategory, MarketListing } from '@/types/market-listing';
import type { BalanceAdjustTarget } from '@/types/balance-adjustment';

export type Translate = (key: string) => string;

export type ProductBalance = {
  key: string;
  title: string;
  unitLabel: string;
  balance: number;
  /**
   * Where this product lists on the marketplace, when it can be sold from here at all. Absent for
   * produce the marketplace has no category for — RecordSaleModal resolves what a sale draws down
   * from the listing's category, so a row that borrowed another category's would deduct from the
   * wrong balance. Rows without it render as balances alone.
   */
  market?: {
    /** Marketplace category this product lists under. */
    category: ListingCategory;
    /** The underlying kind name the marketplace uses for icon/label lookup. */
    itemType: string;
  };
  adjust?: BalanceAdjustTarget;
  /**
   * Whether the holding behind this row has been removed. Such a row only appears once the removed
   * holdings are asked for, and is marked so it isn't read as part of what the farm keeps today.
   * Never carries {@link market}: the server refuses a sale against a removed holding, so offering
   * one here would only fail.
   */
  removed?: boolean;
};

/** Which rows a balance covers: what the farm keeps now, that plus what it has removed, or the
 *  removed holdings on their own. */
export type DeletedFilter = 'exclude' | 'include' | 'only';

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * How much of each product is on the marketplace right now, keyed by category and item type.
 * Listings carry the kind, not the individual stock row, so two stocks of the same kind both
 * report the kind's listed total.
 */
export function listedTotals(listings: MarketListing[]): Map<string, number> {
  const listed = new Map<string, number>();
  for (const listing of listings) {
    if (listing.status !== 'Active' || listing.quantity == null) continue;
    const key = `${listing.category}:${listing.itemType}`;
    listed.set(key, (listed.get(key) ?? 0) + listing.quantity);
  }
  return listed;
}

/** What {@link listedTotals} holds for one balance row, or 0 when it isn't sellable from here. */
export function listedFor(row: ProductBalance, listed: Map<string, number>): number {
  return row.market ? (listed.get(`${row.market.category}:${row.market.itemType}`) ?? 0) : 0;
}

export function adjustableRows(rows: ProductBalance[]): ProductBalance[] {
  return rows.filter((row) => row.adjust != null);
}
