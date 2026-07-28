import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { ListingFormModal, type ListingPreset } from '@/components/market/listing-form-modal';
import { Modal } from '@/components/ui/modal';
import { STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
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
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { ListingCategory, MarketListing } from '@/types/market-listing';
import type { StockMovementReportRow } from '@/types/report';
import type { TreeProduct, TreeProductMovement } from '@/types/tree-product';
import type { Unit } from '@/types/unit';

type ProductBalance = {
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
};

// The API returns every movement grouped by product; summing each product's deltas here gives
// its current balance without a separate call to fetch stock directly. A row's key
// differentiates Stock from TreeStock since their ids come from separate sequences.
// `kind` selects which of the two the caller wants, so plant stock and fruit trees can be
// reported in separate columns.
function balancesByProduct(
  rows: StockMovementReportRow[],
  kind: 'stock' | 'tree',
  t: (key: string) => string
): ProductBalance[] {
  const balances: ProductBalance[] = [];
  const byKey = new Map<string, ProductBalance>();

  for (const row of rows) {
    const isTree = row.stockId == null;
    if (isTree !== (kind === 'tree')) continue;

    const key = isTree ? `tree:${row.treeStockId}` : `stock:${row.stockId}`;
    let balance = byKey.get(key);
    if (!balance) {
      balance = {
        key,
        title: row.name.trim() || (isTree ? fruitTypeLabel(row.type, t) : stockTypeLabel(row.type, t)),
        unitLabel: isTree
          ? t(TREE_STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit)
          : t(STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit),
        balance: 0,
        market: { category: isTree ? 'TreeStock' : 'Stock', itemType: row.type },
      };
      byKey.set(key, balance);
      balances.push(balance);
    }
    balance.balance += row.delta;
  }

  return balances;
}

/**
 * Production records are append-only collections, so a type's balance is everything collected
 * plus the movements logged against that type/unit pair (marketplace sales carry a negative
 * delta). Keyed by unit since a type logged in both litres and pieces can't be summed.
 */
function balancesByProductionType(
  records: AnimalProduction[],
  movements: ProductionMovement[],
  productionTypes: ProductionType[],
  units: Unit[],
  t: (key: string) => string
): ProductBalance[] {
  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  const balances: ProductBalance[] = [];
  const byKey = new Map<string, ProductBalance>();

  const balanceFor = (productionTypeId: number, unitId: number): ProductBalance => {
    const key = `production:${productionTypeId}:${unitId}`;
    let balance = byKey.get(key);
    if (!balance) {
      const type = typeById.get(productionTypeId);
      const unit = unitById.get(unitId);
      balance = {
        key,
        title: type ? t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name) : '',
        unitLabel: unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '',
        balance: 0,
        // Milk, eggs and wool aren't animals, land or equipment — they list under Other, with
        // the production type carried as the item type.
        market: { category: 'Other', itemType: type?.name ?? '' },
      };
      byKey.set(key, balance);
      balances.push(balance);
    }
    return balance;
  };

  for (const record of records) {
    balanceFor(record.productionTypeId, record.unitId).balance += record.quantity;
  }
  for (const movement of movements) {
    balanceFor(movement.productionTypeId, movement.unitId).balance += movement.delta;
  }

  return balances;
}

/**
 * The fruits column reports the produce trees yield, not the trees themselves — a product's
 * balance is the sum of its movements (harvested adds, sales and manual adjustments can subtract).
 * Selling here lists under the TreeProduct category, keyed by product name, so the "on market"
 * total and the Sell button line up with the marketplace.
 */
function balancesByTreeProduct(
  products: TreeProduct[],
  movements: TreeProductMovement[],
  t: (key: string) => string
): ProductBalance[] {
  const balanceByProduct = new Map<number, number>();
  for (const m of movements) {
    balanceByProduct.set(m.treeProductId, (balanceByProduct.get(m.treeProductId) ?? 0) + m.delta);
  }

  return products.map((product) => ({
    key: `treeProduct:${product.id}`,
    title: product.name,
    unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg'),
    balance: balanceByProduct.get(product.id) ?? 0,
    market: { category: 'TreeProduct', itemType: product.name },
  }));
}

