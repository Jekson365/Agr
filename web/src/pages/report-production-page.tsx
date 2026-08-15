import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import '@/components/farm/kind-picker.css';
import '@/components/farm/search-filter.css';
import { FilterIcon, SearchIcon } from '@/components/icons/misc-icons';
import { HARVEST_STATUS_BADGE_CLASS } from '@/config/harvest-status';
import { livestockImage } from '@/config/livestock-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { useCurrency } from '@/contexts/currency-context';
import {
  formatLocalizedIsoDay,
  parseIsoDate,
  parseIsoDay,
  todayIsoDate,
} from '@/components/ui/date-utils';
import { DateField } from '@/components/ui/date-field';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getFarms } from '@/services/farm-service';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestock } from '@/services/livestock-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { Farm } from '@/types/farm';
import type { AnimalType, Livestock } from '@/types/livestock';
import type { LivestockDetail } from '@/types/livestock-detail';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import './report-page.css';

type PeriodMode = 'all' | 'year' | 'quarter' | 'custom';
type Quarter = 1 | 2 | 3 | 4;

type ProductionTotalRow = { key: string; label: string; unitLabel: string; amount: number };

/** One animal's aggregated production within a group section — a single row instead of one
 * row per record, mirroring how the group header sums up whole-group records. */
type AnimalSubgroup = {
  animalId: number;
  label: string;
  count: number;
  totals: ProductionTotalRow[];
  totalValue: number;
};

/** One livestock group's section of the report: its records plus per-type subtotals. */
type ProductionGroup = {
  key: string;
  name: string;
  farmName: string | null;
  animalType: AnimalType | null;
  records: AnimalProduction[];
  animals: AnimalSubgroup[];
  totals: ProductionTotalRow[];
  totalValue: number;
};

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

