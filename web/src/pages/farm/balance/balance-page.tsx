import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { ListingFormModal, type ListingPreset } from '@/components/market/listing-form-modal';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import { getStockMovementReport } from '@/services/report-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import type { MarketListing } from '@/types/market-listing';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { Unit } from '@/types/unit';
import { BalanceColumn } from './balance-column';
import { ListingCreatedModal } from './listing-created-modal';
import {
  balancesByGreenhouseStock,
  balancesByProduct,
  balancesByProductionType,
  balancesByTreeProduct,
  listedFor,
  listedTotals,
  round2,
  type ProductBalance,
} from './product-balance';

/**
 * What the farm currently holds, in four columns: plant stock, livestock production, fruit produce
 * and greenhouse crops. Each is derived differently — see product-balance.ts — but reads the same,
 * and everything the marketplace can take a sale for can be listed straight from its row.
 */
export function BalancePage() {
  const { t } = useLanguage();

  const [rows, setRows] = useState<StockMovementReportRow[]>([]);
  const [greenhouseStock, setGreenhouseStock] = useState<GreenhouseStock[]>([]);
  const [productions, setProductions] = useState<AnimalProduction[]>([]);
  const [productionMovements, setProductionMovements] = useState<ProductionMovement[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [treeProductMovements, setTreeProductMovements] = useState<TreeProductMovement[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  /** Seed values for the marketplace form, set when a row's Sell button is pressed. */
  const [sellPreset, setSellPreset] = useState<ListingPreset | null>(null);
  /** The listing just created from a Sell, shown as a confirmation until dismissed. */
  const [soldListing, setSoldListing] = useState<MarketListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [
        movementRows,
        productionList,
        productionMovementList,
        typeList,
        treeProductList,
        treeProductMovementList,
        unitList,
        listingList,
        greenhouseStockList,
      ] = await Promise.all([
        getStockMovementReport(),
        getAllAnimalProductions(),
        getProductionMovements(),
        getProductionTypes(),
        getTreeProducts(),
        getTreeProductMovements(),
        getUnits(),
        getMarketListings({ mine: true }),
        // No greenhouse id — every greenhouse's stock, since the balance covers the whole holding.
        getGreenhouseStock(),
      ]);
      setRows(movementRows);
      setGreenhouseStock(greenhouseStockList);
      setProductions(productionList);
      setProductionMovements(productionMovementList);
      setProductionTypes(typeList);
      setTreeProducts(treeProductList);
      setTreeProductMovements(treeProductMovementList);
      setUnits(unitList);
      setListings(listingList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function openSell(row: ProductBalance) {
    // Read-only rows have no marketplace category to list under.
    if (!row.market) return;
    setSellPreset({
      category: row.market.category,
      itemType: row.market.itemType,
      title: row.title,
      priceUnit: row.unitLabel,
      quantity: round2(row.balance),
      // Can't offer more than the balance actually holds.
      maxQuantity: round2(row.balance),
    });
  }

  const listed = listedTotals(listings);
  const listedForRow = (row: ProductBalance) => listedFor(row, listed);

  const stockBalances = balancesByProduct(rows, 'stock', t);
  const treeBalances = balancesByTreeProduct(treeProducts, treeProductMovements, t);
  const productionBalances = balancesByProductionType(productions, productionMovements, productionTypes, units, t);
  const greenhouseBalances = balancesByGreenhouseStock(greenhouseStock, t);

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('farm.balance')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('balance.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="balance-columns">
          <BalanceColumn
            title={t('farm.plantStock')}
            productHeader={t('balance.colPlant')}
            amountHeader={t('balance.colBalance')}
            listedHeader={t('balance.colOnMarket')}
            emptyLabel={t('balance.empty')}
            rows={stockBalances}
            listedFor={listedForRow}
            sellLabel={t('market.sell')}
            onSell={openSell}
          />
          <BalanceColumn
            title={t('farm.livestock')}
            productHeader={t('balance.colProduct')}
            amountHeader={t('balance.colCollected')}
            listedHeader={t('balance.colOnMarket')}
            emptyLabel={t('balance.emptyLivestock')}
            rows={productionBalances}
            listedFor={listedForRow}
            sellLabel={t('market.sell')}
            onSell={openSell}
          />
          <BalanceColumn
            title={t('farm.fruits')}
            productHeader={t('balance.colProduct')}
            amountHeader={t('balance.colBalance')}
            listedHeader={t('balance.colOnMarket')}
            emptyLabel={t('balance.emptyTree')}
            rows={treeBalances}
            listedFor={listedForRow}
            sellLabel={t('market.sell')}
            onSell={openSell}
          />
          {/* Read-only: greenhouse produce has no marketplace category and no movement ledger to
              draw a sale down from, so it reports balances without the sell half. */}
          <BalanceColumn
            title={t('farm.greenhouse')}
            productHeader={t('balance.colPlant')}
            amountHeader={t('balance.colBalance')}
            emptyLabel={t('balance.emptyGreenhouse')}
            rows={greenhouseBalances}
          />
        </div>
      )}

      <ListingFormModal
        open={sellPreset != null}
        editingListing={null}
        preset={sellPreset}
        onClose={() => setSellPreset(null)}
        onSaved={(listing) => {
          setSellPreset(null);
          setSoldListing(listing);
        }}
      />

      <ListingCreatedModal listing={soldListing} onClose={() => setSoldListing(null)} />
    </div>
  );
}
