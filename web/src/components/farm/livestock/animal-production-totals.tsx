import { useEffect, useState } from 'react';

import './animal-production-totals.css';
import { PRODUCTION_TYPE_LABEL_KEY, UNIT_LABEL_KEY } from '@/config/production';
import { useLanguage } from '@/contexts/language-context';
import { getAnimalProductions } from '@/services/animal-production-service';
import { getProductionTypes } from '@/services/production-type-service';
import { getUnits } from '@/services/unit-service';
import type { AnimalProduction } from '@/types/animal-production';
import type { ProductionType } from '@/types/production-type';
import type { Unit } from '@/types/unit';

type Props = {
  animalId: number;
};

type TypeTotal = { productionTypeId: number; unitId: number; total: number };

/** A green-highlighted rollup of an animal's production records, summed per production type
 * (and unit, in the rare case one type was ever logged under more than one). Sits below the
 * Production column rather than inside it, as a standalone footer summary. */
export function AnimalProductionTotals({ animalId }: Props) {
  const { t } = useLanguage();

  const [records, setRecords] = useState<AnimalProduction[]>([]);
  const [productionTypes, setProductionTypes] = useState<ProductionType[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!animalId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animalId]);

  async function load() {
    setLoading(true);
    try {
      const [recordList, typeList, unitList] = await Promise.all([
        getAnimalProductions(animalId),
        getProductionTypes(),
        getUnits(),
      ]);
      setRecords(recordList);
      setProductionTypes(typeList);
      setUnits(unitList);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }

  if (loading || records.length === 0) {
    return null;
  }

  const typeById = new Map(productionTypes.map((pt) => [pt.id, pt]));
  const unitById = new Map(units.map((u) => [u.id, u]));

  function typeLabel(productionType?: ProductionType) {
    if (!productionType) return '';
    return t(PRODUCTION_TYPE_LABEL_KEY[productionType.name] ?? productionType.name);
  }

  const totalsByTypeAndUnit = new Map<string, TypeTotal>();
  for (const record of records) {
    const key = `${record.productionTypeId}:${record.unitId}`;
    const existing = totalsByTypeAndUnit.get(key);
    if (existing) {
      existing.total += record.quantity;
    } else {
      totalsByTypeAndUnit.set(key, { productionTypeId: record.productionTypeId, unitId: record.unitId, total: record.quantity });
    }
  }
  const typeTotals = [...totalsByTypeAndUnit.values()].sort((a, b) =>
    typeLabel(typeById.get(a.productionTypeId)).localeCompare(typeLabel(typeById.get(b.productionTypeId)))
  );

  if (typeTotals.length === 0) {
    return null;
  }

  return (
    <div className="production-totals">
      <div className="production-totals-title">{t('production.totalByType')}</div>
      {typeTotals.map((row) => {
        const unit = unitById.get(row.unitId);
        const unitLabel = unit ? t(UNIT_LABEL_KEY[unit.name] ?? unit.name) : '';
        return (
          <div key={`${row.productionTypeId}:${row.unitId}`} className="production-totals-row">
            <span className="production-totals-label">{typeLabel(typeById.get(row.productionTypeId))}</span>
            <span className="production-totals-value">
              {Math.round(row.total * 100) / 100} {unit?.shortName ?? ''}
              {unit ? ` (${unitLabel})` : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}
