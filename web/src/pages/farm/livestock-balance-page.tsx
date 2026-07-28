import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
import { formatLocalizedIsoDate } from '@/components/ui/date-utils';
import { livestockImage } from '@/config/livestock-kinds';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { useCurrency } from '@/contexts/currency-context';
import { useLanguage } from '@/contexts/language-context';
import { getAllAnimalProductions } from '@/services/animal-production-service';
import { getLivestockDetails } from '@/services/livestock-detail-service';
import { getLivestock } from '@/services/livestock-service';
import { getProductionMovements } from '@/services/production-movement-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { Livestock } from '@/types/livestock';
import type { ProductionMovement } from '@/types/production-movement';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';
import './livestock-balance-page.css';

/** One line of the by-product balance: a production type measured in one unit. */
type ProductRow = {
  key: string;
  typeLabel: string;
  unitLabel: string;
  quantity: number;
  value: number;
  records: number;
};

/** One line of the by-livestock balance. */
type GroupRow = {
  id: number;
  name: string;
  type: Livestock['type'];
  value: number;
  records: number;
  /**
   * Total quantity keyed by unit label. A group can produce milk in litres and eggs in pieces,
   * and those don't add up — so the column carries a figure per unit rather than one bogus sum.
   */
  quantityByUnit: Map<string, number>;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function LivestockBalancePage() {
  const { t, language } = useLanguage();
  const { formatPrice } = useCurrency();

  const [livestock, setLivestock] = useState<Livestock[]>([]);
  const [records, setRecords] = useState<AnimalProduction[]>([]);
  const [movements, setMovements] = useState<ProductionMovement[]>([]);
  /** animalId -> the livestock group it belongs to, for attributing single-animal records. */
  const [groupByAnimal, setGroupByAnimal] = useState<Map<number, number>>(new Map());
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [livestockList, allRecords, movementList, typeList, unitList] = await Promise.all([
        getLivestock(),
        getAllAnimalProductions(),
        getProductionMovements(),
        getProductionTypes(),
        getUnits(),
      ]);

      // Production is logged either against a whole group or against one animal, so the
      // per-group breakdown needs to know which group each animal belongs to. One group's
      // animals failing shouldn't blank the page — the rest still resolve.
      const detailLists = await Promise.allSettled(livestockList.map((l) => getLivestockDetails(l.id)));
      const map = new Map<number, number>();
      livestockList.forEach((group, i) => {
        const result = detailLists[i];
        if (result.status !== 'fulfilled') return;
        for (const detail of result.value) map.set(detail.id, group.id);
      });

      setLivestock(livestockList);
      setRecords(allRecords);
      setMovements(movementList);
      setGroupByAnimal(map);
      setProductionTypes(typeList);
      setUnits(unitList);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
    const unitById = new Map(units.map((u) => [u.id, u]));
    const groupById = new Map(livestock.map((l) => [l.id, l]));

    const typeLabel = (id: number) => {
      const type = typeById.get(id);
      return type ? t(PRODUCTION_TYPE_LABEL_KEY[type.name] ?? type.name) : '';
    };
    const unitLabel = (id: number) => {
      const unit = unitById.get(id);
      return unit ? unit.shortName || t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '';
    };

    const products = new Map<string, ProductRow>();
    const groups = new Map<number, GroupRow>();
    let totalValue = 0;
    let earliest: string | null = null;
    let latest: string | null = null;

    for (const record of records) {
      // Fall back to quantity × unit price when a total wasn't entered directly.
      const value = record.totalPrice ?? (record.pricePerUnit != null ? record.quantity * record.pricePerUnit : 0);
      totalValue += value;

      // Quantities are only additive within one unit — a type logged in both litres and pieces
      // gets a line per unit rather than a meaningless combined total.
      const key = `${record.productionTypeId}:${record.unitId}`;
      let product = products.get(key);
      if (!product) {
        product = {
          key,
          typeLabel: typeLabel(record.productionTypeId),
          unitLabel: unitLabel(record.unitId),
          quantity: 0,
          value: 0,
          records: 0,
        };
        products.set(key, product);
      }
      product.quantity += record.quantity;
      product.value += value;
      product.records += 1;

      const groupId = record.livestockId ?? (record.animalId != null ? groupByAnimal.get(record.animalId) : undefined);
      const group = groupId != null ? groupById.get(groupId) : undefined;
      if (group) {
        let row = groups.get(group.id);
        if (!row) {
          row = { id: group.id, name: group.name, type: group.type, value: 0, records: 0, quantityByUnit: new Map() };
          groups.set(group.id, row);
        }
        row.value += value;
        row.records += 1;

        const unit = unitLabel(record.unitId);
        row.quantityByUnit.set(unit, (row.quantityByUnit.get(unit) ?? 0) + record.quantity);
      }

      const date = record.collectionDate;
      if (date) {
        if (earliest == null || date < earliest) earliest = date;
        if (latest == null || date > latest) latest = date;
      }
    }

    // Marketplace sales deduct from the product totals. They aren't attributed to a group, so
    // the per-group breakdown below stays a record of what each group collected.
    for (const movement of movements) {
      const key = `${movement.productionTypeId}:${movement.unitId}`;
      const product = products.get(key);
      if (product) {
        product.quantity += movement.delta;
      } else {
        products.set(key, {
          key,
          typeLabel: typeLabel(movement.productionTypeId),
          unitLabel: unitLabel(movement.unitId),
          quantity: movement.delta,
          value: 0,
          records: 0,
        });
      }
    }

    return {
      products: [...products.values()].sort((a, b) => b.value - a.value || b.quantity - a.quantity),
      groups: [...groups.values()].sort((a, b) => b.value - a.value),
      totalValue,
      earliest,
      latest,
    };
  }, [records, movements, productionTypes, units, livestock, groupByAnimal, t]);

  const hasDates = summary.earliest != null && summary.latest != null;

  return (
    <div>
      <Link to="/farm/livestock" className="back-link">
        ← {t('farm.livestock')}
      </Link>

      <div className="page-header">
        <h1 className="page-title">{t('productionBalance.title')}</h1>
      </div>

      {loading ? (
        <div className="state-box">…</div>
      ) : error ? (
        <div className="state-box">
          <span>{t('production.loadError')}</span>
          <button type="button" className="retry-button" onClick={load}>
            {t('common.retry')}
          </button>
        </div>
      ) : records.length === 0 ? (
        <p className="empty-state">{t('productionBalance.empty')}</p>
      ) : (
        <>
          <div className="balance-summary-grid">
            <div className="balance-summary-card">
              <span className="balance-summary-label">{t('productionBalance.totalValue')}</span>
              <span className="balance-summary-value green">{formatPrice(round2(summary.totalValue))}</span>
            </div>
            <div className="balance-summary-card">
              <span className="balance-summary-label">{t('productionBalance.recordCount')}</span>
              <span className="balance-summary-value">{records.length}</span>
            </div>
            <div className="balance-summary-card">
              <span className="balance-summary-label">{t('productionBalance.typeCount')}</span>
              <span className="balance-summary-value">{summary.products.length}</span>
            </div>
            {hasDates && (
              <div className="balance-summary-card">
                <span className="balance-summary-label">{t('productionBalance.period')}</span>
                <span className="balance-summary-value small">
                  {formatLocalizedIsoDate(summary.earliest, language, { year: false })} –{' '}
                  {formatLocalizedIsoDate(summary.latest, language)}
                </span>
              </div>
            )}
          </div>

          <div className="balance-section-title">{t('productionBalance.byProduct')}</div>
          <div className="balance-rows">
            <div className="balance-row balance-row-head">
              <span>{t('production.type')}</span>
              <span className="num">{t('productionBalance.quantity')}</span>
              <span className="num">{t('productionBalance.records')}</span>
              <span className="num">{t('productionBalance.value')}</span>
              <span className="num">{t('productionBalance.share')}</span>
            </div>

            {summary.products.map((row) => (
              <div key={row.key} className="balance-row">
                <span className="balance-cell strong">{row.typeLabel}</span>
                <span className="balance-cell num">
                  {round2(row.quantity)} <span className="balance-unit">{row.unitLabel}</span>
                </span>
                <span className="balance-cell num muted">{row.records}</span>
                <span className="balance-cell num value">{formatPrice(round2(row.value))}</span>
                <ShareCell value={row.value} total={summary.totalValue} />
              </div>
            ))}

            <div className="balance-row balance-row-total">
              <span className="balance-cell strong">{t('productionBalance.total')}</span>
              <span className="balance-cell num muted">—</span>
              <span className="balance-cell num">{records.length}</span>
              <span className="balance-cell num value">{formatPrice(round2(summary.totalValue))}</span>
              <span className="balance-cell num muted">{summary.totalValue > 0 ? '100%' : '—'}</span>
            </div>
          </div>

          {summary.groups.length > 0 && (
            <>
              <div className="balance-section-title">{t('productionBalance.byLivestock')}</div>
              <div className="balance-rows balance-rows-group">
                <div className="balance-row balance-row-group balance-row-head">
                  <span>{t('farm.livestock')}</span>
                  <span className="num">{t('productionBalance.quantity')}</span>
                  <span className="num">{t('productionBalance.records')}</span>
                  <span className="num">{t('productionBalance.value')}</span>
                  <span className="num">{t('productionBalance.share')}</span>
                </div>

                {summary.groups.map((row) => (
                  <Link key={row.id} to={`/farm/livestock/${row.id}/production`} className="balance-row balance-row-group">
                    <span className="balance-cell strong balance-group-name">
                      <img src={livestockImage(row.type)} alt="" />
                      {row.name}
                    </span>
                    <span className="balance-cell num balance-quantities">
                      {[...row.quantityByUnit.entries()].map(([unit, qty]) => (
                        <span key={unit} className="balance-quantity">
                          {round2(qty)} <span className="balance-unit">{unit}</span>
                        </span>
                      ))}
                    </span>
                    <span className="balance-cell num muted">{row.records}</span>
                    <span className="balance-cell num value">{formatPrice(round2(row.value))}</span>
                    <ShareCell value={row.value} total={summary.totalValue} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** Share of total value, as a bar sitting inline with its percentage. */
function ShareCell({ value, total }: { value: number; total: number }) {
  // With no prices recorded anywhere the total is 0 and every share would be a meaningless
  // empty 0% bar, so say "no data" instead of drawing one.
  if (total <= 0) return <span className="balance-cell num muted">—</span>;

  const share = (value / total) * 100;
  return (
    <span className="balance-cell num share">
      <span className="balance-share-bar">
        <span className="balance-share-fill" style={{ width: `${Math.min(100, share)}%` }} />
      </span>
      {Math.round(share)}%
    </span>
  );
}
