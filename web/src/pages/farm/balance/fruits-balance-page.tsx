import { useEffect, useState } from 'react';

import { AdjustBalanceModal } from '@/components/farm/adjust-balance-modal';
import { fruitKindImage, fruitTypeLabel } from '@/config/fruit-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getStockMovementReport } from '@/services/report-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import { ASSESSMENT_GRADES, type HarvestAssessment } from '@/types/harvest-assessment';
import type { MarketListing } from '@/types/market-listing';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByProduct, balancesByTreeProduct } from './balance-sources';
import { adjustOptions, listedFor, listedTotals, type ProductBalance } from './product-balance';

/**
 * What the orchards have yielded and how much of it is left, by product. This table reports what
 * the holding *yields* rather than the holding itself — produce outlives the orchard that gave it,
 * so nothing is missing from it to reveal. What is missing is the removed orchards themselves, by
 * their tree count; those are appended once asked for.
 */
export function FruitsBalancePage() {
  const { t } = useLanguage();

  const [showRemoved, setShowRemoved] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [treeProductMovements, setTreeProductMovements] = useState<TreeProductMovement[]>([]);
  const [orchards, setOrchards] = useState<TreeStock[]>([]);
  const [bands, setBands] = useState<HarvestAssessment[]>([]);
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
      const [productList, movementList, movementRows, listingList, orchardList, bandRows] = await Promise.all([
        getTreeProducts(),
        getTreeProductMovements(),
        getStockMovementReport(),
        getMarketListings({ mine: true }),
        getTreeStock(true),
        getHarvestAssessments().catch(() => []),
      ]);
      setTreeProducts(productList);
      setTreeProductMovements(movementList);
      setRows(movementRows);
      setListings(listingList);
      setOrchards(orchardList);
      setBands(bandRows);
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

  const orchardById = new Map(orchards.map((orchard) => [orchard.id, orchard]));
  const orchardByProduct = new Map(
    orchards.filter((orchard) => orchard.treeProductId != null).map((orchard) => [orchard.treeProductId!, orchard])
  );

  function orchardFor(row: ProductBalance): TreeStock | undefined {
    const [scope, id] = row.key.split(':');
    return scope === 'treeProduct' ? orchardByProduct.get(Number(id)) : orchardById.get(Number(id));
  }

  function iconFor(row: ProductBalance) {
    return fruitKindImage(orchardFor(row)?.type ?? '');
  }

  function captionFor(row: ProductBalance) {
    const orchard = orchardFor(row);
    if (!orchard) return undefined;
    const label = fruitTypeLabel(orchard.type, t);
    return label === row.title ? undefined : label;
  }

  function bandsFor(row: ProductBalance): string[] {
    const orchard = orchardFor(row);
    if (!orchard) return [];
    const totals = new Map<string, number>();
    for (const band of bands) {
      if (band.treeStockId !== orchard.id) continue;
      totals.set(band.grade, (totals.get(band.grade) ?? 0) + band.quantity);
    }
    return ASSESSMENT_GRADES.filter((grade) => (totals.get(grade) ?? 0) > 0);
  }

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
      actions={
        <button type="button" className="add-button" onClick={() => setAdjustOpen(true)}>
          + {t('balance.adjust')}
        </button>
      }
    >
      <BalanceColumn
        amountHeader={t('balance.colBalance')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('balance.emptyTree')}
        rows={balances}
        listedFor={(row: ProductBalance) => listedFor(row, listed)}
        bandsFor={bandsFor}
        iconFor={iconFor}
        captionFor={captionFor}
      />

      <AdjustBalanceModal open={adjustOpen} options={adjustOptions(balances)} onClose={() => setAdjustOpen(false)} onSaved={load} />
    </BalanceLayout>
  );
}
