import type { ReactNode } from 'react';

import { DonutChart } from '@/components/charts/donut-chart';
import { useLanguage } from '@/contexts/language-context';
import type { VisitCount, VisitSummary } from '@/types/visit';
import { VisitFlag } from './visit-flag';
import { countryName, deviceLabel, formatCount, orUnknown, sourceLabel } from './visit-labels';
import { VisitorsBreakdown, type BreakdownRow } from './visitors-breakdown';
import { VisitorsMap } from './visitors-map';

const DEVICE_COLORS: Record<string, string> = {
  Desktop: 'var(--color-blue)',
  Mobile: 'var(--color-green)',
  Tablet: 'var(--color-amber)',
  Bot: 'var(--color-violet)',
};

type Props = {
  summary: VisitSummary;
};

function rowsOf(
  counts: VisitCount[],
  text: (count: VisitCount) => string,
  flag?: (count: VisitCount) => string,
  measure: (count: VisitCount) => number = (count) => count.visitors
): BreakdownRow[] {
  return counts.map((count) => {
    const label: ReactNode = flag ? (
      <>
        <VisitFlag code={flag(count)} />
        {text(count)}
      </>
    ) : (
      text(count)
    );
    return { key: `${count.key}|${count.detail}`, label, title: text(count), value: measure(count) };
  });
}

export function VisitorsBreakdowns({ summary }: Props) {
  const { t, language } = useLanguage();
  const empty = t('visitors.noData');

  const countries = rowsOf(
    summary.countries,
    (count) => countryName(count.key, count.detail, language) || t('visitors.unknown'),
    (count) => count.key
  );
  const cities = rowsOf(summary.cities, (count) => orUnknown(count.key, t), (count) => count.detail);
  const sources = rowsOf(summary.sources, (count) => sourceLabel(count.key, t));
  const pages = rowsOf(summary.pages, (count) => count.key || '/', undefined, (count) => count.views);
  const browsers = rowsOf(summary.browsers, (count) => orUnknown(count.key, t));
  const systems = rowsOf(summary.systems, (count) => orUnknown(count.key, t));

  const devices = summary.devices.map((count) => ({
    label: deviceLabel(count.key, t),
    value: count.visitors,
    color: DEVICE_COLORS[count.key] ?? 'var(--color-muted)',
  }));

  return (
    <>
      <div className="visitors-geo">
        <VisitorsMap points={summary.points} />
        <VisitorsBreakdown title={t('visitors.countries')} rows={countries} emptyText={empty} />
      </div>

      <div className="visitors-grid">
        <VisitorsBreakdown title={t('visitors.cities')} rows={cities} emptyText={empty} />
        <VisitorsBreakdown title={t('visitors.sources')} rows={sources} emptyText={empty} />
        <VisitorsBreakdown title={t('visitors.pages')} rows={pages} emptyText={empty} />
        <VisitorsBreakdown title={t('visitors.browsers')} rows={browsers} emptyText={empty} />
        <VisitorsBreakdown title={t('visitors.systems')} rows={systems} emptyText={empty} />
        <section className="visitors-panel">
          <h2 className="visitors-panel-title">{t('visitors.devices')}</h2>
          {devices.length === 0 ? (
            <p className="visitors-empty">{empty}</p>
          ) : (
            <DonutChart
              slices={devices}
              centerValue={formatCount(summary.visitors)}
              centerLabel={t('visitors.statVisitors')}
              formatValue={formatCount}
              ariaLabel={t('visitors.devices')}
            />
          )}
        </section>
      </div>
    </>
  );
}
