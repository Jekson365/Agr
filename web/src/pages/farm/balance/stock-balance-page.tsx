import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getMarketListings } from '@/services/market-listing-service';
import { getStockMovementReport } from '@/services/report-service';
import type { MarketListing } from '@/types/market-listing';
import type { StockMovementReportRow } from '@/types/report';
import { AdjustBalanceModal } from './adjust-balance-modal';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByProduct } from './balance-sources';
import { listedFor, listedTotals, type ProductBalance } from './product-balance';

/**
 * What the farm holds of each plant-stock good, summed from its movements, beside how much of it
 * the marketplace is already holding. A reading of the holding and nothing more: listing more of
 * it is done from the marketplace itself.
 */
export function StockBalancePage() {
  const { t } = useLanguage();

  /**
   * Whether the goods the farm has removed are shown alongside what it keeps. Off by default —
   * the page answers "what do I have?", and a removed good is not part of that — but what it held
   * was real and is still recorded, so it can be asked for.
   */
  const [showRemoved, setShowRemoved] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [rows, setRows] = useState<StockMovementReportRow[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [movementRows, listingList] = await Promise.all([
        getStockMovementReport(),
        getMarketListings({ mine: true }),
      ]);
      setRows(movementRows);
      setListings(listingList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const listed = listedTotals(listings);
  // Plant stock is the one table that reports the holdings themselves, so removed goods belong in
  // it directly rather than as an appendix.
  const balances = balancesByProduct(rows, 'stock', t, showRemoved ? 'include' : 'exclude');

  return (
    <BalanceLayout
      backTo="/farm/stock"
      backLabel={t('farm.plantStock')}
      loading={loading}
      error={error}
      onRetry={load}
      removed={{
        has: rows.some((row) => row.isDeleted && row.stockId != null),
        showing: showRemoved,
        onToggle: () => setShowRemoved((prev) => !prev),
      }}
      actions={
        <button type="button" className="add-button" onClick={() => setAdjustOpen(true)}>
          + {t('balance.adjust')}
        </button>
      }
    >
      <BalanceColumn
        productHeader={t('balance.colPlant')}
        amountHeader={t('balance.colBalance')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('balance.empty')}
        rows={balances}
        listedFor={(row: ProductBalance) => listedFor(row, listed)}
      />

      <AdjustBalanceModal open={adjustOpen} rows={balances} onClose={() => setAdjustOpen(false)} onSaved={load} />
    </BalanceLayout>
  );
}