/**
 * Greenhouse stock keeps a running `amount` on the row itself rather than a movement ledger, so a
 * crop's balance is simply what it holds — no deltas to sum. One row per stock record, matching how
 * the plant-stock column reports two stocks of the same kind separately.
 *
 * These rows carry no `market`: the marketplace has no greenhouse category, and there is no
 * greenhouse movement table for a sale to draw down, so the column is read-only until both exist.
 */
function balancesByGreenhouseStock(stock: GreenhouseStock[], t: (key: string) => string): ProductBalance[] {
  return stock.map((item) => ({
    key: `greenhouse:${item.id}`,
    title: item.name.trim() || stockTypeLabel(item.type, t),
    unitLabel: t(STOCK_UNIT_LABEL_KEY[item.unit] ?? item.unit),
    balance: item.amount,
  }));
}

function BalanceColumn({
  title,
  productHeader,
  amountHeader,
  listedHeader,
  emptyLabel,
  rows,
  listedFor,
  sellLabel,
  onSell,
}: {
  title: string;
  productHeader: string;
  amountHeader: string;
  emptyLabel: string;
  rows: ProductBalance[];
  /* The marketplace half of the table. A column whose produce the marketplace cannot yet take a
     sale for omits all four, and renders as balances alone. */
  listedHeader?: string;
  /** How much of this product is on the marketplace right now, or 0. */
  listedFor?: (row: ProductBalance) => number;
  sellLabel?: string;
  onSell?: (row: ProductBalance) => void;
}) {
  const sellable = onSell != null && listedFor != null;

  return (
    <section className="balance-column">
      <h2 className="balance-column-title">{title}</h2>
      <table className="balance-table">
        <thead>
          <tr>
            <th>{productHeader}</th>
            <th className="balance-amount">{amountHeader}</th>
            {sellable && <th className="balance-amount">{listedHeader}</th>}
            {sellable && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={sellable ? 4 : 2}>{emptyLabel}</td>
            </tr>
          ) : (
            rows.map((item) => {
              const listed = sellable ? listedFor(item) : 0;
              return (
                <tr key={item.key}>
                  <td>{item.title}</td>
                  <td className="balance-amount">
                    {round2(item.balance)} {item.unitLabel}
                  </td>
                  {sellable && (
                    <td className="balance-amount balance-listed">
                      {listed > 0 ? `${round2(listed)} ${item.unitLabel}` : '—'}
                    </td>
                  )}
                  {sellable && (
                    <td className="balance-sell-cell">
                      {/* Nothing on hand, nothing to offer. */}
                      <button type="button" className="balance-sell" disabled={item.balance <= 0} onClick={() => onSell(item)}>
                        {sellLabel}
                      </button>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </section>
  );
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

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

  // How much of each product is on the marketplace right now. Listings carry the kind, not the
  // individual stock row, so two stocks of the same kind both report the kind's listed total.
  const listedByProduct = new Map<string, number>();
  for (const listing of listings) {
    if (listing.status !== 'Active' || listing.quantity == null) continue;
    const key = `${listing.category}:${listing.itemType}`;
    listedByProduct.set(key, (listedByProduct.get(key) ?? 0) + listing.quantity);
  }
  const listedFor = (row: ProductBalance) =>
    row.market ? (listedByProduct.get(`${row.market.category}:${row.market.itemType}`) ?? 0) : 0;

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
            listedFor={listedFor}
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
            listedFor={listedFor}
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
            listedFor={listedFor}
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

      <Modal open={soldListing != null} onClose={() => setSoldListing(null)}>
        <div className="sell-success">
          <span className="sell-success-icon">✓</span>
          <h2 className="modal-title">{t('market.listedTitle')}</h2>
          <p className="modal-body-text">
            {t('market.listedBody', {
              title: soldListing?.title ?? '',
              amount: soldListing?.quantity ?? 0,
              unit: soldListing?.priceUnit ?? '',
            })}
          </p>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setSoldListing(null)}>
            {t('common.close')}
          </button>
          {soldListing && (
            <Link to={`/market/${soldListing.id}`} className="btn sell-success-link">
              {t('market.viewListing')}
            </Link>
          )}
        </div>
      </Modal>
    </div>
  );
}
