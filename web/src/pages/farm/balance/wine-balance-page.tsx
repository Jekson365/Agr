import { useEffect, useState } from 'react';

import { AdjustBalanceModal } from '@/components/farm/adjust-balance-modal';
import { WINE_AREA } from '@/config/stock-areas';
import { stockKindImage, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { loadBottleLots, type BottleLot } from '@/pages/wine/wine-bottle-lots';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getStock } from '@/services/stock-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import { getWineBatches } from '@/services/wine-batch-service';
import { ASSESSMENT_GRADES, type HarvestAssessment } from '@/types/harvest-assessment';
import type { MarketListing } from '@/types/market-listing';
import type { Stock } from '@/types/stock';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { WineBatchSummary } from '@/types/wine';
import { BalanceColumn } from './balance-column';
import { BalanceLayout } from './balance-layout';
import { balancesByTreeProduct } from './balance-sources';
import { adjustOptions, listedFor, listedTotals, type ProductBalance } from './product-balance';
import { WineBalanceCards } from './wine-balance-cards';
import { wineAdjustOptions } from './wine-balance-options';
import './wine-balance.css';

export function WineBalancePage() {
  const { t } = useLanguage();

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [products, setProducts] = useState<TreeProduct[]>([]);
  const [movements, setMovements] = useState<TreeProductMovement[]>([]);
  const [vineyards, setVineyards] = useState<Stock[]>([]);
  const [bands, setBands] = useState<HarvestAssessment[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [batches, setBatches] = useState<WineBatchSummary[]>([]);
  const [lots, setLots] = useState<BottleLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [productList, movementList, vineyardList, listingList, bandRows, batchList, lotList] = await Promise.all([
        getTreeProducts('Wine'),
        getTreeProductMovements(),
        getStock(true, 'Wine'),
        getMarketListings({ mine: true }),
        getHarvestAssessments().catch(() => []),
        getWineBatches(true),
        loadBottleLots(),
      ]);
      setProducts(productList);
      setMovements(movementList);
      setVineyards(vineyardList);
      setListings(listingList);
      setBands(bandRows);
      setBatches(batchList);
      setLots(lotList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const vineyardByProduct = new Map(
    vineyards
      .filter((vineyard) => vineyard.treeProductId != null)
      .map((vineyard) => [`treeProduct:${vineyard.treeProductId}`, vineyard])
  );

  const harvestedProducts = new Set(movements.map((movement) => movement.treeProductId));
  const grapeProducts = products.filter(
    (product) => vineyardByProduct.has(`treeProduct:${product.id}`) && harvestedProducts.has(product.id)
  );

  const listed = listedTotals(listings);
  const balances: ProductBalance[] = balancesByTreeProduct(grapeProducts, movements, t).map((row) => {
    const vineyard = vineyardByProduct.get(row.key)!;
    const title = vineyard.name.trim() || stockTypeLabel(vineyard.type, t);
    return vineyard.isDeleted ? { ...row, title, market: undefined, removed: true } : { ...row, title };
  });

  function iconFor(row: ProductBalance) {
    return stockKindImage(vineyardByProduct.get(row.key)?.type ?? 'Grape');
  }

  function captionFor(row: ProductBalance) {
    const vineyard = vineyardByProduct.get(row.key);
    if (!vineyard) return undefined;
    const label = stockTypeLabel(vineyard.type, t);
    return label === row.title ? undefined : label;
  }

  function bandsFor(row: ProductBalance): string[] {
    const vineyard = vineyardByProduct.get(row.key);
    if (!vineyard) return [];
    const totals = new Map<string, number>();
    for (const band of bands) {
      if (band.stockId !== vineyard.id) continue;
      totals.set(band.grade, (totals.get(band.grade) ?? 0) + band.quantity);
    }
    return ASSESSMENT_GRADES.filter((grade) => (totals.get(grade) ?? 0) > 0);
  }

  return (
    <BalanceLayout
      backTo={WINE_AREA.stockPath}
      backLabel={t(WINE_AREA.titleKey)}
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <button type="button" className="add-button" onClick={() => setAdjustOpen(true)}>
          + {t('balance.adjust')}
        </button>
      }
    >
      <h2 className="wine-balance-heading">{t('wine.grapesTitle')}</h2>
      <BalanceColumn
        amountHeader={t('balance.colBalance')}
        listedHeader={t('balance.colOnMarket')}
        emptyLabel={t('wine.balanceEmpty')}
        rows={balances}
        listedFor={(row: ProductBalance) => listedFor(row, listed)}
        bandsFor={bandsFor}
        iconFor={iconFor}
        captionFor={captionFor}
      />

      <h2 className="wine-balance-heading">{t('wine.wineTitle')}</h2>
      <WineBalanceCards batches={batches} />

      <AdjustBalanceModal
        open={adjustOpen}
        options={[...adjustOptions(balances.filter((row) => !row.removed)), ...wineAdjustOptions(batches, lots, t)]}
        onClose={() => setAdjustOpen(false)}
        onSaved={load}
      />
    </BalanceLayout>
  );
}
