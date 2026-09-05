import { useEffect, useState } from 'react';

import { AdjustBalanceModal } from '@/components/farm/adjust-balance-modal';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getStockMovementReport } from '@/services/report-service';
import { ASSESSMENT_GRADES, type HarvestAssessment } from '@/types/harvest-assessment';
import type { MarketListing } from '@/types/market-listing';
import type { StockMovementReportRow } from '@/types/report';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByProduct } from './balance-sources';
import { adjustOptions, listedFor, listedTotals, type ProductBalance } from './product-balance';

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
  const [bands, setBands] = useState<HarvestAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [movementRows, listingList, bandRows] = await Promise.all([
        getStockMovementReport(),
        getMarketListings({ mine: true }),
        // The quality split is a reading of what the harvests graded, so a page without it is
        // still the balance it says it is — a failure here leaves the rows unsplit.
        getHarvestAssessments().catch(() => []),
      ]);
      setRows(movementRows);
      setListings(listingList);
      setBands(bandRows);
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

  /** The kind behind each row, keyed the way balancesByProduct keys its balances. A balance
   *  carries the figures alone, so the artwork and the crop name are resolved back through this
   *  rather than widened into the shared row type. */
  const kindByKey = new Map(rows.map((row) => [`stock:${row.stockId}`, row.type]));

  function iconFor(row: ProductBalance) {
    const type = kindByKey.get(row.key);
    return type ? stockKindImage(type) : undefined;
  }

  /** The crop, under a good the owner gave a name of its own. A row titled after its crop already
   *  says this, so there it is left off rather than printed twice. */
  function captionFor(row: ProductBalance) {
    const type = kindByKey.get(row.key);
    if (!type) return undefined;
    const label = stockTypeLabel(type, t);
    return label === row.title ? undefined : label;
  }

  /** Which bands each good has been graded into, across every harvest that assessed it. Only a
   *  harvest grades produce — sales and manual moves are ungraded — so a band says the good came
   *  off the field at that quality, not how much of the balance is still at it. */
  function bandsFor(row: ProductBalance): string[] {
    const stockId = Number(row.key.split(':')[1]);
    const totals = new Map<string, number>();
    for (const band of bands) {
      if (band.stockId !== stockId) continue;
      totals.set(band.grade, (totals.get(band.grade) ?? 0) + band.quantity);
    }
    return ASSESSMENT_GRADES.filter((grade) => (totals.get(grade) ?? 0) > 0);
  }

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
        amountHeader={t('balance.colBalance')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('balance.empty')}
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