/** Sums of decimal quantities pick up floating-point noise; totals are shown to 2 places. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function ProductionTotalRowsList({ rows, tone }: { rows: ProductionTotalRow[]; tone?: 'sold' | 'balance' }) {
  return (
    <>
      {rows.map((row) => (
        <div key={row.key} className="report-yield-row">
          <span className="report-yield-label">{row.label}</span>
          <span className={tone ? `report-yield-amount report-yield-${tone}` : 'report-yield-amount'}>
            {tone === 'sold' && '−'}
            {round2(row.amount)} {row.unitLabel}
          </span>
        </div>
      ))}
    </>
  );
}

export function ReportProductionPage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [farms, setFarms] = useState<Farm[]>([]);
  const [productions, setProductions] = useState<AnimalProduction[]>([]);
  const [productionMovements, setProductionMovements] = useState<ProductionMovement[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [livestockDetails, setLivestockDetails] = useState<LivestockDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [productionSearch, setProductionSearch] = useState('');
  const [periodMode, setPeriodMode] = useState<PeriodMode>('all');
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [quarter, setQuarter] = useState<Quarter>(() => (Math.floor(new Date().getMonth() / 3) + 1) as Quarter);
  const [customFrom, setCustomFrom] = useState<string | null>(null);
  const [customTo, setCustomTo] = useState<string | null>(null);
  const [productionTypeFilter, setProductionTypeFilter] = useState<number | null>(null);
  const [livestockFilter, setLivestockFilter] = useState<number | null>(null);
  const [showAnimalRows, setShowAnimalRows] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [farmList, livestockList, productionList, movementList, productionTypeList, unitList] = await Promise.all([
        getFarms(),
        getLivestock(),
        getAllAnimalProductions(),
        getProductionMovements(),
        getProductionTypes(),
        getUnits(),
      ]);
      setFarms(farmList);
      setLivestock(livestockList);
      setProductions(productionList);
      setProductionMovements(movementList);
      setProductionTypes(productionTypeList);
      setUnits(unitList);

      // One group's animals failing shouldn't blank the whole report — the rest still resolve.
      const detailEntries = await Promise.allSettled(livestockList.map((l) => getLivestockDetails(l.id)));
      setLivestockDetails(detailEntries.flatMap((r) => (r.status === 'fulfilled' ? r.value : [])));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  /** `dayOnly` for fields that carry a plain date stored as UTC midnight (collection dates);
   * sale movements carry a real timestamp, which is compared in local time. */
  function isInRange(dateIso: string, dayOnly = true): boolean {
    const date = dayOnly ? parseIsoDay(dateIso) : parseIsoDate(dateIso);
    if (!date) return false;
    if (periodMode === 'year') return date.getFullYear() === year;
    if (periodMode === 'quarter') {
      return date.getFullYear() === year && Math.floor(date.getMonth() / 3) + 1 === quarter;
    }
    if (periodMode === 'custom') {
      const from = parseIsoDay(customFrom);
      const to = parseIsoDay(customTo);
      if (from && date < from) return false;
      // `to` is midnight of the end day, so a same-day record must still count as inside.
      if (to && date > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
      return true;
    }
    return true;
  }

  /**
   * Whether a record falls on or before the end of the selected period, ignoring its start.
   * A closing balance is a stock level, not a flow: it needs everything collected and sold up to
   * that point, including before the window. Filtering it to the window alone reports what moved
   * during it — which reads as a negative balance whenever stock collected earlier is sold later.
   */
  function isUpToPeriodEnd(dateIso: string, dayOnly = true): boolean {
    const date = dayOnly ? parseIsoDay(dateIso) : parseIsoDate(dateIso);
    if (!date) return false;
    if (periodMode === 'year') return date.getFullYear() <= year;
    if (periodMode === 'quarter') {
      const endOfQuarter = new Date(year, quarter * 3, 1);
      return date < endOfQuarter;
    }
    if (periodMode === 'custom') {
      const to = parseIsoDay(customTo);
      if (to && date > new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59)) return false;
      return true;
    }
    return true;
  }

  function farmNameFor(farmId: number | null): string | null {
    if (farmId == null) return null;
    return farms.find((f) => f.id === farmId)?.name ?? null;
  }

  function productionTypeLabel(productionTypeId: number): string {
    const type = productionTypes.find((pt) => pt.id === productionTypeId);
    if (!type) return '';
    return t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name);
  }

  function unitLabel(unit?: Unit): string {
    if (!unit) return '';
    return t(UNIT_LABEL_KEY[unit.name] ?? unit.name);
  }

  function targetInfoFor(record: AnimalProduction): {
    label: string;
    /** Label without the group name — for rows already sitting under their group's header. */
    shortLabel: string;
    animalType: AnimalType | null;
    farmName: string | null;
    livestockGroupId: number | null;
  } {
    if (record.animalId != null) {
      const detail = livestockDetails.find((d) => d.id === record.animalId);
      const group = detail ? livestock.find((l) => l.id === detail.livestockId) : undefined;
      return {
        label: detail ? `${detail.code}${group ? ` · ${group.name}` : ''}` : `#${record.animalId}`,
        shortLabel: detail?.code ?? `#${record.animalId}`,
        animalType: group?.type ?? null,
        farmName: group ? farmNameFor(group.farmId) : null,
        livestockGroupId: group?.id ?? null,
      };
    }
    if (record.livestockId != null) {
      const group = livestock.find((l) => l.id === record.livestockId);
      return {
        label: group?.name ?? `#${record.livestockId}`,
        shortLabel: group?.name ?? `#${record.livestockId}`,
        animalType: group?.type ?? null,
        farmName: group ? farmNameFor(group.farmId) : null,
        livestockGroupId: group?.id ?? record.livestockId,
      };
    }
    return { label: '', shortLabel: '', animalType: null, farmName: null, livestockGroupId: null };
  }

  function productionHref(record: AnimalProduction, livestockGroupId: number | null): string | null {
    if (record.animalId != null && livestockGroupId != null) {
      return `/farm/livestock/${livestockGroupId}/animal/${record.animalId}`;
    }
    if (record.livestockId != null) {
      return `/farm/livestock/${record.livestockId}/production`;
    }
    return null;
  }

  /** The type/search/group predicates shared by every production list on this page. Only the
   * period differs between the in-period flows and the cumulative balance. */
  function matchesProductionFilters(p: AnimalProduction): boolean {
    if (productionTypeFilter != null && p.productionTypeId !== productionTypeFilter) return false;
    if (livestockFilter != null && targetInfoFor(p).livestockGroupId !== livestockFilter) return false;
    const term = productionSearch.trim().toLowerCase();
    if (!term) return true;
    return (
      productionTypeLabel(p.productionTypeId).toLowerCase().includes(term) ||
      targetInfoFor(p).label.toLowerCase().includes(term)
    );
  }

  /** The same, for sales — which carry no target, so only the type can be matched. */
  function matchesMovementFilters(m: ProductionMovement): boolean {
    if (productionTypeFilter != null && m.productionTypeId !== productionTypeFilter) return false;
    const term = productionSearch.trim().toLowerCase();
    return !term || productionTypeLabel(m.productionTypeId).toLowerCase().includes(term);
  }

  const filteredProductions = useMemo(() => {
    return productions
      .filter((p) => isInRange(p.collectionDate))
      .filter(matchesProductionFilters)
      .sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productions,
    productionSearch,
    periodMode,
    year,
    quarter,
    customFrom,
    customTo,
    productionTypeFilter,
    livestockFilter,
    productionTypes,
    livestock,
    livestockDetails,
  ]);

  const productionTotals = useMemo(() => {
    const totals = new Map<string, ProductionTotalRow>();
    for (const record of filteredProductions) {
      const key = `${record.productionTypeId}-${record.unitId}`;
      const unit = units.find((u) => u.id === record.unitId);
      const existing = totals.get(key);
      if (existing) {
        existing.amount += record.quantity;
      } else {
        totals.set(key, {
          key,
          label: productionTypeLabel(record.productionTypeId),
          unitLabel: unit?.shortName ?? '',
          amount: record.quantity,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProductions, productionTypes, units]);

  const totalProductionValue = useMemo(
    () => filteredProductions.reduce((sum, p) => sum + (p.totalPrice ?? (p.pricePerUnit != null ? p.quantity * p.pricePerUnit : 0)), 0),
    [filteredProductions]
  );

  // Marketplace sales, under the same period/type filters as the collections above. A sale is
  // recorded against a product's balance rather than against a group, so it can't be attributed
  // while a single group is selected — the totals then cover collections only.
  const filteredMovements = useMemo(() => {
    if (livestockFilter != null) return [];
    return productionMovements.filter((m) => isInRange(m.createdAt, false)).filter(matchesMovementFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productionMovements,
    productionSearch,
    periodMode,
    year,
    quarter,
    customFrom,
    customTo,
    productionTypeFilter,
    livestockFilter,
    productionTypes,
  ]);

  /** How much of each product was sold — movement deltas are negative, shown as positive here.
   *  Sales only: a realization's entry adds meat rather than taking any away, and counting it
   *  here would report it as a negative sale. */
  const soldTotals = useMemo(() => {
    const totals = new Map<string, ProductionTotalRow>();
    for (const movement of filteredMovements.filter((m) => m.source === 'Market')) {
      const key = `${movement.productionTypeId}-${movement.unitId}`;
      const existing = totals.get(key);
      if (existing) {
        existing.amount -= movement.delta;
      } else {
        const unit = units.find((u) => u.id === movement.unitId);
        totals.set(key, {
          key,
          label: productionTypeLabel(movement.productionTypeId),
          unitLabel: unit?.shortName ?? '',
          amount: -movement.delta,
        });
      }
    }
    return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredMovements, productionTypes, units]);

  /**
   * What's actually left, per product and unit: everything collected minus everything sold *up to
   * the end of the selected period*. The yield and sold figures above are flows within the period;
   * this is a level, so it has to count history from before the window too — otherwise stock
   * collected in one year and sold in the next reports as a negative balance.
   *
   * Empty while a group is selected, and while nothing has been sold: a sale isn't attributable to
   * a group, and with no sales at all the balance is just the collected total again.
   */
  const balanceTotals = useMemo(() => {
    if (livestockFilter != null) return [];

    const byKey = new Map<string, ProductionTotalRow>();
    const rowFor = (productionTypeId: number, unitId: number): ProductionTotalRow => {
      const key = `${productionTypeId}-${unitId}`;
      let row = byKey.get(key);
      if (!row) {
        row = {
          key,
          label: productionTypeLabel(productionTypeId),
          unitLabel: units.find((u) => u.id === unitId)?.shortName ?? '',
          amount: 0,
        };
        byKey.set(key, row);
      }
      return row;
    };

    for (const record of productions) {
      if (!isUpToPeriodEnd(record.collectionDate) || !matchesProductionFilters(record)) continue;
      rowFor(record.productionTypeId, record.unitId).amount += record.quantity;
    }

    let sales = 0;
    for (const movement of productionMovements) {
      if (!isUpToPeriodEnd(movement.createdAt, false) || !matchesMovementFilters(movement)) continue;
      // Sale deltas are already negative, matching how /farm/balance sums them.
      rowFor(movement.productionTypeId, movement.unitId).amount += movement.delta;
      sales += 1;
    }

    if (sales === 0) return [];
    return Array.from(byKey.values()).sort((a, b) => b.amount - a.amount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productions,
    productionMovements,
    productionSearch,
    periodMode,
    year,
    quarter,
    customTo,
    productionTypeFilter,
    livestockFilter,
    productionTypes,
    livestock,
    livestockDetails,
    units,
  ]);

  // The records list is grouped by the livestock group they belong to (single-animal records
  // resolve to their animal's group); records that resolve to no group land in a trailing
  // "Other" bucket.
  const groupedProductions = useMemo(() => {
    const addTotal = (totals: ProductionTotalRow[], record: AnimalProduction) => {
      const totalsKey = `${record.productionTypeId}-${record.unitId}`;
      const existing = totals.find((row) => row.key === totalsKey);
      if (existing) {
        existing.amount += record.quantity;
      } else {
        const unit = units.find((u) => u.id === record.unitId);
        totals.push({
          key: totalsKey,
          label: productionTypeLabel(record.productionTypeId),
          unitLabel: unit?.shortName ?? '',
          amount: record.quantity,
        });
      }
    };

    const groups = new Map<string, ProductionGroup>();
    for (const record of filteredProductions) {
      const target = targetInfoFor(record);
      const key = target.livestockGroupId != null ? String(target.livestockGroupId) : 'other';
      let group = groups.get(key);
      if (!group) {
        const stockGroup = target.livestockGroupId != null ? livestock.find((l) => l.id === target.livestockGroupId) : undefined;
        group = {
          key,
          name: stockGroup?.name ?? t('report.otherLivestockGroup'),
          farmName: stockGroup ? farmNameFor(stockGroup.farmId) : null,
          animalType: stockGroup?.type ?? null,
          records: [],
          animals: [],
          totals: [],
          totalValue: 0,
        };
        groups.set(key, group);
      }

      const recordValue = record.totalPrice ?? (record.pricePerUnit != null ? record.quantity * record.pricePerUnit : 0);
      group.records.push(record);
      group.totalValue += recordValue;
      addTotal(group.totals, record);

      // Per-animal records also roll up into one row per animal, so the section shows a
      // single aggregated item per animal rather than one row per record.
      if (record.animalId != null) {
        let animal = group.animals.find((a) => a.animalId === record.animalId);
        if (!animal) {
          animal = { animalId: record.animalId, label: target.shortLabel, count: 0, totals: [], totalValue: 0 };
          group.animals.push(animal);
        }
        animal.count += 1;
        animal.totalValue += recordValue;
        addTotal(animal.totals, record);
      }
    }

    // Records come in newest-first, so insertion order already ranks groups by most recent
    // activity — just keep the unresolved bucket at the end.
    const list = Array.from(groups.values());
    const otherIndex = list.findIndex((g) => g.key === 'other');
    if (otherIndex >= 0) {
      list.push(...list.splice(otherIndex, 1));
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProductions, livestock, livestockDetails, farms, units, productionTypes]);

  return (
    <div>
      <Link to="/report" className="back-link">
        ← {t('report.title')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('report.productionPageTitle')}</h1>
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
          <input
            value={productionSearch}
            onChange={(e) => setProductionSearch(e.target.value)}
            placeholder={t('report.searchPlaceholderProduction')}
          />
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

          <div className="report-filter-section-label">{t('report.productTypeFilterLabel')}</div>
          <div className="filter-row">
            <button
              type="button"
              className={productionTypeFilter == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => setProductionTypeFilter(null)}
            >
              <span>{t('report.filterAll')}</span>
            </button>
            {productionTypes.map((pt) => (
              <button
                key={pt.id}
                type="button"
                className={productionTypeFilter === pt.id ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setProductionTypeFilter(pt.id)}
              >
                <span>{productionTypeLabel(pt.id)}</span>
              </button>
            ))}
          </div>

          <div className="report-filter-section-label">{t('report.livestockFilterLabel')}</div>
          <div className="filter-row">
            <button
              type="button"
              className={livestockFilter == null ? 'kind-chip active' : 'kind-chip'}
              onClick={() => setLivestockFilter(null)}
            >
              <span>{t('report.filterAll')}</span>
            </button>
            {livestock.map((l) => (
              <button
                key={l.id}
                type="button"
                className={livestockFilter === l.id ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setLivestockFilter(l.id)}
              >
                <span>{l.name}</span>
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
      ) : productions.length === 0 ? (
        <p className="empty-state">{t('report.emptyProduction')}</p>
      ) : filteredProductions.length === 0 && filteredMovements.length === 0 ? (
        <p className="empty-state">{t('report.noResultsProduction')}</p>
      ) : (
        <>
          <div className="report-total-card">
            <div className="report-card-header">
              <span className="report-card-title">Σ {t('report.totalLabel')}</span>
              <span className={`${HARVEST_STATUS_BADGE_CLASS.Harvested} report-count-badge`}>
                {t('report.recordsCountBadge', { count: filteredProductions.length })}
              </span>
            </div>
            {totalProductionValue > 0 && (
              <p className="report-card-value">
                {t('report.valueLabel')}: {formatPrice(totalProductionValue)}
              </p>
            )}
            <div className="report-section-label">{t('report.yieldLabel')}</div>
            {productionTotals.length === 0 ? (
              <p className="report-empty-hint">{t('report.noProductionData')}</p>
            ) : (
              <ProductionTotalRowsList rows={productionTotals} />
            )}

            {/* Sold and what's left, so the yield above stays readable as "collected". Sold is a
                flow inside the period; the balance is a running level, so each appears on its own
                terms — a period with no sales of its own can still have a balance worth showing. */}
            {soldTotals.length > 0 && (
              <>
                <div className="report-section-label">{t('report.soldLabel')}</div>
                <ProductionTotalRowsList rows={soldTotals} tone="sold" />
              </>
            )}

            {balanceTotals.length > 0 && (
              <>
                <div className="report-section-label">{t('report.balanceLabel')}</div>
                <ProductionTotalRowsList rows={balanceTotals} tone="balance" />
              </>
            )}
          </div>

          {groupedProductions.some((g) => g.animals.length > 0) && (
            <div className="production-singles-toggle">
              <button
                type="button"
                className={showAnimalRows ? 'kind-chip active' : 'kind-chip'}
                onClick={() => setShowAnimalRows((prev) => !prev)}
              >
                <span>{showAnimalRows ? t('production.hideIndividual') : t('production.showIndividual')}</span>
              </button>
            </div>
          )}

          {groupedProductions.map((group) => {
            const groupIcon = group.animalType ? livestockImage(group.animalType) : undefined;
            const headerContent = (
              <>
                <span className="report-group-icon">{groupIcon && <img src={groupIcon} alt="" />}</span>
                <div className="report-group-info">
                  <span className="report-group-name">{group.name}</span>
                  {group.farmName && <span className="report-group-meta">{group.farmName}</span>}
                </div>
                <span className={`${HARVEST_STATUS_BADGE_CLASS.Harvested} report-count-badge`}>
                  {t('report.recordsCountBadge', { count: group.records.length })}
                </span>
                <div className="report-group-totals">
                  <span>{group.totals.map((row) => `${row.label} ${round2(row.amount)} ${row.unitLabel}`).join(' · ')}</span>
                  {group.totalValue > 0 && <span className="report-group-value">{formatPrice(group.totalValue)}</span>}
                </div>
              </>
            );
            return (
              <div key={group.key} className="report-group">
                {group.key !== 'other' ? (
                  <Link to={`/farm/livestock/${group.key}/production`} className="report-group-header report-group-header-link">
                    {headerContent}
                  </Link>
                ) : (
                  <div className="report-group-header">{headerContent}</div>
                )}

                {/* Whole-group records are already summed up in the clickable header, and each
                    animal's records roll up into one aggregated row linking to its page — no
                    per-record rows, they'd just repeat what those show. The unresolved bucket
                    keeps raw rows since there's nothing to aggregate them under. */}
                {group.key !== 'other'
                  ? showAnimalRows &&
                    group.animals.map((animal) => (
                      <Link
                        key={animal.animalId}
                        to={`/farm/livestock/${group.key}/animal/${animal.animalId}`}
                        className="report-card report-card-inline single"
                      >
                        <span className="report-inline-icon">{groupIcon && <img src={groupIcon} alt="" />}</span>
                        <span className="report-inline-title">{animal.label}</span>
                        <span className={`${HARVEST_STATUS_BADGE_CLASS.Harvested} report-count-badge`}>
                          {t('report.recordsCountBadge', { count: animal.count })}
                        </span>
                        <span className="report-inline-qty">
                          {animal.totals.map((row) => `${row.label} ${round2(row.amount)} ${row.unitLabel}`).join(' · ')}
                        </span>
                        {animal.totalValue > 0 && <span className="report-inline-value">{formatPrice(animal.totalValue)}</span>}
                      </Link>
                    ))
                  : group.records.map((record) => {
                      const target = targetInfoFor(record);
                      const unit = units.find((u) => u.id === record.unitId);
                      const totalPrice = record.totalPrice ?? (record.pricePerUnit != null ? record.quantity * record.pricePerUnit : null);
                      const href = productionHref(record, target.livestockGroupId);
                      const icon = target.animalType ? livestockImage(target.animalType) : undefined;
                      const rowClass = `report-card report-card-inline${record.animalId != null ? ' single' : ''}`;
                      const cardContent = (
                        <>
                          {/* Kept as an element even without artwork so every row's text starts at
                              the same x, rather than shifting left when an animal has no icon. */}
                          <span className="report-inline-icon">{icon && <img src={icon} alt="" />}</span>
                          <span className="report-inline-title">{target.shortLabel}</span>
                          <span className="status-badge report-inline-badge">{productionTypeLabel(record.productionTypeId)}</span>
                          <span className="report-inline-meta">{formatLocalizedIsoDay(record.collectionDate, language)}</span>
                          <span className="report-inline-qty">
                            {record.quantity} {unit?.shortName ?? ''} ({unitLabel(unit)})
                          </span>
                          {totalPrice != null && <span className="report-inline-value">{formatPrice(totalPrice)}</span>}
                        </>
                      );
                      return href ? (
                        <Link key={record.id} to={href} className={rowClass}>
                          {cardContent}
                        </Link>
                      ) : (
                        <div key={record.id} className={rowClass}>
                          {cardContent}
                        </div>
                      );
                    })}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
