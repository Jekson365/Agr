import { useEffect, useState } from 'react';

import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { HarvestFilterDropdown } from '@/components/farm/stock/harvest-filter-dropdown';
import { gradeDistributionBars } from '@/config/assessment-grades';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { getHarvestResults } from '@/services/harvest-result-service';
import { getHarvests } from '@/services/harvest-service';
import type { Harvest } from '@/types/harvest';
import type { HarvestAssessment } from '@/types/harvest-assessment';
import type { HarvestResult } from '@/types/harvest-result';
import './stock-grade-charts.css';

type Props = {
  stockId: number;
  unitLabel: string;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function StockGradeCharts({ stockId, unitLabel }: Props) {
  const { t } = useLanguage();

  const [lines, setLines] = useState<HarvestAssessment[]>([]);
  const [results, setResults] = useState<HarvestResult[]>([]);
  const [harvests, setHarvests] = useState<Harvest[]>([]);
  const [harvestIds, setHarvestIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!stockId) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    setHarvestIds([]);

    Promise.all([getHarvestAssessments({ stockId }), getHarvestResults(), getHarvests()])
      .then(([assessments, resultList, harvestList]) => {
        if (cancelled) return;
        setLines(assessments);
        setResults(resultList.filter((row) => row.stockId === stockId));
        setHarvests(harvestList);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [stockId]);

  const contributing = harvests
    .filter((harvest) => results.some((row) => row.harvestId === harvest.id))
    .sort((a, b) => b.date.localeCompare(a.date));

  const chosen = new Set(harvestIds);
  const inScope = (id: number) => harvestIds.length === 0 || chosen.has(id);
  const scopedLines = lines.filter((line) => inScope(line.harvestId));
  const harvested = results.filter((row) => inScope(row.harvestId)).reduce((sum, row) => sum + row.amount, 0);

  const bars = gradeDistributionBars(scopedLines, t('harvest.usable'), t('harvest.wasted'));

  const graded = scopedLines.reduce((sum, line) => sum + line.quantity, 0);
  const wasted = scopedLines.reduce((sum, line) => sum + line.wasted, 0);

  if (loading) return <p className="sgc-empty">…</p>;
  if (error) return <p className="sgc-empty">{t('harvestGrading.loadError')}</p>;
  if (lines.length === 0) return <p className="sgc-empty">{t('stockHistory.gradesEmpty')}</p>;

  const format = (value: number) => `${round2(value)} ${unitLabel}`;

  return (
    <>
      {contributing.length > 1 && (
        <HarvestFilterDropdown harvests={contributing} selected={harvestIds} onChange={setHarvestIds} />
      )}

      <div className="sgc-grid">
        <section className="sgc-card">
          <h2 className="sgc-title">{t('harvest.yieldSummary')}</h2>
          <p className="sgc-total">{t('harvestGrading.harvested', { amount: round2(harvested), unit: unitLabel })}</p>
          <DonutChart
            slices={[
              { label: t('harvest.usable'), value: graded, color: 'var(--color-green)' },
              { label: t('harvest.wasted'), value: wasted, color: 'var(--color-danger)' },
            ]}
            total={harvested}
            centerValue={format(harvested)}
            centerLabel={t('harvest.kpiTotalYield')}
            formatValue={format}
            ariaLabel={t('harvest.yieldSummary')}
          />
        </section>

        <section className="sgc-card">
          <h2 className="sgc-title">{t('harvest.gradeDistribution')}</h2>
          <p className="sgc-total">
            {t('harvestGrading.graded', { amount: round2(graded), unit: unitLabel })}
            <span className="bar-chart-key">
              <span className="bar-chart-key-swatch" />
              {t('harvest.wasted')}
            </span>
          </p>
          <div className="sgc-chart">
            <BarChart data={bars} groupSize={2} formatValue={format} ariaLabel={t('harvest.gradeDistribution')} />
          </div>
        </section>
      </div>
    </>
  );
}
