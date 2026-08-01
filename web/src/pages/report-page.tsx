import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { BarChart, type BarDatum } from '@/components/charts/bar-chart';
import { GroupedBarChart, type BarGroup, type BarSeries } from '@/components/charts/grouped-bar-chart';
import '@/components/farm/farm-crud.css';
import '@/components/farm/search-filter.css';
import { FilterIcon } from '@/components/icons/misc-icons';
import { reportIcon, reportLabel, reportUnitLabel } from '@/config/report-labels';
import { DateField } from '@/components/ui/date-field';
import { formatLocalizedIsoDay, todayIsoDate } from '@/components/ui/date-utils';
import { CurrencyToggle } from '@/components/ui/currency-toggle';
import { MultiSelect } from '@/components/ui/multi-select';
import { useConfiguration } from '@/contexts/configuration-context';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { GREENHOUSE_CONFIG } from '@/types/configuration';
import { getReportDay, getReportOverview, getReportSeries } from '@/services/report-service';
import type {
  ReportDayDetails,
  ReportGood,
  ReportOverview,
  ReportPeriodQuery,
  ReportSeriesDetails,
} from '@/types/report';
import './report-page.css';

type Category = 'crop' | 'livestock' | 'fruit' | 'greenhouse';
type RevenueDatum = BarDatum & { day: string };

/** A selectable series (a stock / orchard / production type) for the grouped chart. */
type SeriesOption = { key: string; label: string; unit: string; icon?: string };

/** Trims to 2 decimals without trailing zeros (12.5, not 12.50). */
function round2(value: number): string {
  return String(Math.round(value * 100) / 100);
}

type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
type Quarter = 1 | 2 | 3 | 4;

const CATEGORY_OPTIONS: { value: Category; labelKey: string }[] = [
  { value: 'crop', labelKey: 'report.categoryCrop' },
  { value: 'livestock', labelKey: 'report.categoryLivestock' },
  { value: 'fruit', labelKey: 'report.categoryFruit' },
  { value: 'greenhouse', labelKey: 'report.categoryGreenhouse' },
];

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

/** Categorical series colours — validated for light & dark and CVD. */
const SERIES_COLORS = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

const FILTERS_KEY = 'farm.report.filters';

/** Shared empty selection, so "nothing picked yet" keeps a stable identity between renders. */
const NO_SERIES_KEYS: string[] = [];

/** The filter as the user last left it. */
type StoredFilters = {
  category: Category;
  filtersOpen: boolean;
  periodMode: PeriodMode;
  year: number;
  quarter: Quarter;
  customFrom: string | null;
  customTo: string | null;
  /** The picked series per category — their key spaces don't overlap, so each is kept apart. */
  seriesKeys: Record<string, string[]>;
};

function defaultFilters(): StoredFilters {
  const now = new Date();
  return {
    category: 'crop',
    filtersOpen: false,
    periodMode: 'all',
    year: now.getFullYear(),
    quarter: (Math.floor(now.getMonth() / 3) + 1) as Quarter,
    customFrom: null,
    customTo: null,
    seriesKeys: {},
  };
}

/** The stored value when it is still one of the choices on offer, the default otherwise. */
function oneOf<T>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

function isSeriesKeyMap(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((keys) => Array.isArray(keys) && keys.every((key) => typeof key === 'string'))
  );
}

/**
 * The filter left behind by the last visit, checked field by field so a stale or hand-edited entry
 * costs at most the one field it broke. Read synchronously during the first render, so the page
 * makes its one request with that filter already applied rather than fetching everything first.
 */
