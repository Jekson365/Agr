import { REPORT_SHARES } from '@/config/landing';
import { formatCount } from '@/promo/figures';
import { copy } from '@/promo/locale';
import { easeInOut, enter, fadeUp, slideIn } from '@/promo/motion';
import { useClock } from '@/promo/use-clock';
import '@/promo/screens/report.css';

const SHARE_LABELS: Record<string, string> = {
  crop: copy.report.categoryCrop,
  fruit: copy.report.categoryFruit,
  livestock: copy.report.categoryLivestock,
};

const QUARTERS = [copy.report.quarterQ1, copy.report.quarterQ2, copy.report.quarterQ3, copy.report.quarterQ4].map(
  (label) => label.split(' · ')[0]
);

const REVENUE = [46, 62, 88, 71];
const COST = [30, 36, 44, 40];

function donutStops(amount: number): string {
  let cursor = 0;
  const stops = REPORT_SHARES.map((slice) => {
    const from = cursor * amount;
    cursor += slice.share;
    return `${slice.color} ${from}% ${cursor * amount}%`;
  });
  return [...stops, `var(--color-surface-sunken) ${100 * amount}% 100%`].join(', ');
}

export function ReportScreen({ start }: { start: number }) {
  const time = useClock();
  const base = start + 0.12;
  const draw = enter(time, base + 0.1, 0.8, easeInOut);
  const leading = REPORT_SHARES[0];

  return (
    <>
      <h3 className="promo-screen-title" style={fadeUp(time, base, 16)}>
        {copy.dashboard.report}
      </h3>

      <div className="promo-card promo-share" style={fadeUp(time, base + 0.04, 24)}>
        <div className="promo-card-head">
          <span className="promo-card-title">{copy.landing.reports.chartTitle}</span>
        </div>
        <div className="promo-share-body">
          <div className="promo-donut" style={{ background: `conic-gradient(${donutStops(draw)})` }}>
            <span className="promo-donut-hole">
              <strong>{formatCount(leading.share * draw)}%</strong>
              <span>{SHARE_LABELS[leading.id]}</span>
            </span>
          </div>
          <ul className="promo-share-legend">
            {REPORT_SHARES.map((slice, index) => (
              <li key={slice.id} style={slideIn(time, base + 0.25 + index * 0.08, 40, 0.4)}>
                <span className="promo-legend-dot" style={{ background: slice.color }} />
                <span className="promo-share-label">{SHARE_LABELS[slice.id]}</span>
                <strong>{formatCount(slice.share * enter(time, base + 0.3 + index * 0.08, 0.5))}%</strong>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="promo-card promo-quarters" style={fadeUp(time, base + 0.2, 24)}>
        <div className="promo-card-head">
          <span className="promo-legend">
            <span className="promo-legend-item">
              <span className="promo-legend-dot" />
              {copy.report.colRevenue}
            </span>
            <span className="promo-legend-item">
              <span className="promo-legend-dot is-cost" />
              {copy.report.colCost}
            </span>
          </span>
        </div>
        <div className="promo-quarter-bars">
          {QUARTERS.map((label, index) => {
            const grow = enter(time, base + 0.3 + index * 0.06, 0.55);
            return (
              <div key={label} className="promo-quarter">
                <span className="promo-quarter-pair">
                  <span className="promo-quarter-bar" style={{ height: `${REVENUE[index] * grow}%` }} />
                  <span className="promo-quarter-bar is-cost" style={{ height: `${COST[index] * grow}%` }} />
                </span>
                <span className="promo-quarter-label">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
