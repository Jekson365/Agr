import type { YieldRow } from '@/config/harvest-analysis';
import { useLanguage } from '@/contexts/language-context';
import { rawUnitFor, round2, targetFor, unitLabelFor, type Catalogs } from './harvest-detail-lookups';
import './harvest-detail-money.css';
import './harvest-detail-panels.css';

type Props = {
  rows: YieldRow[];
  catalogs: Catalogs;
};

/**
 * Planned against actual, one card per good rather than a four-column table. Each figure carries
 * its own heading, so a row still reads as "planned 100 kg, actual 120 kg" when it wraps onto two
 * lines — a table's meaning lives in a header row that scrolls away.
 */
export function HarvestComparison({ rows, catalogs }: Props) {
  const { t } = useLanguage();

  if (!rows.some((row) => row.actual > 0)) return null;

  return (
    <section className="hd-panel">
      <h2 className="hd-panel-title">{t('harvest.comparisonTitle')}</h2>
      <div className="hd-rows">
        {rows.map((row) => {
          const target = targetFor(catalogs, row.stockId, row.treeStockId, t);
          // Results are always recorded in the good's own unit, but a plan carries its own.
          // Subtracting across two different units would be nonsense, so a variance is only
          // shown when both sides are in the same one.
          const comparable = row.plannedUnit == null || row.plannedUnit === rawUnitFor(catalogs, row.stockId, row.treeStockId);
          const tone = !comparable || row.variance === 0 ? '' : row.variance > 0 ? ' up' : ' down';
          const pct = row.varianceRatio == null ? '' : ` (${row.varianceRatio > 0 ? '+' : ''}${Math.round(row.varianceRatio * 100)}%)`;

          return (
            <div key={row.key} className="hd-compare-row">
              <span className="hd-compare-good">
                {target && <img src={target.icon} alt="" />}
                <span>{target?.label ?? ''}</span>
                {row.unplanned && <span className="hd-tag">{t('harvest.comparisonUnplanned')}</span>}
                {row.missing && <span className="hd-tag">{t('harvest.comparisonMissing')}</span>}
              </span>

              <span className="hd-compare-cell">
                <strong>{t('harvest.comparisonPlanned')}</strong>
                {row.planned > 0 ? `${round2(row.planned)} ${unitLabelFor(row.plannedUnit, t) || (target?.unitLabel ?? '')}` : '—'}
              </span>

              <span className="hd-compare-cell">
                <strong>{t('harvest.comparisonActual')}</strong>
                {row.actual > 0 ? `${round2(row.actual)} ${target?.unitLabel ?? ''}` : '—'}
              </span>

              <span className={`hd-compare-cell${tone}`}>
                <strong>{t('harvest.comparisonVariance')}</strong>
                {row.planned === 0 && row.actual === 0
                  ? '—'
                  : !comparable
                    ? t('harvest.kpiMixedUnits')
                    : `${row.variance > 0 ? '+' : ''}${round2(row.variance)}${pct}`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