function readStoredFilters(): StoredFilters {
  const defaults = defaultFilters();
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    return {
      category: oneOf(saved.category, CATEGORY_OPTIONS.map((o) => o.value), defaults.category),
      filtersOpen: typeof saved.filtersOpen === 'boolean' ? saved.filtersOpen : defaults.filtersOpen,
      periodMode: oneOf(saved.periodMode, PERIOD_OPTIONS.map((o) => o.value), defaults.periodMode),
      year: typeof saved.year === 'number' && Number.isInteger(saved.year) ? saved.year : defaults.year,
      quarter: oneOf(saved.quarter, QUARTER_OPTIONS.map((o) => o.value), defaults.quarter),
      customFrom: typeof saved.customFrom === 'string' ? saved.customFrom : null,
      customTo: typeof saved.customTo === 'string' ? saved.customTo : null,
      seriesKeys: isSeriesKeyMap(saved.seriesKeys) ? saved.seriesKeys : defaults.seriesKeys,
    };
  } catch {
    // A half-written or hand-edited value shouldn't cost the user their report.
    return defaults;
  }
}

/** "2026-03-05" -> "05.03" for compact x-axis labels. */
function shortIsoDay(iso: string): string {
  const [, month, day] = iso.slice(0, 10).split('-');
  return `${day}.${month}`;
}

