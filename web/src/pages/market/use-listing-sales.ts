import { useState, type Dispatch, type SetStateAction } from 'react';

import { updateMarketListing } from '@/services/market-listing-service';
import type { MarketListing } from '@/types/market-listing';

/**
 * Marking a listing sold, and what that means for the produce behind it.
 *
 * Whether a click completes the listing outright or opens the sale modal depends on what is being
 * sold, and a partial sale leaves the listing active with the balance that remains. Kept together
 * here because those three rules only make sense as one.
 */
export function useListingSales(
  setListings: Dispatch<SetStateAction<MarketListing[]>>,
  onError: (message: string) => void
) {
  const [saleListing, setSaleListing] = useState<MarketListing | null>(null);

  async function updateListing(updated: MarketListing) {
    try {
      await updateMarketListing(updated.id, updated);
      setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  function handleSoldClick(item: MarketListing) {
    if (item.status === 'Completed') {
      updateListing({ ...item, status: 'Active' });
      return;
    }
    // Selling own production should show up in the stock's history — the sale modal records
    // the movement and decides whether the listing completes or keeps a remaining balance.
    // Other listings with a quantity get the same sold/remaining split, just without the
    // inventory movement; without a quantity there is nothing to split.
    if (item.category === 'Stock' || item.category === 'TreeStock' || item.quantity != null) {
      setSaleListing(item);
    } else {
      updateListing({ ...item, status: 'Completed' });
    }
  }

  function handleSaleRecorded(soldQuantity: number) {
    if (saleListing) {
      const remaining = saleListing.quantity != null ? saleListing.quantity - soldQuantity : null;
      if (remaining != null && remaining > 0) {
        // Partial sale — the listing stays active with the balance that's still for sale.
        updateListing({ ...saleListing, quantity: remaining });
      } else {
        updateListing({ ...saleListing, status: 'Completed', quantity: remaining != null ? 0 : saleListing.quantity });
      }
    }
    setSaleListing(null);
  }

  return { saleListing, setSaleListing, handleSoldClick, handleSaleRecorded };
}
