import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/kind-picker.css';
import '@/components/farm/search-filter.css';
import { FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { ChevronDownIcon } from '@/components/icons/nav-icons';
import { DateField } from '@/components/ui/date-field';
import { formatLocalizedIsoDate, parseIsoDate, todayIsoDate } from '@/components/ui/date-utils';
import { fruitKindImage, TREE_PRODUCT_UNIT_LABEL_KEY } from '@/config/fruit-kinds';
import { stockKindImage, STOCK_UNIT_LABEL_KEY, stockTypeLabel } from '@/config/stock-kinds';
import { useLanguage } from '@/contexts/language-context';
import { getHarvests } from '@/services/harvest-service';
import { getStockMovementReport } from '@/services/report-service';
import { getHarvestProducts, getTreeProductMovements, getTreeProducts } from '@/services/tree-product-service';
import type { StockMovementSource } from '@/types/stock-movement';
import './report-stock-page.css';

type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
type Quarter = 1 | 2 | 3 | 4;
type KindFilter = 'all' | 'stock' | 'tree';

const PERIOD_OPTIONS: { value: PeriodMode; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.periodAll' },
  { value: 'year', labelKey: 'report.periodYear' },
  { value: 'quarter', labelKey: 'report.periodQuarter' },
  { value: 'custom', labelKey: 'report.periodCustom' },
];

const QUARTER_OPTIONS: { value: Quarter; labelKey: string }[] = [
  { value: 1, labelKey: 'report.quarterQ1' },
  { value: 2, labelKey: 'report.quarterQ2' },
  { value: 3, labelKey: 'report.quarterQ3' },
  { value: 4, labelKey: 'report.quarterQ4' },
];

const KIND_OPTIONS: { value: KindFilter; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.filterAll' },
  { value: 'stock', labelKey: 'farm.plantStock' },
  { value: 'tree', labelKey: 'farm.fruits' },
];

const SOURCE_LABEL_KEY: Record<StockMovementSource, string> = {
  Manual: 'stockHistory.sourceManual',
  Harvest: 'stockHistory.sourceHarvest',
  Market: 'stockHistory.sourceMarket',
  Purchase: 'stockHistory.sourcePurchase',
};

const SOURCE_OPTIONS: { value: StockMovementSource | 'all'; labelKey: string }[] = [
  { value: 'all', labelKey: 'report.filterAll' },
  { value: 'Manual', labelKey: 'stockHistory.sourceManual' },
  { value: 'Harvest', labelKey: 'stockHistory.sourceHarvest' },
  { value: 'Market', labelKey: 'stockHistory.sourceMarket' },
  { value: 'Purchase', labelKey: 'stockHistory.sourcePurchase' },
];

/** A single movement in the stock report — a plant-stock movement from the server report, or a
 * tree-product movement merged in on the client. Belongs to exactly one of stockId (a plant-stock
 * good) or treeProductId (a fruit-tree product). */
type ReportRow = {
  id: number;
  stockId: number | null;
  treeProductId: number | null;
  /** The product's name. Empty for plant stock, which falls back to its type label. */
  name: string;
  /** The plant-stock kind, for icon/label lookup. Empty for tree products, which have none. */
  type: string;
  unit: string;
  delta: number;
  source: StockMovementSource;
  /** The harvest a Harvest-sourced movement came from; null for manual edits and market sales. */
  harvestTitle: string | null;
  createdAt: string;
};

/** One line of the report: a product with its movements totalled over the period. */
type ProductRow = {
  key: string;
  label: string;
  icon: string;
  unitLabel: string;
  isTree: boolean;
  /** Sum of positive deltas — stock added. */
  inflow: number;
  /** Sum of negative deltas, as a positive number — stock removed. */
  outflow: number;
  net: number;
  movements: number;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function ReportStockPage() {
  const { t, language } = useLanguage();

  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [quarter, setQuarter] = useState<Quarter>(() => (Math.floor(new Date().getMonth() / 3) + 1) as Quarter);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<StockMovementSource | 'all'>('all');
  /** Product keys whose individual movements are shown beneath their row. */
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggleExpanded(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [reportRows, products, productMovements, harvests, harvestProducts] = await Promise.all([
        getStockMovementReport(),
        getTreeProducts(),
        getTreeProductMovements(),
        getHarvests('Fruit'),
        getHarvestProducts(),
      ]);

      // Only the plant-stock rows come from the server report now; its tree-stock rows are
      // dropped in favour of the tree-product ledger below.
      const stockRows: ReportRow[] = reportRows
        .filter((r) => r.stockId != null)
        .map((r) => ({
          id: r.id,
          stockId: r.stockId,
          treeProductId: null,
          name: r.name,
          type: r.type,
          unit: r.unit,
          delta: r.delta,
          source: r.source,
          harvestTitle: r.harvestTitle,
          createdAt: r.createdAt,
        }));

      // Resolve a Harvest-sourced product movement back to its harvest's title, one hop through
      // the harvest-product row that produced it.
      const productById = new Map(products.map((p) => [p.id, p]));
      const harvestIdByProduct = new Map(harvestProducts.map((hp) => [hp.id, hp.harvestId]));
      const titleByHarvest = new Map(harvests.map((h) => [h.id, h.title]));

      const treeRows: ReportRow[] = productMovements.map((m) => {
        const harvestId = m.harvestProductId != null ? harvestIdByProduct.get(m.harvestProductId) : undefined;
        return {
          id: m.id,
          stockId: null,
          treeProductId: m.treeProductId,
          name: productById.get(m.treeProductId)?.name ?? '',
          type: '',
          unit: productById.get(m.treeProductId)?.unit ?? 'Kilogram',
          delta: m.delta,
          source: m.source,
          harvestTitle: harvestId != null ? (titleByHarvest.get(harvestId) ?? null) : null,
          createdAt: m.createdAt,
        };
      });

      setRows([...stockRows, ...treeRows]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function isInRange(iso: string): boolean {
    const date = parseIsoDate(iso);
    if (!date) return false;
    if (periodMode === 'year') return date.getFullYear() === year;
    if (periodMode === 'quarter') {
      return date.getFullYear() === year && Math.floor(date.getMonth() / 3) + 1 === quarter;
    }
    if (periodMode === 'custom') {
      const from = parseIsoDate(customFrom);
      const to = parseIsoDate(customTo);
      if (from && date < from) return false;
      // `to` is midnight, so include the whole of that day.
      if (to && date > new Date(to.getTime() + 86_399_999)) return false;
      return true;
    }
    return true;
  }

  function labelFor(row: ReportRow): string {
    // Tree products always carry a name; only plant stock falls back to its kind label.
    if (row.stockId == null) return row.name;
    return row.name.trim() || stockTypeLabel(row.type, t);
  }

  const summary = useMemo(() => {
    const term = search.trim().toLowerCase();

    const visible = rows
      .filter((r) => isInRange(r.createdAt))
      .filter((r) => (kindFilter === 'all' ? true : kindFilter === 'tree' ? r.stockId == null : r.stockId != null))
      .filter((r) => (sourceFilter === 'all' ? true : r.source === sourceFilter))
      .filter((r) => (term ? labelFor(r).toLowerCase().includes(term) : true));

    const byKey = new Map<string, ProductRow>();
    const movementsByKey = new Map<string, ReportRow[]>();
    let inflowMovements = 0;
    let outflowMovements = 0;
    let earliest: string | null = null;
    let latest: string | null = null;

    for (const row of visible) {
      // Stock and TreeProduct ids come from separate sequences, so the kind is part of the key.
      const isTree = row.stockId == null;
      const key = isTree ? `tree:${row.treeProductId}` : `stock:${row.stockId}`;

      let product = byKey.get(key);
      if (!product) {
        product = {
          key,
          label: labelFor(row),
          icon: isTree ? fruitKindImage(row.type) : stockKindImage(row.type),
          unitLabel: isTree
            ? t(TREE_PRODUCT_UNIT_LABEL_KEY[row.unit] ?? row.unit)
            : t(STOCK_UNIT_LABEL_KEY[row.unit] ?? row.unit),
          isTree,
          inflow: 0,
          outflow: 0,
          net: 0,
          movements: 0,
        };
        byKey.set(key, product);
      }

      if (row.delta >= 0) {
        product.inflow += row.delta;
        inflowMovements += 1;
      } else {
        product.outflow += -row.delta;
        outflowMovements += 1;
      }
      product.net += row.delta;
      product.movements += 1;

      const list = movementsByKey.get(key);
      if (list) list.push(row);
      else movementsByKey.set(key, [row]);

      if (earliest == null || row.createdAt < earliest) earliest = row.createdAt;
      if (latest == null || row.createdAt > latest) latest = row.createdAt;
    }

    // Newest movement first within each product, matching how the history views read.
    for (const list of movementsByKey.values()) {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    return {
      products: [...byKey.values()].sort((a, b) => Math.abs(b.net) - Math.abs(a.net) || b.movements - a.movements),
      movementsByKey,
      movements: visible.length,
      inflowMovements,
      outflowMovements,
      earliest,
      latest,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, periodMode, year, quarter, customFrom, customTo, kindFilter, sourceFilter, t]);

  const hasDates = summary.earliest != null && summary.latest != null;

  return (
    <div>
      <Link to="/report" className="back-link">
        ← {t('report.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('report.stockPageTitle')}</h1>
        <button
          type="button"
          className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
          onClick={() => setFiltersOpen((prev) => !prev)}
          aria-label={t('report.filtersLabel')}
        >
          <FilterIcon width={18} height={18} />
        </button>
      </div>

      <div className="search-row">
        <label className="search-field">
          <SearchIcon width={18} height={18} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('report.searchPlaceholderStock')} />
        </label>
      </div>

      {filtersOpen && (
        <div className="report-filter-panel">
          <div className="filter-row">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={periodMode === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setPeriodMode(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>

          {(periodMode === 'year' || periodMode === 'quarter') && (
            <div className="report-year-row">
              <button
                type="button"
                className="report-year-nav-button"
                onClick={() => setYear((y) => y - 1)}
                aria-label={t('calendar.previousMonth')}
              >
                ‹
              </button>
              <span className="report-year-text">{year}</span>
              <button
                type="button"
                className="report-year-nav-button"
                onClick={() => setYear((y) => y + 1)}
                aria-label={t('calendar.nextMonth')}
              >
                ›
              </button>
            </div>
          )}

          {periodMode === 'quarter' && (
            <div className="filter-row">
              {QUARTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={quarter === opt.value ? 'kind-chip active' : 'kind-chip'}
                  onClick={() => setQuarter(opt.value)}
                >
                  <span>{t(opt.labelKey)}</span>
                </button>
              ))}
            </div>
          )}

          {periodMode === 'custom' && (
            <div className="report-custom-range-row">
              <div className="field">
                <label>{t('report.fromDate')}</label>
                <DateField value={customFrom} max={todayIsoDate()} onChange={setCustomFrom} />
              </div>
              <div className="field">
                <label>{t('report.toDate')}</label>
                <DateField value={customTo} max={todayIsoDate()} onChange={setCustomTo} />
              </div>
            </div>
          )}

          <div className="report-filter-section-label">{t('report.stockKindFilterLabel')}</div>
          <div className="filter-row">
            {KIND_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={kindFilter === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setKindFilter(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>

          <div className="report-filter-section-label">{t('report.stockSourceFilterLabel')}</div>
          <div className="filter-row">
            {SOURCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={sourceFilter === opt.value ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setSourceFilter(opt.value)}
              >
                <span>{t(opt.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
        <p className="empty-state">{t('report.emptyStock')}</p>
      ) : summary.products.length === 0 ? (
        <p className="empty-state">{t('report.noResultsStock')}</p>
      ) : (
        <>
          <div className="stock-summary-grid">
            <div className="stock-summary-card">
              <span className="stock-summary-label">{t('report.stockProducts')}</span>
              <span className="stock-summary-value">{summary.products.length}</span>
            </div>
            <div className="stock-summary-card">
              <span className="stock-summary-label">{t('report.stockMovements')}</span>
              <span className="stock-summary-value">{summary.movements}</span>
            </div>
            <div className="stock-summary-card">
              <span className="stock-summary-label">{t('report.stockInMovements')}</span>
              <span className="stock-summary-value green">{summary.inflowMovements}</span>
            </div>
            <div className="stock-summary-card">
              <span className="stock-summary-label">{t('report.stockOutMovements')}</span>
              <span className="stock-summary-value red">{summary.outflowMovements}</span>
            </div>
            {hasDates && (
              <div className="stock-summary-card">
                <span className="stock-summary-label">{t('productionBalance.period')}</span>
                <span className="stock-summary-value small">
                  {formatLocalizedIsoDate(summary.earliest, language, { year: false })} –{' '}
                  {formatLocalizedIsoDate(summary.latest, language)}
                </span>
              </div>
            )}
          </div>

          <div className="stock-rows">
            <div className="stock-row stock-row-head">
              <span>{t('report.stockProduct')}</span>
              <span className="num">{t('report.stockIn')}</span>
              <span className="num">{t('report.stockOut')}</span>
              <span className="num">{t('report.stockNet')}</span>
              <span className="num">{t('report.stockMovements')}</span>
            </div>

            {summary.products.map((row) => {
              const isOpen = expanded.has(row.key);
              const movements = summary.movementsByKey.get(row.key) ?? [];

              return (
                <div key={row.key} className="stock-group">
                  <button
                    type="button"
                    className={isOpen ? 'stock-row stock-row-button open' : 'stock-row stock-row-button'}
                    onClick={() => toggleExpanded(row.key)}
                    aria-expanded={isOpen}
                  >
                    <span className="stock-cell product">
                      <span className={isOpen ? 'stock-chevron open' : 'stock-chevron'}>
                        <ChevronDownIcon width={16} height={16} />
                      </span>
                      <img src={row.icon} alt="" />
                      <span className="stock-product-name">{row.label}</span>
                      <span className={row.isTree ? 'stock-kind-tag tree' : 'stock-kind-tag'}>
                        {row.isTree ? t('farm.fruits') : t('farm.plantStock')}
                      </span>
                    </span>
                    <span className="stock-cell num inflow">
                      {row.inflow > 0 ? `+${round2(row.inflow)}` : '—'} <span className="stock-unit">{row.unitLabel}</span>
                    </span>
                    <span className="stock-cell num outflow">
                      {row.outflow > 0 ? `−${round2(row.outflow)}` : '—'} <span className="stock-unit">{row.unitLabel}</span>
                    </span>
                    <span className={row.net < 0 ? 'stock-cell num net negative' : 'stock-cell num net'}>
                      {row.net > 0 ? '+' : ''}
                      {round2(row.net)} <span className="stock-unit">{row.unitLabel}</span>
                    </span>
                    <span className="stock-cell num muted">{row.movements}</span>
                  </button>

                  {isOpen && (
                    <div className="stock-movements">
                      {/* Labels the columns below, so the harvest a movement came from reads as
                          a column of its own rather than a loose piece of text. */}
                      <div className="stock-movement stock-movement-head">
                        <span>{t('report.colDate')}</span>
                        <span>{t('report.colSource')}</span>
                        <span>{t('report.colHarvest')}</span>
                        <span className="stock-movement-delta-head">{t('farm.amount')}</span>
                      </div>
                      {movements.map((movement) => (
                        <div key={`${row.key}-${movement.id}`} className="stock-movement">
                          <span className="stock-movement-date">
                            {formatLocalizedIsoDate(movement.createdAt, language)}
                          </span>
                          <span className="stock-movement-source">{t(SOURCE_LABEL_KEY[movement.source])}</span>
                          <span className="stock-movement-harvest" title={movement.harvestTitle ?? undefined}>
                            {movement.harvestTitle ?? '—'}
                          </span>
                          <span
                            className={movement.delta < 0 ? 'stock-movement-delta negative' : 'stock-movement-delta'}
                          >
                            {movement.delta > 0 ? '+' : ''}
                            {round2(movement.delta)} <span className="stock-unit">{row.unitLabel}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
