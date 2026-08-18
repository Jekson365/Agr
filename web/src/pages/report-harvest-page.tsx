import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { monthNames as localizedMonthNames } from '@/components/ui/date-utils';
import { fruitKindImage, fruitTypeLabel, TREE_PRODUCT_UNIT_LABEL_KEY, TREE_STOCK_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { stockKindImage, stockTypeLabel, STOCK_UNIT_LABEL_KEY } from '@/config/stock-kinds';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvests } from '@/services/harvest-service';
import { getStock } from '@/services/stock-service';
import { getHarvestProducts, getTreeProducts } from '@/services/tree-product-service';
import { getTreeStock } from '@/services/tree-stock-service';
import type { Harvest } from '@/types/harvest';
import type { HarvestResult } from '@/types/harvest-result';
import type { Stock } from '@/types/stock';
import type { HarvestProduct, TreeProduct } from '@/types/tree-product';
import type { TreeStock } from '@/types/tree-stock';
import '@/components/farm/farm-crud.css';
import './report-harvest-page.css';

type YieldRow = { key: string; label: string; icon: string; unitLabel: string; amount: number };
type Season = 'winter' | 'spring' | 'summer' | 'autumn';

const SEASON_LABEL_KEY: Record<Season, string> = {
  winter: 'report.seasonWinter',
  spring: 'report.seasonSpring',
  summer: 'report.seasonSummer',
  autumn: 'report.seasonAutumn',
};

// Meteorological Northern-hemisphere convention: Dec–Feb winter, Mar–May spring, etc.
function seasonForMonth(monthIndex: number): Season {
  if (monthIndex === 11 || monthIndex === 0 || monthIndex === 1) return 'winter';
  if (monthIndex >= 2 && monthIndex <= 4) return 'spring';
  if (monthIndex >= 5 && monthIndex <= 7) return 'summer';
  return 'autumn';
}

/** A harvest date is a plain day stored as a timestamp, so only its date part is read — parsing
 * the whole timestamp lands on the previous day west of UTC, moving it into the wrong month,
 * season or year here. */
function parseIsoDate(value: string): Date {
  return new Date(`${value.slice(0, 10)}T00:00:00`);
}

