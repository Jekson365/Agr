import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import greenhouseIcon from '@/assets/icons/greenhouse.png';
import animalsIcon from '@/assets/properties/animals.png';
import fruitsIcon from '@/assets/properties/fruits.png';
import plantsIcon from '@/assets/properties/plants.png';
import '@/components/farm/farm-crud.css';
import '@/components/farm/tabs.css';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getGreenhouseStock } from '@/services/greenhouse-stock-service';
import { getLivestock } from '@/services/livestock-service';
import { getMarketListings } from '@/services/market-listing-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getStockMovementReport } from '@/services/report-service';
import { getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import type { Livestock } from '@/types/livestock';
import type { MarketListing } from '@/types/market-listing';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { Unit } from '@/types/unit';
import { BalanceColumn } from './balance-column';
import {
  balancesByGreenhouseStock,
  balancesByProduct,
  balancesByProductionType,
  balancesByTreeProduct,
  listedFor,
  listedTotals,
  removedLivestockBalances,
  type ProductBalance,
} from './product-balance';

/** Which holding's table is open. */
type BalanceTab = 'stock' | 'livestock' | 'fruits' | 'greenhouse';

/**
 * What the farm currently holds, in four tables: plant stock, livestock production, fruit produce
 * and greenhouse crops. Each is derived differently — see product-balance.ts — but reads the same.
 *
 * A reading of the holding, and nothing more: what is already on the marketplace is reported
 * beside each balance, but listing more of it is done from the marketplace itself.
 *
 * One at a time, behind tabs: four tables of figures side by side are four things to compare that
 * have nothing to do with each other, and each was left too narrow for the row it carries.
 */
export function BalancePage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<BalanceTab>('stock');
  /**
   * Whether the holdings the farm has removed are shown alongside what it keeps. Off by default —
   * the page answers "what do I have?", and a removed holding is not part of that — but what it
   * held was real and is still recorded, so it can be asked for.
   */
  const [showRemoved, setShowRemoved] = useState(false);

  const [rows, setRows] = useState<StockMovementReportRow[]>([]);
  const [greenhouseStock, setGreenhouseStock] = useState<GreenhouseStock[]>([]);
  const [productions, setProductions] = useState<AnimalProduction[]>([]);
  const [productionMovements, setProductionMovements] = useState<ProductionMovement[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [treeProductMovements, setTreeProductMovements] = useState<TreeProductMovement[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [listings, setListings] = useState<MarketListing[]>([]);
  /** Every group, removed ones included — the removed view names them, and the rest are filtered
   *  out of it. Read once with the page rather than on toggling, so the button is instant. */
  const [livestock, setLivestock] = useState<Livestock[]>([]);
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
        livestockList,
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
        getLivestock(true),
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
      setLivestock(livestockList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const listed = listedTotals(listings);
  const listedForRow = (row: ProductBalance) => listedFor(row, listed);

  // Plant stock is the one table that reports the holdings themselves, so removed goods belong in
  // it directly rather than as an appendix.
  const stockBalances = balancesByProduct(rows, 'stock', t, showRemoved ? 'include' : 'exclude');

  /* The other two tables report what a holding yields, not the holding — and produce outlives the
     orchard or herd that gave it, so nothing is missing from them to reveal. What is missing is the
     removed holdings themselves: the orchards by their tree count, the groups by their head count.
     Those are appended, after the produce the farm still has. */
  const treeBalances = [
    ...balancesByTreeProduct(treeProducts, treeProductMovements, t),
    ...(showRemoved ? balancesByProduct(rows, 'tree', t, 'only') : []),
  ];
  const productionBalances = [
    ...balancesByProductionType(productions, productionMovements, productionTypes, units, t),
    ...(showRemoved ? removedLivestockBalances(livestock, t) : []),
  ];
  const greenhouseBalances = balancesByGreenhouseStock(greenhouseStock, t);

  /* Whether asking for the removed holdings would turn anything up — the button is pointless on a
     farm that has removed nothing, and worse than pointless if pressing it appears to do nothing. */
  const hasRemoved =
    rows.some((row) => row.isDeleted) || livestock.some((group) => group.isDeleted);

  // One entry per holding, in tab order: the tab that names a table and the table it opens are
  // read off the same row here, so the two cannot drift apart.
  const holdings: {
    key: BalanceTab;
    title: string;
    icon: string;
    productHeader: string;
    amountHeader: string;
    emptyLabel: string;
    rows: ProductBalance[];
    /** Whether the marketplace has a category for this produce, and so whether there is anything
     *  to report about what it holds of it — see the greenhouse entry. */
    onMarket: boolean;
  }[] = [
    {
      key: 'stock',
      title: t('farm.plantStock'),
      icon: plantsIcon,
      productHeader: t('balance.colPlant'),
      amountHeader: t('balance.colBalance'),
      emptyLabel: t('balance.empty'),
      rows: stockBalances,
      onMarket: true,
    },
    {
      key: 'livestock',
      title: t('farm.livestock'),
      icon: animalsIcon,
      productHeader: t('balance.colProduct'),
      amountHeader: t('balance.colCollected'),
      emptyLabel: t('balance.emptyLivestock'),
      rows: productionBalances,
      onMarket: true,
    },
    {
      key: 'fruits',
      title: t('farm.fruits'),
      icon: fruitsIcon,
      productHeader: t('balance.colProduct'),
      amountHeader: t('balance.colBalance'),
      emptyLabel: t('balance.emptyTree'),
      rows: treeBalances,
      onMarket: true,
    },
    {
      key: 'greenhouse',
      title: t('farm.greenhouse'),
      icon: greenhouseIcon,
      productHeader: t('balance.colPlant'),
      amountHeader: t('balance.colBalance'),
      emptyLabel: t('balance.emptyGreenhouse'),
      rows: greenhouseBalances,
      // The marketplace has no greenhouse category, so there is nothing it could be holding of
      // this produce: the table reports the balances alone.
      onMarket: false,
    },
  ];
  const active = holdings.find((holding) => holding.key === tab) ?? holdings[0];

  return (
    <div>
      <Link to="/farm" className="back-link">
        ← {t('farm.title')}
      </Link>
{/* 
      <div className="page-header">
        <h1 className="page-title">{t('farm.balance')}</h1>
        {!loading && !error && hasRemoved && (
          <button
            type="button"
            className={showRemoved ? 'add-button balance-removed-toggle active' : 'add-button balance-removed-toggle'}
            onClick={() => setShowRemoved((prev) => !prev)}
            aria-pressed={showRemoved}
          >
            {t(showRemoved ? 'balance.hideRemoved' : 'balance.showRemoved')}
          </button>
        )}
      </div> */}

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
        <>
          <div className="tab-row balance-tabs">
            {holdings.map((holding) => (
              <button
                key={holding.key}
                type="button"
                className={holding.key === tab ? 'tab-item active' : 'tab-item'}
                onClick={() => setTab(holding.key)}
              >
                <img src={holding.icon} alt="" className="balance-tab-icon" />
                {holding.title}
                {/* How many products the table behind this tab reports, so a tab worth opening is
                    told from an empty one without opening it. */}
                {holding.rows.length > 0 && <span className="balance-tab-count">{holding.rows.length}</span>}
              </button>
            ))}
          </div>

          <div className="balance-panel">
            <BalanceColumn
              productHeader={active.productHeader}
              amountHeader={active.amountHeader}
              listedHeader={active.onMarket ? t('balance.colOnMarket') : undefined}
              emptyLabel={active.emptyLabel}
              rows={active.rows}
              listedFor={active.onMarket ? listedForRow : undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