export function ReportPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();
  const { isOn, loaded: configLoaded, loadError: configLoadError } = useConfiguration();

  /** Read once, on mount — every filter below starts from it. */
  const [initialFilters] = useState(readStoredFilters);

  const [category, setCategory] = useState<Category>(initialFilters.category);

  // The two chart panels, totalled server-side for the current category and period.
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Each detail panel is its own request, fired when a bar is clicked.
  const [dayDetails, setDayDetails] = useState<ReportDayDetails | null>(null);
  const [dayLoading, setDayLoading] = useState(false);
  const [dayError, setDayError] = useState(false);

  const [seriesDetails, setSeriesDetails] = useState<ReportSeriesDetails | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesError, setSeriesError] = useState(false);

  /** Bumped by Retry to re-run the overview fetch when nothing about the filter has changed. */
  const [reloadToken, setReloadToken] = useState(0);

  const [filtersOpen, setFiltersOpen] = useState(initialFilters.filtersOpen);
  const [periodMode, setPeriodMode] = useState<PeriodMode>(initialFilters.periodMode);
  const [year, setYear] = useState(initialFilters.year);
  const [quarter, setQuarter] = useState<Quarter>(initialFilters.quarter);
  const [customFrom, setCustomFrom] = useState<string | null>(initialFilters.customFrom);
  const [customTo, setCustomTo] = useState<string | null>(initialFilters.customTo);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [seriesKeysByCategory, setSeriesKeysByCategory] = useState<Record<string, string[]>>(
    () => initialFilters.seriesKeys
  );
  const [selectedSeriesKey, setSelectedSeriesKey] = useState<string | null>(null);
  const seriesInitRef = useRef(false);
  const dayDetailsRef = useRef<HTMLElement>(null);
  const seriesDetailsRef = useRef<HTMLElement>(null);

  /** The filter as the server takes it. Rebuilt only when a field actually changes, so it can be
   * a dependency of the fetches below without re-firing them every render. */
  const period = useMemo<ReportPeriodQuery>(
    () => ({ mode: periodMode, year, quarter, from: customFrom, to: customTo }),
    [periodMode, year, quarter, customFrom, customTo]
  );

  /** The series picked for the category on screen; the others stay remembered in the map. */
  const selectedSeriesKeys = seriesKeysByCategory[category] ?? NO_SERIES_KEYS;

  function setSelectedSeriesKeys(keys: string[]) {
    setSeriesKeysByCategory((prev) => ({ ...prev, [category]: keys }));
  }

  // Write the filter back on every change, so a refresh — or the next visit — opens the report on
  // the same view rather than back at every category, all time.
  useEffect(() => {
    const filters: StoredFilters = {
      category,
      filtersOpen,
      periodMode,
      year,
      quarter,
      customFrom,
      customTo,
      seriesKeys: seriesKeysByCategory,
    };
    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
  }, [category, filtersOpen, periodMode, year, quarter, customFrom, customTo, seriesKeysByCategory]);

  // A tenant can switch greenhouse off between visits, and the restored category would then have
  // no chip of its own to leave by. Wait for the settings — while they're still loading every name
  // reads as off — and don't act on a failed request, which reads the same way.
  useEffect(() => {
    if (!configLoaded || configLoadError) return;
    if (category === 'greenhouse' && !isOn(GREENHOUSE_CONFIG)) setCategory('crop');
  }, [category, configLoaded, configLoadError, isOn]);

  // Cells 1 and 2. The server does the aggregation, so a period change is a request rather than a
  // re-sum of every record held in memory.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getReportOverview(category, period)
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setOverview(null);
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, period, reloadToken]);

  // Switching category drops the open drill-downs (their key spaces don't overlap) and hands the
  // series picker back to the effect below, which settles it against the incoming options.
  useEffect(() => {
    seriesInitRef.current = false;
    setSelectedSeriesKey(null);
    setSelectedDay(null);
  }, [category]);

  // Cell 3 — fired by clicking a bar in the value chart.
  useEffect(() => {
    if (selectedDay == null) {
      setDayDetails(null);
      setDayError(false);
      return;
    }

    let cancelled = false;
    setDayLoading(true);
    setDayError(false);
    getReportDay(category, selectedDay)
      .then((data) => {
        if (!cancelled) setDayDetails(data);
      })
      .catch(() => {
        if (!cancelled) {
          setDayDetails(null);
          setDayError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setDayLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, selectedDay]);

  // Cell 4 — fired by clicking a bar in the grouped chart. Re-runs on a period change too, since
  // the records behind a series are the ones inside the window.
  useEffect(() => {
    if (selectedSeriesKey == null) {
      setSeriesDetails(null);
      setSeriesError(false);
      return;
    }

    let cancelled = false;
    setSeriesLoading(true);
    setSeriesError(false);
    getReportSeries(category, period, selectedSeriesKey)
      .then((data) => {
        if (!cancelled) setSeriesDetails(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSeriesDetails(null);
          setSeriesError(true);
        }
      })
      .finally(() => {
        if (!cancelled) setSeriesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, period, selectedSeriesKey]);

  // --- goods renderer (crop/fruit harvest detail cards) ---

  function renderGoods(goods: ReportGood[]): ReactNode {
    if (goods.length === 0) return '—';
    return goods.map((g, i) => (
      <span key={i} className="report-good">
        <img src={reportIcon(g)} alt="" className="report-good-icon" />
        {reportLabel(g, t)} {round2(g.amount)} {reportUnitLabel(g.kind, g.unit, t)}
      </span>
    ));
  }

  // --- Cell 1: value over time, as returned ---
  const valueByDate = useMemo<RevenueDatum[]>(
    () =>
      (overview?.value ?? []).map((point) => ({
        day: point.day,
        label: shortIsoDay(point.day),
        value: point.value,
        tooltipLabel: formatLocalizedIsoDay(point.day, language),
      })),
    [overview, language]
  );

  // --- Cell 2: the series list, labelled and iconised here ---
  const seriesOptions = useMemo<SeriesOption[]>(
    () =>
      (overview?.series ?? []).map((series) => ({
        key: series.key,
        label: reportLabel(series, t),
        unit: reportUnitLabel(series.kind, series.unit, t),
        icon: reportIcon(series),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overview, t]
  );

  const colorForSeries = (key: string): string => {
    const idx = seriesOptions.findIndex((o) => o.key === key);
    return SERIES_COLORS[(idx < 0 ? 0 : idx) % SERIES_COLORS.length];
  };

  // Settle the picker once the options for this category load: keep the series remembered from
  // before as far as they still exist, and otherwise fall back to the first one so the chart isn't
  // empty on arrival. `category` is deliberately not a dependency — the options only change when a
  // fetch lands, by which point it is already the category those options belong to.
  useEffect(() => {
    if (seriesInitRef.current || seriesOptions.length === 0) return;
    seriesInitRef.current = true;
    setSeriesKeysByCategory((prev) => {
      const kept = (prev[category] ?? []).filter((key) => seriesOptions.some((o) => o.key === key));
      return { ...prev, [category]: kept.length > 0 ? kept : [seriesOptions[0].key] };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seriesOptions]);

  const chartSeries: BarSeries[] = seriesOptions
    .filter((o) => selectedSeriesKeys.includes(o.key))
    .map((o) => ({ key: o.key, label: o.label, color: colorForSeries(o.key), unit: o.unit }));

  /** The returned groups, narrowed to the picked series — a group none of them touched would draw
   * an empty column. Labels are a harvest title, or the day when the group is one. */
  const chartGroups = useMemo<BarGroup[]>(() => {
    if (selectedSeriesKeys.length === 0) return [];
    return (overview?.groups ?? [])
      .filter((group) => selectedSeriesKeys.some((key) => (group.values[key] ?? 0) > 0))
      .map((group) => {
        const label = group.label.trim() || shortIsoDay(group.day);
        const dayLabel = formatLocalizedIsoDay(group.day, language);
        return {
          label,
          tooltipLabel: group.label.trim() ? `${label} · ${dayLabel}` : dayLabel,
          values: group.values,
        };
      });
  }, [overview, selectedSeriesKeys, language]);

  // --- Cell 3: details for the day picked in the value chart ---
  const selectedIndex = useMemo(() => {
    if (selectedDay == null) return null;
    const idx = valueByDate.findIndex((d) => d.day === selectedDay);
    return idx >= 0 ? idx : null;
  }, [selectedDay, valueByDate]);

  const selectedHarvests = dayDetails?.harvests ?? [];
  const selectedProductions = dayDetails?.productions ?? [];
  const dayDetailsCount = category === 'livestock' ? selectedProductions.length : selectedHarvests.length;

  useEffect(() => {
    if (selectedIndex != null) dayDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedIndex, selectedDay]);

  function toggleSelectedDay(index: number) {
    const day = valueByDate[index]?.day ?? null;
    setSelectedDay((prev) => (prev === day ? null : day));
  }

  // --- Cell 4: per-record breakdown for the series bar clicked in cell 2 ---
  const selectedSeriesOption =
    selectedSeriesKey != null && selectedSeriesKeys.includes(selectedSeriesKey)
      ? seriesOptions.find((o) => o.key === selectedSeriesKey) ?? null
      : null;

  const seriesRecords = seriesDetails?.records ?? [];
  const seriesTotal = seriesDetails?.total ?? 0;

  useEffect(() => {
    if (selectedSeriesOption) seriesDetailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedSeriesOption]);

  function handleSeriesBarClick(key: string) {
    setSelectedSeriesKey((prev) => (prev === key ? null : key));
  }

  // --- category-specific labels ---
  const valueTitle = category === 'livestock' ? t('report.productionValueTitle') : t('report.harvestRevenueTitle');
  const valueSubtitle = category === 'livestock' ? t('report.productionValueSubtitle') : t('report.harvestRevenueSubtitle');
  const valueEmpty = category === 'livestock' ? t('report.noProductionData') : t('report.noRevenueData');
  const seriesTitle =
    category === 'fruit'
      ? t('report.harvestedByOrchardTitle')
      : category === 'livestock'
        ? t('report.productionByTypeTitle')
        : t('report.harvestedByStockTitle'); // crop and greenhouse both yield into stock
  const seriesSubtitle = category === 'livestock' ? t('report.amountPerDaySubtitle') : t('report.harvestedByStockSubtitle');

  return (
    <div className="report-page">
      <div className="page-header">
        <h1 className="page-title">{t('report.title')}</h1>
        <div className="report-header-actions">
          <CurrencyToggle />
          <button
            type="button"
            className={filtersOpen ? 'filter-toggle active' : 'filter-toggle'}
            onClick={() => setFiltersOpen((prev) => !prev)}
            aria-label={t('report.filtersLabel')}
          >
            <FilterIcon width={18} height={18} />
          </button>
        </div>
      </div>

      <div className="report-category-row filter-row">
        {/* Greenhouse only shows up once that configuration is switched on for this tenant. */}
        {CATEGORY_OPTIONS.filter((opt) => opt.value !== 'greenhouse' || isOn(GREENHOUSE_CONFIG)).map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={category === opt.value ? 'kind-chip active' : 'kind-chip'}
            onClick={() => setCategory(opt.value)}
          >
            <span>{t(opt.labelKey)}</span>
          </button>
        ))}
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
              <button type="button" className="report-year-nav-button" onClick={() => setYear((y) => y - 1)} aria-label="Previous year">
                ‹
              </button>
              <span className="report-year-text">{year}</span>
              <button type="button" className="report-year-nav-button" onClick={() => setYear((y) => y + 1)} aria-label="Next year">
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
        </div>
      )}

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('report.loadError')}</span>
          <button type="button" className="retry-button" onClick={() => setReloadToken((n) => n + 1)}>
            {t('common.retry')}
          </button>
        </div>
      ) : (
        <div className="report-grid">
          {/* Cell 1 — value over time; click a bar for that day's records (cell 3). */}
          <section className="report-panel">
            <h2 className="report-panel-title">{valueTitle}</h2>
            <p className="report-panel-subtitle">{valueSubtitle}</p>
            <div className="report-panel-body">
              {valueByDate.length === 0 ? (
                <div className="report-panel-empty-msg">{valueEmpty}</div>
              ) : (
                <BarChart
                  data={valueByDate}
                  formatValue={formatPrice}
                  ariaLabel={valueTitle}
                  onBarClick={toggleSelectedDay}
                  selectedIndex={selectedIndex}
                />
              )}
            </div>
          </section>

          {/* Cell 2 — amount per record for the picked series; click a bar for that series (cell 4). */}
          <section className="report-panel">
            <div className="report-panel-head-row">
              <div className="report-panel-heading">
                <h2 className="report-panel-title">{seriesTitle}</h2>
                <p className="report-panel-subtitle">{seriesSubtitle}</p>
              </div>
              {seriesOptions.length > 0 && (
                <MultiSelect
                  options={seriesOptions.map((o) => ({ value: o.key, label: o.label, icon: o.icon }))}
                  selected={selectedSeriesKeys}
                  onChange={setSelectedSeriesKeys}
                  placeholder={t('report.stockSelectPlaceholder')}
                  searchPlaceholder={t('report.stockSearchPlaceholder')}
                  emptyText={t('report.noStockMatch')}
                />
              )}
            </div>
            <div className="report-panel-body">
              {chartSeries.length === 0 ? (
                <div className="report-panel-empty-msg">{t('report.pickStockHint')}</div>
              ) : chartGroups.length === 0 ? (
                <div className="report-panel-empty-msg">{t('report.noStockData')}</div>
              ) : (
                <GroupedBarChart
                  groups={chartGroups}
                  series={chartSeries}
                  formatValue={(v) => round2(v)}
                  ariaLabel={seriesTitle}
                  onBarClick={handleSeriesBarClick}
                  selectedSeriesKey={selectedSeriesOption?.key ?? null}
                />
              )}
            </div>
          </section>

          {/* Cell 3 — records for the day picked in cell 1. */}
          <section className="report-panel" ref={dayDetailsRef}>
            {selectedIndex != null && selectedDay != null ? (
              <>
                <div className="report-panel-head-row">
                  <div className="report-panel-heading">
                    <h2 className="report-panel-title">
                      {category === 'livestock'
                        ? t('report.productionsOnDate', { date: formatLocalizedIsoDay(selectedDay, language) })
                        : t('report.harvestsOnDate', { date: formatLocalizedIsoDay(selectedDay, language) })}
                    </h2>
                    <p className="report-panel-subtitle">{t('report.recordsCountBadge', { count: dayDetailsCount })}</p>
                  </div>
                  <button type="button" className="report-details-close" onClick={() => setSelectedDay(null)} aria-label={t('common.close')}>
                    ×
                  </button>
                </div>

                <div className="report-panel-body report-details-scroll">
                  {dayError && <p className="report-empty-hint">{t('report.breakdownLoadError')}</p>}
                  {dayLoading && <p className="report-empty-hint">…</p>}
                  <div className="report-details-list">
                    {category === 'livestock'
                      ? selectedProductions.map((p) => (
                          <div key={p.productionId} className="report-detail-card">
                            <span className="report-detail-title">
                              {reportLabel({ name: '', typeName: p.typeName, kind: 'productionType' }, t)}
                            </span>
                            <div className="report-detail-metrics">
                              <span className="report-detail-metric">
                                <em>{t('report.amountLabel')}</em>
                                {round2(p.quantity)} {p.unit}
                              </span>
                              <span className="report-detail-metric">
                                <em>{t('report.valueLabel')}</em>
                                {formatPrice(p.value)}
                              </span>
                            </div>
                          </div>
                        ))
                      : selectedHarvests.map((harvest) => {
                          // Revenue, expenses and net arrive complete — the chemicals are already
                          // in the expense figure, so there's no partial state to render around.
                          const detailHref =
                            category === 'greenhouse'
                              ? `/farm/greenhouse/harvest/${harvest.harvestId}`
                              : harvest.isFruit
                                ? `/farm/fruits/harvest/${harvest.harvestId}`
                                : `/harvest/detail/${harvest.harvestId}`;
                          return (
                            <Link key={harvest.harvestId} to={detailHref} className="report-detail-card">
                              <span className="report-detail-title">{harvest.title}</span>
                              <div className="report-detail-metrics">
                                <span className="report-detail-metric">
                                  <em>{t('report.colRevenue')}</em>
                                  {formatPrice(harvest.revenue)}
                                </span>
                                <span className="report-detail-metric">
                                  <em>{t('report.expensesLabel')}</em>
                                  {formatPrice(harvest.expenses)}
                                </span>
                                <span
                                  className={
                                    harvest.net >= 0 ? 'report-detail-metric net-pos' : 'report-detail-metric net-neg'
                                  }
                                >
                                  <em>{t('report.netLabel')}</em>
                                  {formatPrice(harvest.net)}
                                </span>
                              </div>
                              <div className="report-detail-specs">
                                <div className="report-detail-spec">
                                  <em>{t('report.plannedLabel')}</em>
                                  <span>{renderGoods(harvest.planned)}</span>
                                </div>
                                <div className="report-detail-spec">
                                  <em>{harvest.isFruit ? t('report.pickedLabel') : t('report.seededLabel')}</em>
                                  <span>{renderGoods(harvest.input)}</span>
                                </div>
                                <div className="report-detail-spec">
                                  <em>{t('report.harvestedLabel')}</em>
                                  <span>{renderGoods(harvest.harvested)}</span>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                  </div>
                </div>
              </>
            ) : (
              <div className="report-panel-empty-msg">{t('report.selectBarHint')}</div>
            )}
          </section>

          {/* Cell 4 — records for the series bar picked in cell 2. */}
          <section className="report-panel" ref={seriesDetailsRef}>
            {selectedSeriesOption && (seriesLoading || seriesError) ? (
              <div className="report-panel-empty-msg">{seriesError ? t('report.loadError') : '…'}</div>
            ) : selectedSeriesOption && seriesRecords.length > 0 ? (
              <>
                <div className="report-panel-head-row">
                  <div className="report-panel-heading">
                    <h2 className="report-panel-title">
                      <span className="report-series-swatch" style={{ background: colorForSeries(selectedSeriesOption.key) }} />
                      {selectedSeriesOption.label}
                    </h2>
                    <p className="report-panel-subtitle">
                      {t('report.seriesTotal', { amount: round2(seriesTotal), unit: selectedSeriesOption.unit })}
                    </p>
                  </div>
                  <button type="button" className="report-details-close" onClick={() => setSelectedSeriesKey(null)} aria-label={t('common.close')}>
                    ×
                  </button>
                </div>

                <div className="report-panel-body report-details-scroll">
                  <div className="report-details-list">
                    {seriesRecords.map((r, i) => (
                      <div key={i} className="report-detail-card">
                        <span className="report-detail-title">
                          {r.label.trim() || formatLocalizedIsoDay(r.day, language)}
                        </span>
                        <div className="report-detail-metrics">
                          <span className="report-detail-metric">
                            <em>{t('report.harvestedLabel')}</em>
                            {round2(r.amount)} {selectedSeriesOption.unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="report-panel-empty-msg">{t('report.selectStockBarHint')}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
