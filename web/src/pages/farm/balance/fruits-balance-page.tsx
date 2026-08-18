import { useEffect, useState } from 'react';

import { useLanguage } from '@/contexts/language-context';
import { getMarketListings } from '@/services/market-listing-service';
import { getStockMovementReport } from '@/services/report-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import type { MarketListing } from '@/types/market-listing';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByProduct, balancesByTreeProduct, listedFor, listedTotals, type ProductBalance } from './product-balance';

/**
 * What the orchards have yielded and how much of it is left, by product. This table reports what
 * the holding *yields* rather than the holding itself — produce outlives the orchard that gave it,
 * so nothing is missing from it to reveal. What is missing is the removed orchards themselves, by
 * their tree count; those are appended once asked for.
 */
export function FruitsBalancePage() {
  const { t } = useLanguage();

  const [showRemoved, setShowRemoved] = useState(false);

  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [treeProductMovements, setTreeProductMovements] = useState<TreeProductMovement[]>([]);
  /** Only read for the removed orchards below — the products above carry their own ledger. */
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
      const [productList, movementList, movementRows, listingList] = await Promise.all([
        getTreeProducts(),
        getTreeProductMovements(),
        getStockMovementReport(),
        getMarketListings({ mine: true }),
      ]);
      setTreeProducts(productList);
      setTreeProductMovements(movementList);
      setRows(movementRows);
      setListings(listingList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const listed = listedTotals(listings);
  const balances = [
    ...balancesByTreeProduct(treeProducts, treeProductMovements, t),
    ...(showRemoved ? balancesByProduct(rows, 'tree', t, 'only') : []),
  ];

  return (
    <BalanceLayout
      backTo="/farm/fruits"
      backLabel={t('farm.fruits')}
      loading={loading}
      error={error}
      onRetry={load}
      removed={{
        has: rows.some((row) => row.isDeleted && row.treeStockId != null),
        showing: showRemoved,
        onToggle: () => setShowRemoved((prev) => !prev),
      }}
    >
      <BalanceColumn
        productHeader={t('balance.colProduct')}
        amountHeader={t('balance.colBalance')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('balance.emptyTree')}
        rows={balances}
        listedFor={(row: ProductBalance) => listedFor(row, listed)}
      />
    </BalanceLayout>
  );
}
