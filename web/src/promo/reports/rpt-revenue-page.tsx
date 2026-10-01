import { BarChart } from '@/components/charts/bar-chart';
import { tr } from '@/promo/locale';
import { backOut, easeOut, enter, fadeUp, mix } from '@/promo/motion';
import { FilterIcon } from '@/promo/reports/rpt-icons';
import { dayMonth, HARVESTS } from '@/promo/reports/rpt-sample';
import { TOMATO } from '@/promo/reports/rpt-timeline';

const BARS = HARVESTS.map((harvest) => ({ label: dayMonth(harvest.date), value: harvest.revenue }));

const CATEGORIES = ['report.categoryCrop', 'report.categoryLivestock', 'report.categoryFruit'];

export function RptRevenuePage({ time, since }: { time: number; since: number }) {
  const grow = enter(time, since + 0.5, 0.9, easeOut);
  const badge = enter(time, since + 1.25, 0.45, backOut);

  return (
    <div className="rpt-page" style={fadeUp(time, since, 18, 0.35)}>
      <div className="page-header">
        <h1 className="page-title">{tr('report.title')}</h1>
        <div className="report-header-actions">
          <button type="button" className="currency-toggle">
            GEL
          </button>
          <button type="button" className="filter-toggle">
            <FilterIcon />
          </button>
        </div>
      </div>
      <div className="report-category-row filter-row">
        {CATEGORIES.map((key, index) => (
          <button key={key} type="button" className={index === 0 ? 'kind-chip active' : 'kind-chip'}>
            <span>{tr(key)}</span>
          </button>
        ))}
      </div>
      <div className="report-grid">
        <section className="report-panel rpt-wide" style={{ ['--rpt-grow' as string]: grow }}>
          <h2 className="report-panel-title">{tr('report.harvestRevenueTitle')}</h2>
          <p className="report-panel-subtitle">{tr('report.harvestRevenueSubtitle')}</p>
          <div className="report-panel-body rpt-revenue">
            <BarChart data={BARS} formatValue={(value) => `₾${value}`} />
            <span
              className="rpt-bar-badge"
              style={{ opacity: Math.min(1, badge * 1.5), transform: `translateX(-50%) scale(${mix(0.4, 1, badge)})` }}
            >
              +₾{TOMATO.revenue}
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