export function ReportHarvestPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [treeStocks, setTreeStocks] = useState<TreeStock[]>([]);
  const [treeProducts, setTreeProducts] = useState<TreeProduct[]>([]);
  const [resultsByHarvest, setResultsByHarvest] = useState<Record<number, HarvestResult[]>>({});
  // Fruit harvests record their yield as produce against a tree product, not as a HarvestResult.
  const [productsByHarvest, setProductsByHarvest] = useState<Record<number, HarvestProduct[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [harvestList, stockList, treeStockList, treeProductList, harvestProductList] = await Promise.all([
        getHarvests(),
        // Reported harvests can name a good or an orchard that has since been removed, so include
        // those rows.
        getStock(true),
        getTreeStock(true),
        getTreeProducts(),
        getHarvestProducts(),
      ]);
      setHarvests(harvestList);
      setStocks(stockList);
      setTreeStocks(treeStockList);
      setTreeProducts(treeProductList);

      // Fruit produce is fetched for every harvest at once; group it by the harvest it came from.
      const byHarvest: Record<number, HarvestProduct[]> = {};
      for (const product of harvestProductList) {
        (byHarvest[product.harvestId] ??= []).push(product);
      }
      setProductsByHarvest(byHarvest);

      // Results only ever exist for harvests already marked Harvested (the backend enforces this).
      const harvestedIds = harvestList.filter((h) => h.status === 'Harvested').map((h) => h.id);
      const entries = await Promise.all(harvestedIds.map(async (id) => [id, await getHarvestResults(id)] as const));
      setResultsByHarvest(Object.fromEntries(entries));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function targetFor(stockId: number | null, treeStockId: number | null): { label: string; icon: string; unitLabel: string } | null {
    if (stockId != null) {
      const stock = stocks.find((s) => s.id === stockId);
      if (!stock) return null;
      return {
        label: stock.name.trim() || stockTypeLabel(stock.type, t),
        icon: stockKindImage(stock.type),
        unitLabel: t(STOCK_UNIT_LABEL_KEY[stock.unit]),
      };
    }
    if (treeStockId != null) {
      const treeStock = treeStocks.find((s) => s.id === treeStockId);
      if (!treeStock) return null;
      return {
        label: treeStock.name.trim() || fruitTypeLabel(treeStock.type, t),
        icon: fruitKindImage(treeStock.type),
        unitLabel: t(TREE_STOCK_UNIT_LABEL_KEY[treeStock.unit]),
      };
    }
    return null;
  }

  function productTargetFor(treeProductId: number): { label: string; icon: string; unitLabel: string } | null {
    const product = treeProducts.find((p) => p.id === treeProductId);
    if (!product) return null;
    // Produce has no artwork of its own, but it is assigned to at most one orchard — so show the
    // fruit that orchard grows, the way the stock rows above show their good. Falls back to the
    // generic tree while no orchard has claimed the product yet.
    const tree = treeStocks.find((s) => s.treeProductId === treeProductId);
    return {
      label: product.name,
      icon: fruitKindImage(tree?.type ?? ''),
      unitLabel: t(TREE_PRODUCT_UNIT_LABEL_KEY[product.unit] ?? 'farm.unitKg'),
    };
  }

  function yieldRowsFor(harvestId: number): YieldRow[] {
    const rows: YieldRow[] = [];
    for (const result of resultsByHarvest[harvestId] ?? []) {
      const target = targetFor(result.stockId, result.treeStockId);
      if (!target) continue;
      rows.push({
        key: result.stockId != null ? `s${result.stockId}` : `t${result.treeStockId}`,
        label: target.label,
        icon: target.icon,
        unitLabel: target.unitLabel,
        amount: result.amount,
      });
    }
    // Fruit harvests yield tree produce instead of stock results — list those too.
    for (const product of productsByHarvest[harvestId] ?? []) {
      const target = productTargetFor(product.treeProductId);
      if (!target) continue;
      rows.push({
        key: `p${product.id}`,
        label: target.label,
        icon: target.icon,
        unitLabel: target.unitLabel,
        amount: product.amount,
      });
    }
    return rows;
  }

  const rows = useMemo(() => {
    return harvests
      .filter((h) => h.status === 'Harvested')
      .map((h) => {
        const date = parseIsoDate(h.date);
        const cost = (h.equipmentCost ?? 0) + (h.workersCost ?? 0) + (h.fuelCost ?? 0) + (h.otherCost ?? 0);
        return {
          harvest: h,
          date,
          day: date.getDate(),
          month: date.getMonth(),
          year: date.getFullYear(),
          season: seasonForMonth(date.getMonth()),
          cost,
          yieldRows: yieldRowsFor(h.id),
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [harvests, resultsByHarvest, productsByHarvest, stocks, treeStocks, treeProducts]);

  function toggleRow(id: number) {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const monthNames = localizedMonthNames(language);

  return (
    <div className="report-harvest-page">
      <Link to="/report" className="back-link">
        ← {t('report.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('report.harvestPageTitle')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('report.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : rows.length === 0 ? (
        <p className="empty-state">{t('report.noResults')}</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>{t('report.colDay')}</th>
                <th>{t('report.colMonth')}</th>
                <th>{t('report.colYear')}</th>
                <th>{t('report.colSeason')}</th>
                <th>{t('report.colRevenue')}</th>
                <th>{t('report.colCost')}</th>
                <th>{t('report.colHarvested')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ harvest, day, month, year, season, cost, yieldRows }) => {
                const isOpen = !!expandedIds[harvest.id];
                return (
                  <Fragment key={harvest.id}>
                    <tr className="report-table-row" onClick={() => toggleRow(harvest.id)}>
                      <td>{day}</td>
                      <td>{monthNames[month]}</td>
                      <td>{year}</td>
                      <td>{t(SEASON_LABEL_KEY[season])}</td>
                      <td>{harvest.revenue != null ? formatPrice(harvest.revenue) : '—'}</td>
                      <td>{formatPrice(cost)}</td>
                      <td>
                        <span className="report-table-amount-cell">
                          <span className={isOpen ? 'report-table-chevron open' : 'report-table-chevron'}>
                            <ChevronDownIcon width={16} height={16} />
                          </span>
                          {t('report.itemTypesCount', { count: yieldRows.length })}
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="report-table-detail-row">
                        <td colSpan={7}>
                          {yieldRows.length === 0 ? (
                            <p className="report-empty-hint">{t('report.noYieldForHarvest')}</p>
                          ) : (
                            <div className="report-table-detail-list">
                              {yieldRows.map((row) => (
                                <div key={row.key} className="report-yield-row">
                                  <img src={row.icon} alt="" className="report-card-icon" />
                                  <span className="report-yield-label">{row.label}</span>
                                  <span className="report-yield-amount">
                                    {row.amount} {row.unitLabel}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
