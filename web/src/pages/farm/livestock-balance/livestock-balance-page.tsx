import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import '@/components/farm/farm-crud.css';
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
import { BalanceSummaryCards } from './balance-summary-cards';
import { LivestockBalanceTable } from './livestock-balance-table';
import { ProductBalanceTable } from './product-balance-table';
import { buildProductionSummary } from './production-summary';
import './livestock-balance-page.css';

/**
 * What the farm's livestock has produced, read two ways: per product and per group. Both come
 * from one pass over the records — see production-summary.ts — so the two tables and the headline
 * figures can't disagree.
 */
export function LivestockBalancePage() {
  const { t } = useLanguage();

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

  const summary = useMemo(
    () => buildProductionSummary({ records, movements, livestock, productionTypes, units, groupByAnimal }, t),
    [records, movements, productionTypes, units, livestock, groupByAnimal, t]
  );

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
          <BalanceSummaryCards summary={summary} recordCount={records.length} />

          <ProductBalanceTable rows={summary.products} totalValue={summary.totalValue} recordCount={records.length} />

          {summary.groups.length > 0 && (
            <LivestockBalanceTable rows={summary.groups} totalValue={summary.totalValue} />
          )}
        </>
      )}
    </div>
  );
}
