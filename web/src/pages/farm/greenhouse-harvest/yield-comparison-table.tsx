import { useLanguage } from '@/contexts/language-context';
import type { YieldRow } from '@/config/harvest-analysis';
import type { GreenhouseStock } from '@/types/greenhouse-stock';
import { rawUnitFor, round2, targetFor, unitLabelFor } from './greenhouse-harvest-lookups';

type Props = {
  rows: YieldRow[];
  stocks: GreenhouseStock[];
};

/** What the harvest planned against what it actually produced, good by good. */
export function YieldComparisonTable({ rows, stocks }: Props) {
  const { t } = useLanguage();

  function variancePctLabel(row: YieldRow): string {
    if (row.varianceRatio == null) return '—';
    const pct = Math.round(row.varianceRatio * 100);
    return `${pct > 0 ? '+' : ''}${pct}%`;
  }

  return (
    <>
      <div className="field harvest-section-label">
        <label>{t('harvest.comparisonTitle')}</label>
      </div>
      <div className="harvest-comparison">
        <div className="harvest-comparison-row header">
          <span className="harvest-comparison-good">{t('harvest.comparisonGood')}</span>
          <span className="harvest-comparison-num">{t('harvest.comparisonPlanned')}</span>
          <span className="harvest-comparison-num">{t('harvest.comparisonActual')}</span>
          <span className="harvest-comparison-num">{t('harvest.comparisonVariance')}</span>
        </div>
        {rows.map((row) => {
          const target = row.stockId != null ? targetFor(stocks, row.stockId, t) : null;
          // Results are always recorded in the good's own unit, but a plan carries its own.
          // Subtracting across two different units would be nonsense, so a variance is only shown
          // when both sides are in the same one.
          const comparable = row.plannedUnit == null || row.plannedUnit === rawUnitFor(stocks, row.stockId ?? -1);
          const varianceClass = !comparable
            ? 'harvest-comparison-num'
            : row.variance > 0
              ? 'harvest-comparison-num variance-up'
              : row.variance < 0
                ? 'harvest-comparison-num variance-down'
                : 'harvest-comparison-num';

          return (
            <div key={row.key} className="harvest-comparison-row">
              <span className="harvest-comparison-good">
                {target && <img src={target.icon} alt="" />}
                <span>{target?.label ?? ''}</span>
                {row.unplanned && <span className="harvest-comparison-tag">{t('harvest.comparisonUnplanned')}</span>}
                {row.missing && <span className="harvest-comparison-tag missing">{t('harvest.comparisonMissing')}</span>}
              </span>
              <span className="harvest-comparison-num">
                {row.planned > 0
                  ? `${round2(row.planned)} ${unitLabelFor(row.plannedUnit, t) || (target?.unitLabel ?? '')}`
                  : '—'}
              </span>
              <span className="harvest-comparison-num">
                {row.actual > 0 ? `${round2(row.actual)} ${target?.unitLabel ?? ''}` : '—'}
              </span>
              <span className={varianceClass}>
                {row.planned === 0 && row.actual === 0
                  ? '—'
                  : !comparable
                    ? t('harvest.kpiMixedUnits')
                    : `${row.variance > 0 ? '+' : ''}${round2(row.variance)} (${variancePctLabel(row)})`}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
