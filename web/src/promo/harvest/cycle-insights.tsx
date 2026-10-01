import { BarChart } from '@/components/charts/bar-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { formatLocalizedIsoDay } from '@/components/ui/date-utils';
import { gradeDistributionBars } from '@/config/assessment-grades';
import { copy, LANGUAGE, tr } from '@/promo/locale';
import { easeOut, enter, fadeUp } from '@/promo/motion';
import { SAMPLE } from '@/promo/harvest/cycle-copy';
import { TOMATO } from '@/promo/harvest/cycle-timeline';
import type { HarvestAssessmentLine } from '@/types/harvest-assessment';
import '@/components/farm/card-menu.css';
import '@/components/harvest/chemical-history.css';
import '@/pages/harvest/detail/harvest-overview.css';
import '@/pages/harvest/grading/harvest-grading-sheet.css';
import '@/pages/harvest/grading/harvest-grading-table.css';

const GRADES: HarvestAssessmentLine[] = [
  { grade: 'A', quantity: 620, wasted: 10 },
  { grade: 'B', quantity: 420, wasted: 25 },
  { grade: 'C', quantity: 180, wasted: 35 },
  { grade: 'D', quantity: 30, wasted: 20 },
];

const GRADED = GRADES.reduce((sum, line) => sum + line.quantity, 0);
const WASTED = GRADES.reduce((sum, line) => sum + line.wasted, 0);
const UNIT = copy.farm.unitKg;
const kg = (value: number) => `${Math.round(value)} ${UNIT}`;
const fill = (template: string, amount: number) => template.replace('{amount}', String(amount)).replace('{unit}', UNIT);

export function OverviewPanel({ time, since, crop }: { time: number; since: number; crop: string }) {
  const grow = enter(time, since + 0.1, 0.7, easeOut);
  const lines = GRADES.map((line) => ({ ...line, quantity: line.quantity * grow, wasted: line.wasted * grow }));

  return (
    <div className="hv-charts">
      <section className="hd-panel" style={fadeUp(time, since, 16, 0.35)}>
        <h2 className="hd-panel-title">{tr('harvest.yieldSummary')}</h2>
        <DonutChart
          slices={[
            { label: tr('harvest.usable'), value: GRADED * grow, color: 'var(--color-green)' },
            { label: tr('harvest.wasted'), value: WASTED * grow, color: 'var(--color-danger)' },
          ]}
          total={TOMATO.yieldKg}
          centerValue={kg(TOMATO.yieldKg)}
          centerLabel={tr('harvest.kpiTotalYield')}
          formatValue={kg}
        />
      </section>
      <section className="hd-panel" style={fadeUp(time, since + 0.08, 16, 0.35)}>
        <h2 className="hd-panel-title">{tr('harvest.gradeDistribution')}</h2>
        <p className="hv-chart-total">
          {crop} · {fill(tr('harvestGrading.graded'), GRADED)}
          <span className="bar-chart-key">
            <span className="bar-chart-key-swatch" />
            {tr('harvest.wasted')}
          </span>
        </p>
        <div className="hv-chart-body">
          <BarChart data={gradeDistributionBars(lines, tr('harvest.usable'), tr('harvest.wasted'))} groupSize={2} formatValue={kg} />
        </div>
      </section>
    </div>
  );
}

export function GradingPanel({ time, since, crop }: { time: number; since: number; crop: string }) {
  const heads = ['assessment.colSize', 'assessment.colWeight', 'assessment.colMoisture', 'assessment.colColor'];

  return (
    <section className="hg-sheet" style={fadeUp(time, since, 16, 0.35)}>
      <div className="hg-sheet-head">
        <h2 className="hg-sheet-title">{crop}</h2>
        <span className="hg-sheet-totals">
          {fill(tr('harvestGrading.harvested'), TOMATO.yieldKg)}
          <span className="hg-sheet-graded">{fill(tr('harvestGrading.graded'), GRADED)}</span>
        </span>
      </div>
      <div className="hg-table-wrap">
        <table className="hg-table">
          <thead>
            <tr>
              <th className="hg-col-grade">{tr('assessment.colGrade')}</th>
              {heads.map((head) => (
                <th key={head} className="hg-col-range">
                  {tr(head)}
                </th>
              ))}
              <th className="hg-col-quantity">{tr('harvestGrading.colQuantity')}</th>
              <th className="hg-col-quantity">{tr('harvestGrading.colWasted')}</th>
            </tr>
          </thead>
          <tbody>
            {GRADES.map((line, index) => {
              const typed = enter(time, since + 0.2 + index * 0.18, 0.45, easeOut);
              return (
                <tr key={line.grade} style={fadeUp(time, since + 0.1 + index * 0.08, 10, 0.3)}>
                  <td className="hg-col-grade">
                    <span className={`hg-grade hg-grade-${line.grade.toLowerCase()}`}>{line.grade}</span>
                  </td>
                  {heads.map((head) => (
                    <td key={head} className="hg-col-range hg-read">
                      —
                    </td>
                  ))}
                  {[line.quantity, line.wasted].map((value, column) => (
                    <td key={column} className="hg-col-quantity">
                      <span className="hg-quantity">
                        <input value={Math.round(value * typed)} readOnly />
                        <span className="hg-unit">{UNIT}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function ChemicalsPanel({ time, since }: { time: number; since: number }) {
  const total = SAMPLE.chemicals.reduce((sum, item) => sum + item.cost, 0);

  return (
    <section className="hd-panel" style={fadeUp(time, since, 16, 0.35)}>
      <div className="chemical-history">
        <div className="chemical-history-header">
          <span className="chemical-history-title">{tr('harvestChemical.title')}</span>
          <span className="chemical-history-total">
            {tr('harvestChemical.total')}: ₾{total}
          </span>
        </div>
        <div className="chemical-history-body">
          <div className="chemical-list">
            {SAMPLE.chemicals.map((item, index) => (
              <div key={item.name} className="chemical-row" style={fadeUp(time, since + 0.15 + index * 0.14, 14, 0.35)}>
                <div className="chemical-row-info">
                  <span className="chemical-row-name">{item.name}</span>
                  <span className="chemical-row-meta">
                    {formatLocalizedIsoDay(item.date, LANGUAGE)} · ₾{item.cost}
                  </span>
                </div>
                <div className="card-menu">
                  <button type="button" className="card-menu-trigger">
                    ⋮
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="add-button">
          + {tr('harvestChemical.add')}
        </button>
      </div>
    </section>
  );
}
