import { useEffect, useState } from 'react';

import { BarChart, type BarDatum } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { ASSESSMENT_GRADE_COLOR, ASSESSMENT_GRADE_FILL } from '@/config/assessment-grades';
import { useLanguage } from '@/contexts/language-context';
import { getHarvestAssessments } from '@/services/harvest-assessment-service';
import { ASSESSMENT_GRADES, type HarvestAssessment } from '@/types/harvest-assessment';
import type { Harvest } from '@/types/harvest';
import { round2, yieldTargetFor } from './harvest-detail-lookups';
import { HarvestInfoPanels } from './harvest-info-panels';
import type { HarvestDetail } from './use-harvest-detail';
import './harvest-detail-panels.css';
import './harvest-overview.css';

type Props = {
  harvestId: number;
  harvest: Harvest;
  detail: HarvestDetail;
  onOpenGrading: () => void;
};

type GradeChart = {
  key: string;
  label: string;
  unitLabel: string;
  harvested: number;
  graded: number;
  wasted: number;
  data: BarDatum[];
};

export function OverviewSection({ harvestId, harvest, detail, onOpenGrading }: Props) {
  const { t } = useLanguage();
  const { catalogs, yieldRows } = detail;

  const [assessments, setAssessments] = useState<HarvestAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getHarvestAssessments({ harvestId })
      .then((rows) => {
        if (!cancelled) setAssessments(rows);
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
  }, [harvestId]);

  // Read off the shared yield rows rather than the result rows, so an orchard — whose produce is
  // recorded on the trees it picked — charts the same way a crop does.
  const charts: GradeChart[] = [];
  for (const row of yieldRows) {
    if (row.actual <= 0) continue;

    const lines = assessments.filter(
      (line) => line.stockId === row.stockId && line.treeStockId === row.treeStockId
    );
    const graded = lines.reduce((sum, line) => sum + line.quantity, 0);
    const wasted = lines.reduce((sum, line) => sum + line.wasted, 0);
    if (graded <= 0 && wasted <= 0) continue;

    const harvested = row.actual;

    const target = yieldTargetFor(catalogs, harvest.kind, row.stockId, row.treeStockId, t);
    charts.push({
      key: row.key,
      label: target?.label ?? '',
      unitLabel: target?.unitLabel ?? '',
      harvested,
      graded,
      wasted,
      data: ASSESSMENT_GRADES.map((grade) => ({
        label: grade,
        value: lines.filter((line) => line.grade === grade).reduce((sum, line) => sum + line.quantity, 0),
        color: ASSESSMENT_GRADE_FILL[grade],
        borderColor: ASSESSMENT_GRADE_COLOR[grade],
      })),
    });
  }

  const chartsBlock = loading ? (
    (
      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.gradeDistribution')}</h2>
        <p className="hd-note">…</p>
      </section>
    )
  ) : error ? (
    (
      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.gradeDistribution')}</h2>
        <p className="hd-empty">{t('harvestGrading.loadError')}</p>
      </section>
    )
  ) : charts.length === 0 ? (
    (
      <section className="hd-panel">
        <h2 className="hd-panel-title">{t('harvest.gradeDistribution')}</h2>
        <p className="hd-empty">{t('harvest.overviewEmpty')}</p>
        <button type="button" className="hd-button primary" onClick={onOpenGrading}>
          {t('harvestGrading.action')}
        </button>
      </section>
    )
  ) : (
    <>
      {charts.map((chart) => (
        <div key={chart.key} className="hv-charts">
          <section className="hd-panel">
            <h2 className="hd-panel-title">{t('harvest.yieldSummary')}</h2>
            <DonutChart
              slices={[
                { label: t('harvest.usable'), value: chart.graded, color: 'var(--color-green)' },
                { label: t('harvest.wasted'), value: chart.wasted, color: 'var(--color-danger)' },
              ]}
              total={chart.harvested}
              centerValue={`${round2(chart.harvested)} ${chart.unitLabel}`}
              centerLabel={t('harvest.kpiTotalYield')}
              formatValue={(value) => `${round2(value)} ${chart.unitLabel}`}
              ariaLabel={`${t('harvest.yieldSummary')} — ${chart.label}`}
            />
          </section>

          <section className="hd-panel">
            <h2 className="hd-panel-title">{t('harvest.gradeDistribution')}</h2>
            <p className="hv-chart-total">
              {chart.label} · {t('harvestGrading.graded', { amount: round2(chart.graded), unit: chart.unitLabel })}
            </p>
            <div className="hv-chart-body">
              <BarChart
                data={chart.data}
                formatValue={(value) => `${round2(value)} ${chart.unitLabel}`}
                ariaLabel={`${t('harvest.gradeDistribution')} — ${chart.label}`}
              />
            </div>
          </section>
        </div>
      ))}
    </>
  );

  return (
    <>
      {chartsBlock}
      <HarvestInfoPanels harvest={harvest} detail={detail} />
    </>
  );
}
