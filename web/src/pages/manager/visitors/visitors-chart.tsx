import { useMemo } from 'react';

import { BarChart } from '@/components/charts/bar-chart';
import { useLanguage } from '@/contexts/language-context';
import type { VisitSummary } from '@/types/visit';
import { bucketLabel, bucketTooltip } from './visit-labels';

const MAX_AXIS_LABELS = 12;

type Props = {
  summary: VisitSummary;
};

function formatAxis(value: number): string {
  return String(Math.round(value * 100) / 100);
}

function tickCountFor(highest: number): number {
  return highest <= 2 ? Math.max(1, highest) : 5;
}

export function VisitorsChart({ summary }: Props) {
  const { t, language } = useLanguage();

  const bars = useMemo(() => {
    const step = Math.max(1, Math.ceil(summary.buckets.length / MAX_AXIS_LABELS));
    return summary.buckets.map((bucket, index) => ({
      label: index % step === 0 ? bucketLabel(bucket.start, summary.unit) : '',
      tooltipLabel: `${bucketTooltip(bucket.start, summary.unit, language)} · ${t('visitors.viewsCount', { count: bucket.views })}`,
      value: bucket.visitors,
    }));
  }, [summary, language, t]);

  const highest = Math.max(0, ...summary.buckets.map((bucket) => bucket.visitors));
  const empty = highest === 0;

  return (
    <section className="visitors-panel">
      <h2 className="visitors-panel-title">{t('visitors.chartTitle')}</h2>
      <div className="visitors-chart-body">
        {empty ? (
          <div className="visitors-empty centered">{t('visitors.noData')}</div>
        ) : (
          <BarChart
            data={bars}
            formatValue={formatAxis}
            tickCount={tickCountFor(highest)}
            ariaLabel={t('visitors.chartTitle')}
          />
        )}
      </div>
    </section>
  );
}
